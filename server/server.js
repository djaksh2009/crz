require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const twilio = require("twilio");


/* =====================================================
   FIREBASE
===================================================== */

admin.initializeApp({
    credential:
        admin.credential.cert({
            projectId:
                process.env.FIREBASE_PROJECT_ID,

            clientEmail:
                process.env.FIREBASE_CLIENT_EMAIL,

            privateKey:
                process.env.FIREBASE_PRIVATE_KEY
                    .replace(/\\n/g, "\n")
        })
});


const db =
    admin.firestore();


/* =====================================================
   EXPRESS
===================================================== */

const app =
    express();


app.use(
    cors({
        origin: true
    })
);


app.use(
    express.json()
);


/* =====================================================
   EMAIL
===================================================== */

const mailer =
    nodemailer.createTransport({

        host:
            process.env.SMTP_HOST,

        port:
            Number(
                process.env.SMTP_PORT || 465
            ),

        secure:
            process.env.SMTP_SECURE === "true",

        auth: {

            user:
                process.env.SMTP_USER,

            pass:
                process.env.SMTP_PASSWORD

        }

    });


/* =====================================================
   SMS
===================================================== */

let smsClient =
    null;


if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN
) {

    smsClient =
        twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );

}


/* =====================================================
   HELPERS
===================================================== */

function createToken() {

    return jwt.sign(
        {
            role: "admin"
        },

        process.env.JWT_SECRET,

        {
            expiresIn: "12h"
        }
    );

}


function authenticateAdmin(
    req,
    res,
    next
) {

    const header =
        req.headers.authorization || "";


    const token =
        header.startsWith("Bearer ")
            ? header.slice(7)
            : null;


    if (!token)
        return res
            .status(401)
            .json({
                message:
                    "Admin authentication required."
            });


    try {

        req.admin =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        next();

    } catch {

        res
            .status(401)
            .json({
                message:
                    "Invalid or expired admin session."
            });

    }

}


/* =====================================================
   NOTIFICATIONS
===================================================== */

async function sendEmail(
    to,
    subject,
    html
) {

    if (!process.env.SMTP_USER)
        return;


    await mailer.sendMail({

        from:
            `"CRZ DJ Studio" <${process.env.SMTP_USER}>`,

        to,

        subject,

        html

    });

}


async function sendSMS(
    phone,
    message
) {

    if (
        !smsClient ||
        !process.env.TWILIO_PHONE_NUMBER
    )
        return;


    await smsClient.messages.create({

        body:
            message,

        from:
            process.env.TWILIO_PHONE_NUMBER,

        to:
            phone

    });

}


/* =====================================================
   HEALTH
===================================================== */

app.get(
    "/api/health",
    (req,res) => {

        res.json({

            success:
                true,

            service:
                "CRZ Backend",

            status:
                "online"

        });

    }
);


/* =====================================================
   AVAILABILITY
===================================================== */

app.get(
    "/api/availability",
    async (req,res) => {

        try {

            const date =
                req.query.date;


            if (!date)
                return res
                    .status(400)
                    .json({
                        message:
                            "Date required."
                    });


            const bookingsSnapshot =
                await db
                    .collection("bookings")
                    .where(
                        "date",
                        "==",
                        date
                    )
                    .get();


            const blockedSnapshot =
                await db
                    .collection("blockedSlots")
                    .where(
                        "date",
                        "==",
                        date
                    )
                    .get();


            const bookings =
                bookingsSnapshot.docs.map(
                    doc => ({
                        id:
                            doc.id,

                        ...doc.data()
                    })
                );


            const blocked =
                blockedSnapshot.docs.map(
                    doc => ({
                        id:
                            doc.id,

                        ...doc.data()
                    })
                );


            res.json({

                bookings,

                blocked

            });


        } catch (error) {

            console.error(error);


            res
                .status(500)
                .json({
                    message:
                        "Availability check failed."
                });

        }

    }
);


