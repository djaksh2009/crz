import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import Razorpay from "razorpay";
import crypto from "crypto";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

app.use(express.json());


/* =====================================================
   FIREBASE
===================================================== */

const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
    credential:
        admin.credential.cert(
            serviceAccount
        )
});

const db =
    admin.firestore();


/* =====================================================
   RAZORPAY
===================================================== */

const razorpay =
    new Razorpay({
        key_id:
            process.env.RAZORPAY_KEY_ID,

        key_secret:
            process.env.RAZORPAY_KEY_SECRET
    });


/* =====================================================
   EMAIL / RESEND
===================================================== */

async function sendEmail({
    to,
    subject,
    html
}) {

    const response =
        await fetch(
            "https://api.resend.com/emails",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Bearer ${process.env.RESEND_API_KEY}`,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    from:
                        process.env.EMAIL_FROM,

                    to: [to],

                    subject,

                    html
                })
            }
        );

    const result =
        await response.json();

    if (!response.ok) {

        throw new Error(
            result.message ||
            "Email failed."
        );
    }

    return result;
}


/* =====================================================
   SMS / MSG91
===================================================== */

async function sendSMS({
    phone,
    variables
}) {

    /*
     * MSG91 Flow API.
     *
     * Your MSG91 account must have:
     *
     * - DLT entity registered
     * - approved sender/header
     * - approved DLT template
     *
     * Put the approved template ID in:
     *
     * MSG91_BOOKING_TEMPLATE_ID
     */

    const mobile =
        String(phone)
            .replace(/\D/g, "")
            .replace(/^91/, "");

    const response =
        await fetch(
            process.env.MSG91_FLOW_URL ||
            "https://control.msg91.com/api/v5/flow",
            {
                method: "POST",

                headers: {

                    "authkey":
                        process.env.MSG91_AUTH_KEY,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    template_id:
                        process.env.MSG91_BOOKING_TEMPLATE_ID,

                    short_url:
                        "0",

                    recipients: [

                        {
                            mobiles:
                                `91${mobile}`,

                            VAR1:
                                variables.name,

                            VAR2:
                                variables.date,

                            VAR3:
                                variables.time,

                            VAR4:
                                variables.amount
                        }

                    ]
                })
            }
        );

    const result =
        await response.json();

    if (!response.ok) {

        throw new Error(
            result.message ||
            "SMS failed."
        );
    }

    return result;
}


/* =====================================================
   NOTIFICATIONS
===================================================== */

async function sendPaymentConfirmed(booking) {

    const amount =
        `₹${Number(
            booking.total
        ).toLocaleString("en-IN")}`;

    await sendEmail({

        to:
            booking.email,

        subject:
            "CRZ — Payment Confirmed",

        html: `
            <div style="
                font-family:Arial;
                max-width:600px;
                margin:auto;
                background:#0b0b0b;
                color:white;
                padding:40px;
            ">

                <h1>
                    CRZ<span style="color:#ff1744">.</span>
                </h1>

                <h2>Payment Confirmed</h2>

                <p>
                    Hi ${escapeHTML(booking.name)},
                </p>

                <p>
                    Your payment of
                    <strong>${amount}</strong>
                    has been received.
                </p>

                <p>
                    Your booking is now being confirmed.
                </p>

            </div>
        `
    });

    await sendSMS({

        phone:
            booking.phone,

        variables: {
            name:
                booking.name,

            date:
                booking.date,

            time:
                booking.time,

            amount
        }
    });
}


async function sendBookingConfirmed(booking) {

    const amount =
        `₹${Number(
            booking.total
        ).toLocaleString("en-IN")}`;

    await sendEmail({

        to:
            booking.email,

        subject:
            "CRZ — Booking Confirmed",

        html: `
            <div style="
                font-family:Arial;
                max-width:600px;
                margin:auto;
                background:#0b0b0b;
                color:white;
                padding:40px;
            ">

                <h1>
                    CRZ<span style="color:#ff1744">.</span>
                </h1>

                <h2>Booking Confirmed ✓</h2>

                <p>
                    Hi ${escapeHTML(booking.name)},
                </p>

                <p>
                    Your CRZ session is confirmed.
                </p>

                <hr style="
                    border:0;
                    border-top:1px solid #333;
                ">

                <p>
                    <strong>Date:</strong>
                    ${escapeHTML(booking.date)}
                </p>

                <p>
                    <strong>Time:</strong>
                    ${escapeHTML(booking.time)}
                </p>

                <p>
                    <strong>Service:</strong>
                    ${escapeHTML(booking.serviceName)}
                </p>

                <p>
                    <strong>Paid:</strong>
                    ${amount}
                </p>

            </div>
        `
    });

    await sendSMS({

        phone:
            booking.phone,

        variables: {
            name:
                booking.name,

            date:
                booking.date,

            time:
                booking.time,

            amount
        }
    });


    /*
     * ADMIN NOTIFICATION
     */

    await sendEmail({

        to:
            process.env.ADMIN_EMAIL,

        subject:
            `CRZ — New Booking — ${booking.date} ${booking.time}`,

        html: `
            <h2>New CRZ Booking</h2>

            <p>
                <strong>Name:</strong>
                ${escapeHTML(booking.name)}
            </p>

            <p>
                <strong>Email:</strong>
                ${escapeHTML(booking.email)}
            </p>

            <p>
                <strong>Phone:</strong>
                ${escapeHTML(booking.phone)}
            </p>

            <p>
                <strong>Date:</strong>
                ${escapeHTML(booking.date)}
            </p>

            <p>
                <strong>Time:</strong>
                ${escapeHTML(booking.time)}
            </p>

            <p>
                <strong>Service:</strong>
                ${escapeHTML(booking.serviceName)}
            </p>

            <p>
                <strong>Total:</strong>
                ₹${Number(
                    booking.total
                ).toLocaleString("en-IN")}
            </p>
        `
    });
}


/* =====================================================
   SLOT HELPERS
===================================================== */

function slotId(date, time) {

    return `${date}__${time}`
        .replaceAll("/", "-")
        .replaceAll(" ", "_")
        .replaceAll("–", "-");
}


/* =====================================================
   CHECK SLOT
===================================================== */

app.get(
    "/api/slot-status",
    async (req, res) => {

        try {

            const {
                date,
                time
            } = req.query;

            if (!date || !time) {

                return res.status(400).json({
                    error:
                        "Date and time required."
                });
            }

            const id =
                slotId(date, time);

            const slot =
                await db
                    .collection("slots")
                    .doc(id)
                    .get();

            if (!slot.exists) {

                return res.json({
                    available: true
                });
            }

            const data =
                slot.data();

            if (
                data.type === "blocked" ||
                data.type === "booking"
            ) {

                return res.json({
                    available: false
                });
            }

            res.json({
                available: true
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Could not check availability."
            });
        }
    }
);


/* =====================================================
   CREATE BOOKING
===================================================== */

app.post(
    "/api/bookings/create",
    async (req, res) => {

        try {

            const {
                name,
                email,
                phone,
                date,
                time,
                service
            } = req.body;

            const prices = {
                250: "Practice",
                400: "Practice + Audio",
                500: "Practice + Audio + Video",
                1500: "Edited Recording"
            };

            if (
                !name ||
                !email ||
                !phone ||
                !date ||
                !time ||
                !prices[service]
            ) {

                return res.status(400).json({
                    error:
                        "Invalid booking information."
                });
            }

            const total =
                Number(service);

            const slot =
                slotId(date, time);

            const slotRef =
                db.collection("slots")
                    .doc(slot);

            const bookingRef =
                db.collection("bookings")
                    .doc();

            await db.runTransaction(
                async transaction => {

                    const existing =
                        await transaction.get(
                            slotRef
                        );

                    if (existing.exists) {

                        throw new Error(
                            "SLOT_UNAVAILABLE"
                        );
                    }

                    transaction.set(
                        slotRef,
                        {
                            type:
                                "booking",

                            bookingId:
                                bookingRef.id,

                            date,
                            time,

                            status:
                                "pending_payment",

                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp()
                        }
                    );

                    transaction.set(
                        bookingRef,
                        {

                            name,
                            email,
                            phone,

                            date,
                            time,

                            service:
                                Number(service),

                            serviceName:
                                prices[service],

                            total,

                            status:
                                "pending_payment",

                            paymentStatus:
                                "pending",

                            slotId:
                                slot,

                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp()
                        }
                    );
                }
            );

            const order =
                await razorpay.orders.create({

                    amount:
                        total * 100,

                    currency:
                        "INR",

                    receipt:
                        bookingRef.id,

                    notes: {
                        bookingId:
                            bookingRef.id,

                        date,
                        time
                    }
                });

            await bookingRef.update({

                razorpayOrderId:
                    order.id

            });

            res.json({

                success: true,

                bookingId:
                    bookingRef.id,

                razorpayKey:
                    process.env.RAZORPAY_KEY_ID,

                razorpayOrder:
                    order

            });

        } catch (error) {

            if (
                error.message ===
                "SLOT_UNAVAILABLE"
            ) {

                return res.status(409).json({
                    error:
                        "That time slot is already booked."
                });
            }

            console.error(error);

            res.status(500).json({
                error:
                    "Unable to create booking."
            });
        }
    }
);


/* =====================================================
   VERIFY PAYMENT
===================================================== */

app.post(
    "/api/payments/verify",
    async (req, res) => {

        try {

            const {
                bookingId,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            } = req.body;

            const expectedSignature =
                crypto
                    .createHmac(
                        "sha256",
                        process.env.RAZORPAY_KEY_SECRET
                    )
                    .update(
                        `${razorpay_order_id}|${razorpay_payment_id}`
                    )
                    .digest("hex");

            if (
                expectedSignature !==
                razorpay_signature
            ) {

                return res.status(400).json({
                    error:
                        "Invalid payment signature."
                });
            }

            const bookingRef =
                db
                    .collection("bookings")
                    .doc(bookingId);

            const bookingSnapshot =
                await bookingRef.get();

            if (!bookingSnapshot.exists) {

                return res.status(404).json({
                    error:
                        "Booking not found."
                });
            }

            const booking =
                bookingSnapshot.data();

            if (
                booking.paymentStatus ===
                "paid"
            ) {

                return res.json({
                    success: true
                });
            }

            await bookingRef.update({

                paymentStatus:
                    "paid",

                status:
                    "confirmed",

                razorpayPaymentId:
                    razorpay_payment_id,

                paidAt:
                    admin.firestore.FieldValue.serverTimestamp()
            });

            const confirmedBooking = {

                ...booking,

                paymentStatus:
                    "paid",

                status:
                    "confirmed"
            };

            /*
             * 1ST NOTIFICATION
             * PAYMENT CONFIRMED
             */

            try {

                await sendPaymentConfirmed(
                    confirmedBooking
                );

            } catch (notificationError) {

                console.error(
                    "Payment notification failed:",
                    notificationError
                );
            }


            /*
             * 2ND NOTIFICATION
             * BOOKING CONFIRMED
             */

            try {

                await sendBookingConfirmed(
                    confirmedBooking
                );

            } catch (notificationError) {

                console.error(
                    "Booking notification failed:",
                    notificationError
                );
            }

            res.json({
                success: true
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Payment verification failed."
            });
        }
    }
);


/* =====================================================
   ADMIN AUTH
===================================================== */

function checkAdmin(req, res, next) {

    const auth =
        req.headers.authorization || "";

    const token =
        auth.replace(
            "Bearer ",
            ""
        );

    if (
        !token ||
        token !==
            process.env.ADMIN_TOKEN
    ) {

        return res.status(401).json({
            error:
                "Unauthorized."
        });
    }

    next();
}


app.post(
    "/api/admin/login",
    async (req, res) => {

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

            return res.status(401).json({
                error:
                    "Invalid email or password."
            });
        }

        res.json({

            success: true,

            token:
                process.env.ADMIN_TOKEN
        });
    }
);


/* =====================================================
   ADMIN DASHBOARD
===================================================== */

app.get(
    "/api/admin/dashboard",
    checkAdmin,
    async (req, res) => {

        try {

            const bookingSnapshot =
                await db
                    .collection("bookings")
                    .orderBy(
                        "createdAt",
                        "desc"
                    )
                    .limit(200)
                    .get();

            const bookings =
                bookingSnapshot.docs.map(
                    doc => ({
                        id: doc.id,
                        ...doc.data()
                    })
                );

            const blockedSnapshot =
                await db
                    .collection("blockedSlots")
                    .orderBy(
                        "date",
                        "asc"
                    )
                    .get();

            const blockedSlots =
                blockedSnapshot.docs.map(
                    doc => ({
                        id: doc.id,
                        ...doc.data()
                    })
                );

            const today =
                new Date()
                    .toISOString()
                    .slice(0,10);

            const confirmed =
                bookings.filter(
                    booking =>
                        booking.status ===
                        "confirmed"
                );

            const todayCount =
                confirmed.filter(
                    booking =>
                        booking.date === today
                ).length;

            const futureCount =
                confirmed.filter(
                    booking =>
                        booking.date > today
                ).length;

            const completedCount =
                confirmed.filter(
                    booking =>
                        booking.date < today
                ).length;

            const revenue =
                confirmed.reduce(
                    (sum, booking) =>
                        sum +
                        Number(
                            booking.total || 0
                        ),
                    0
                );

            res.json({

                bookings,

                blockedSlots,

                stats: {

                    today:
                        todayCount,

                    future:
                        futureCount,

                    completed:
                        completedCount,

                    revenue
                }
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Dashboard failed."
            });
        }
    }
);


/* =====================================================
   BLOCK ANY DATE + ANY TIME
===================================================== */

app.post(
    "/api/admin/block-slot",
    checkAdmin,
    async (req, res) => {

        try {

            const {
                date,
                time,
                reason
            } = req.body;

            if (!date || !time) {

                return res.status(400).json({
                    error:
                        "Date and time required."
                });
            }

            const id =
                slotId(date, time);

            const slotRef =
                db.collection("slots")
                    .doc(id);

            const blockedRef =
                db.collection("blockedSlots")
                    .doc(id);

            await db.runTransaction(
                async transaction => {

                    const existing =
                        await transaction.get(
                            slotRef
                        );

                    if (existing.exists) {

                        const data =
                            existing.data();

                        if (
                            data.type ===
                            "booking"
                        ) {

                            throw new Error(
                                "ALREADY_BOOKED"
                            );
                        }
                    }

                    transaction.set(
                        slotRef,
                        {
                            type:
                                "blocked",

                            date,
                            time,

                            reason:
                                reason ||
                                "Blocked by admin",

                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp()
                        }
                    );

                    transaction.set(
                        blockedRef,
                        {
                            date,
                            time,

                            reason:
                                reason ||
                                "Blocked by admin",

                            createdAt:
                                admin.firestore.FieldValue.serverTimestamp()
                        }
                    );
                }
            );

            res.json({
                success: true
            });

        } catch (error) {

            if (
                error.message ===
                "ALREADY_BOOKED"
            ) {

                return res.status(409).json({
                    error:
                        "This slot already has a booking."
                });
            }

            console.error(error);

            res.status(500).json({
                error:
                    "Unable to block slot."
            });
        }
    }
);


/* =====================================================
   UNBLOCK
===================================================== */

app.post(
    "/api/admin/unblock-slot",
    checkAdmin,
    async (req, res) => {

        try {

            const {
                id
            } = req.body;

            if (!id) {

                return res.status(400).json({
                    error:
                        "Slot ID required."
                });
            }

            await db
                .collection("blockedSlots")
                .doc(id)
                .delete();

            const slotRef =
                db
                    .collection("slots")
                    .doc(id);

            const slot =
                await slotRef.get();

            if (
                slot.exists &&
                slot.data().type ===
                    "blocked"
            ) {

                await slotRef.delete();
            }

            res.json({
                success: true
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    "Unable to unblock slot."
            });
        }
    }
);


/* =====================================================
   EMAIL/SMS TEST
===================================================== */

app.post(
    "/api/admin/test-notifications",
    checkAdmin,
    async (req, res) => {

        const {
            email,
            phone
        } = req.body;

        try {

            if (email) {

                await sendEmail({

                    to: email,

                    subject:
                        "CRZ — Test Email",

                    html: `
                        <h2>CRZ Test Email ✓</h2>
                        <p>
                            Your CRZ email notification
                            system is working.
                        </p>
                    `
                });
            }

            if (phone) {

                await sendSMS({

                    phone,

                    variables: {

                        name:
                            "CRZ Test",

                        date:
                            "Test",

                        time:
                            "Test",

                        amount:
                            "₹0"
                    }
                });
            }

            res.json({
                success: true
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    error.message
            });
        }
    }
);


/* =====================================================
   HEALTH
===================================================== */

app.get(
    "/",
    (req, res) => {

        res.json({
            status:
                "online",

            message:
                "CRZ backend is working 🚀"
        });
    }
);


/* =====================================================
   HELPERS
===================================================== */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =====================================================
   START
===================================================== */

const PORT =
    process.env.PORT || 5000;

app.listen(
    PORT,
    () => {

        console.log(
            `CRZ backend running on ${PORT}`
        );
    }
);