/* =====================================================
   CREATE BOOKING
===================================================== */

app.post(
    "/api/bookings",
    async (req,res) => {

        try {

            const {

                name,
                email,
                phone,
                date,
                time,
                service,
                serviceName,
                amount

            } = req.body;


            if (
                !name ||
                !email ||
                !phone ||
                !date ||
                !time ||
                !service
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Complete booking details required."
                    });

            }


            /*
               Transaction prevents two people
               booking the same slot simultaneously.
            */

            const bookingRef =
                db
                    .collection("bookings")
                    .doc();


            const result =
                await db.runTransaction(
                    async transaction => {

                        const bookingsSnapshot =
                            await transaction.get(
                                db
                                    .collection("bookings")
                                    .where(
                                        "date",
                                        "==",
                                        date
                                    )
                            );


                        const blockedSnapshot =
                            await transaction.get(
                                db
                                    .collection("blockedSlots")
                                    .where(
                                        "date",
                                        "==",
                                        date
                                    )
                            );


                        const alreadyBooked =
                            bookingsSnapshot.docs.some(
                                doc => {

                                    const data =
                                        doc.data();

                                    return (
                                        data.time === time &&
                                        data.status !== "cancelled"
                                    );

                                }
                            );


                        const blocked =
                            blockedSnapshot.docs.some(
                                doc =>
                                    doc.data().time === time
                            );


                        if (
                            alreadyBooked ||
                            blocked
                        ) {

                            throw new Error(
                                "SLOT_UNAVAILABLE"
                            );

                        }


                        const booking = {

                            name,

                            email,

                            phone,

                            date,

                            time,

                            service,

                            serviceName,

                            amount:

                                Number(
                                    amount || 0
                                ),

                            status:
                                "pending",

                            paymentStatus:
                                "pending",

                            createdAt:
                                admin.firestore
                                    .FieldValue
                                    .serverTimestamp()

                        };


                        transaction.set(
                            bookingRef,
                            booking
                        );


                        return booking;

                    }
                );


            /*
               Customer receives a request
               acknowledgement.

               This is NOT payment confirmation.
            */

            await sendEmail(

                email,

                "CRZ Booking Request Received",

                `
                <h2>CRZ — Booking Request</h2>

                <p>Hi ${name},</p>

                <p>
                    We received your booking request.
                </p>

                <p>
                    <b>Date:</b> ${date}<br>
                    <b>Time:</b> ${time}<br>
                    <b>Service:</b> ${serviceName}
                </p>

                <p>
                    Your booking is currently pending.
                    CRZ will confirm payment and the booking separately.
                </p>
                `

            );


            await sendSMS(

                phone,

                `CRZ: Booking request received for ${date}, ${time}. Your booking is pending confirmation.`

            );


            /*
               Notify admin.
            */

            await sendEmail(

                process.env.CRZ_ADMIN_EMAIL,

                "New CRZ Booking Request",

                `
                <h2>New CRZ Booking</h2>

                <p>
                    <b>Name:</b> ${name}<br>
                    <b>Email:</b> ${email}<br>
                    <b>Phone:</b> ${phone}<br>
                    <b>Date:</b> ${date}<br>
                    <b>Time:</b> ${time}<br>
                    <b>Service:</b> ${serviceName}<br>
                    <b>Amount:</b> ₹${amount}
                </p>
                `

            );


            res.json({

                success:
                    true,

                bookingId:
                    bookingRef.id,

                message:
                    "Booking request received."

            });


        } catch (error) {

            if (
                error.message ===
                "SLOT_UNAVAILABLE"
            ) {

                return res
                    .status(409)
                    .json({
                        message:
                            "That slot is already booked or unavailable."
                    });

            }


            console.error(error);


            res
                .status(500)
                .json({
                    message:
                        "Could not create booking."
                });

        }

    }
);


/* =====================================================
   ADMIN LOGIN
===================================================== */

app.post(
    "/api/admin/login",
    (req,res) => {

        const {
            email,
            password
        } = req.body;


        if (
            email !==
                process.env.ADMIN_EMAIL ||
            password !==
                process.env.ADMIN_PASSWORD
        ) {

            return res
                .status(401)
                .json({
                    message:
                        "Invalid admin credentials."
                });

        }


        res.json({

            success:
                true,

            token:
                createToken()

        });

    }
);


/* =====================================================
   ADMIN DASHBOARD
===================================================== */

app.get(
    "/api/admin/dashboard",
    authenticateAdmin,
    async (req,res) => {

        try {

            const snapshot =
                await db
                    .collection("bookings")
                    .orderBy(
                        "createdAt",
                        "desc"
                    )
                    .get();


            const bookings =
                snapshot.docs.map(
                    doc => ({
                        id:
                            doc.id,

                        ...doc.data()
                    })
                );


            const blockedSnapshot =
                await db
                    .collection("blockedSlots")
                    .orderBy(
                        "date"
                    )
                    .get();


            const blocked =
                blockedSnapshot.docs.map(
                    doc => ({
                        id:
                            doc.id,

                        ...doc.data()
                    })
                );


            const today =
                new Date()
                    .toISOString()
                    .slice(0,10);


            const todayCount =
                bookings.filter(
                    b =>
                        b.date === today &&
                        b.status !== "cancelled"
                ).length;


            const futureCount =
                bookings.filter(
                    b =>
                        b.date > today &&
                        b.status !== "cancelled"
                ).length;


            const pendingPaymentCount =
                bookings.filter(
                    b =>
                        b.paymentStatus ===
                        "pending" &&
                        b.status !==
                        "cancelled"
                ).length;


            const revenue =
                bookings
                    .filter(
                        b =>
                            b.paymentStatus ===
                            "confirmed"
                    )
                    .reduce(
                        (
                            total,
                            b
                        ) =>
                            total +
                            Number(
                                b.amount || 0
                            ),
                        0
                    );


            res.json({

                bookings,

                blocked,

                todayCount,

                futureCount,

                pendingPaymentCount,

                revenue

            });


        } catch (error) {

            console.error(error);


            res
                .status(500)
                .json({
                    message:
                        "Dashboard failed."
                });

        }

    }
);


/* =====================================================
   PAYMENT CONFIRMED
===================================================== */

app.post(
    "/api/admin/bookings/:id/payment",
    authenticateAdmin,
    async (req,res) => {

        try {

            const ref =
                db
                    .collection("bookings")
                    .doc(
                        req.params.id
                    );


            const snapshot =
                await ref.get();


            if (!snapshot.exists)
                return res
                    .status(404)
                    .json({
                        message:
                            "Booking not found."
                    });


            const booking =
                snapshot.data();


            await ref.update({

                paymentStatus:
                    "confirmed",

                paymentConfirmedAt:
                    admin.firestore
                        .FieldValue
                        .serverTimestamp()

            });


            /*
               Payment confirmation email.
            */

            await sendEmail(

                booking.email,

                "CRZ Payment Confirmed",

                `
                <h2>CRZ — Payment Confirmed</h2>

                <p>
                    Hi ${booking.name},
                </p>

                <p>
                    Your payment has been confirmed.
                </p>

                <p>
                    <b>Date:</b> ${booking.date}<br>
                    <b>Time:</b> ${booking.time}<br>
                    <b>Service:</b> ${booking.serviceName}
                </p>

                <p>
                    Your booking is now ready for final confirmation.
                </p>
                `

            );


            await sendSMS(

                booking.phone,

                `CRZ: Payment confirmed for your ${booking.date} ${booking.time} session. Booking confirmation will follow.`

            );


            res.json({

                success:
                    true

            });


        } catch (error) {

            console.error(error);


            res
                .status(500)
                .json({
                    message:
                        "Could not confirm payment."
                });

        }

    }
);


/* =====================================================
   BOOKING CONFIRMED
===================================================== */

app.post(
    "/api/admin/bookings/:id/confirm",
    authenticateAdmin,
    async (req,res) => {

        try {

            const ref =
                db
                    .collection("bookings")
                    .doc(
                        req.params.id
                    );


            const snapshot =
                await ref.get();


            if (!snapshot.exists)
                return res
                    .status(404)
                    .json({
                        message:
                            "Booking not found."
                    });


            const booking =
                snapshot.data();


            if (
                booking.paymentStatus !==
                "confirmed"
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Payment must be confirmed first."
                    });

            }


            await ref.update({

                status:
                    "confirmed",

                confirmedAt:
                    admin.firestore
                        .FieldValue
                        .serverTimestamp()

            });


            /*
               Booking confirmation email.
            */

            await sendEmail(

                booking.email,

                "CRZ Booking Confirmed",

                `
                <h2>CRZ — Booking Confirmed</h2>

                <p>
                    Hi ${booking.name},
                </p>

                <p>
                    Your CRZ session is officially confirmed.
                </p>

                <p>
                    <b>Date:</b> ${booking.date}<br>
                    <b>Time:</b> ${booking.time}<br>
                    <b>Service:</b> ${booking.serviceName}
                </p>

                <p>
                    See you at CRZ Bengaluru.
                </p>
                `

            );


            await sendSMS(

                booking.phone,

                `CRZ: Your booking is CONFIRMED for ${booking.date}, ${booking.time}. See you at CRZ Bengaluru.`

            );


            res.json({

                success:
                    true

            });


        } catch (error) {

            console.error(error);


            res
                .status(500)
                .json({
                    message:
                        "Could not confirm booking."
                });

        }

    }
);


/* =====================================================
   STATUS
===================================================== */

app.patch(
    "/api/admin/bookings/:id/status",
    authenticateAdmin,
    async (req,res) => {

        try {

            const status =
                req.body.status;


            const allowed = [

                "pending",

                "confirmed",

                "completed",

                "cancelled"

            ];


            if (
                !allowed.includes(
                    status
                )
            )
                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid booking status."
                    });


            await db
                .collection("bookings")
                .doc(
                    req.params.id
                )
                .update({

                    status

                });


            res.json({

                success:
                    true

            });


        } catch (error) {

            console.error(error);


            res
                .status(500)
                .json({
                    message:
                        "Could not update status."
                });

        }

    }
);


/* =====================================================
   BLOCK SLOT
===================================================== */

app.post(
    "/api/admin/block",
    authenticateAdmin,
    async (req,res) => {

        try {

            const {
                date,
                time,
                reason
            } = req.body;


            const bookingSnapshot =
                await db
                    .collection("bookings")
                    .where(
                        "date",
                        "==",
                        date
                    )
                    .get();


            const conflictingBooking =
                bookingSnapshot.docs.some(
                    doc => {

                        const booking =
                            doc.data();


                        return (
                            booking.time === time &&
                            booking.status !==
                                "cancelled"
                        );

                    }
                );


            if (
                conflictingBooking
            ) {

                return res
                    .status(409)
                    .json({
                        message:
                            "A booking already exists for this slot."
                    });

            }


            await db
                .collection("blockedSlots")
                .add({

                    date,

                    time,

                    reason:
                        reason ||
                        "Blocked by CRZ admin",

                    createdAt:
                        admin.firestore
                            .FieldValue
                            .serverTimestamp()

                });


            res.json({

                success:
                    true

            });


        } catch (error) {

            console.error(error);


            res
                .status(500)
                .json({
                    message:
                        "Could not block slot."
                });

        }

    }
);


/* =====================================================
   START
===================================================== */

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    () => {

        console.log(
            `CRZ backend running on port ${PORT}`
        );

    }
);
