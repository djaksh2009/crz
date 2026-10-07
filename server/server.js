import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json({ limit: "100kb" }));

// ============================================================
// FILE STORAGE
// ============================================================

const DATA_DIR = path.join(__dirname, "data");
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const BLOCKED_FILE = path.join(DATA_DIR, "blocked.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

function ensureJson(file) {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, "[]\n", "utf8");
    }
}

ensureJson(BOOKINGS_FILE);
ensureJson(BLOCKED_FILE);

function readJson(file) {
    try {
        const data = JSON.parse(
            fs.readFileSync(file, "utf8")
        );

        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function writeJson(file, data) {
    const temp = `${file}.${process.pid}.tmp`;

    fs.writeFileSync(
        temp,
        JSON.stringify(data, null, 2) + "\n",
        "utf8"
    );

    fs.renameSync(temp, file);
}

// ============================================================
// HELPERS
// ============================================================

function generateId() {
    return `CRZ-${Date.now()
        .toString(36)
        .toUpperCase()}-${crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function validEmail(value) {
    return (
        typeof value === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    );
}

function validPhone(value) {
    return (
        typeof value === "string" &&
        /^[+\d][\d\s().-]{7,19}$/.test(value)
    );
}

function validDate(value) {
    return (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(
            Date.parse(`${value}T00:00:00Z`)
        )
    );
}

function today() {
    return new Date()
        .toISOString()
        .slice(0, 10);
}

// ============================================================
// SERVICES
// ============================================================

const SERVICES = {
    "250": {
        id: "250",
        name: "Practice",
        price: 250
    },

    "400": {
        id: "400",
        name: "Practice + Audio",
        price: 400
    },

    "500": {
        id: "500",
        name: "Practice + Audio + Video",
        price: 500
    },

    "1500": {
        id: "1500",
        name: "Edited Recording",
        price: 1500
    }
};

// ============================================================
// TIME SLOTS
// ============================================================

const TIME_SLOTS = [
    "09:00 AM – 10:00 AM",
    "10:00 AM – 11:00 AM",
    "11:00 AM – 12:00 PM",
    "12:00 PM – 01:00 PM",
    "01:00 PM – 02:00 PM",
    "02:00 PM – 03:00 PM",
    "03:00 PM – 04:00 PM",
    "04:00 PM – 05:00 PM",
    "05:00 PM – 06:00 PM",
    "06:00 PM – 07:00 PM",
    "07:00 PM – 08:00 PM"
];

// ============================================================
// DATA
// ============================================================

function getBookings() {
    return readJson(BOOKINGS_FILE);
}

function getBlocked() {
    return readJson(BLOCKED_FILE);
}

function slotTaken(date, time) {
    const bookings = getBookings();
    const blocked = getBlocked();

    const bookingExists = bookings.some(
        booking =>
            booking.date === date &&
            booking.time === time &&
            booking.status !== "cancelled"
    );

    const blockedExists = blocked.some(
        slot =>
            slot.date === date &&
            slot.time === time
    );

    return bookingExists || blockedExists;
}

// ============================================================
// BOOKING SANITIZATION
// ============================================================

function publicBooking(booking) {
    return {
        id: booking.id,
        bookingId: booking.id,

        name: booking.name,
        customerName: booking.name,

        email: booking.email,
        phone: booking.phone,

        date: booking.date,
        time: booking.time,

        service: booking.service,
        serviceName: booking.serviceName,

        total: booking.total,

        status: booking.status,
        paymentStatus: booking.paymentStatus,

        utr: booking.utr || null,

        createdAt: booking.createdAt,
        paidAt: booking.paidAt || null,
        confirmedAt: booking.confirmedAt || null
    };
}

// ============================================================
// RESEND
// ============================================================

async function sendEmail({
    to,
    subject,
    html
}) {
    if (
        !process.env.RESEND_API_KEY ||
        !process.env.RESEND_FROM_EMAIL
    ) {
        console.log(
            "Resend is not configured. Email skipped."
        );

        return;
    }

    const response = await fetch(
        "https://api.resend.com/emails",
        {
            method: "POST",

            headers: {
                Authorization:
                    `Bearer ${process.env.RESEND_API_KEY}`,

                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                from:
                    process.env.RESEND_FROM_EMAIL,

                to: [to],

                subject,

                html
            })
        }
    );

    if (!response.ok) {
        const text = await response.text();

        throw new Error(
            `Resend failed: ${response.status} ${text}`
        );
    }
}

// ============================================================
// PAYMENT SUBMITTED EMAIL
// ============================================================

async function sendPaymentSubmittedEmail(
    booking
) {
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>

<body style="
margin:0;
background:#080808;
color:#f5f5f5;
font-family:Arial,sans-serif;
">

<div style="
max-width:620px;
margin:auto;
padding:40px 20px;
">

<div style="
font-size:28px;
font-weight:900;
letter-spacing:3px;
">
CRZ <span style="color:#1846ff">//</span> DJ STUDIO
</div>

<div style="
margin-top:30px;
background:#111;
border:1px solid #292929;
padding:30px;
">

<div style="
font-size:11px;
letter-spacing:2px;
color:#777;
">
PAYMENT SUBMITTED
</div>

<h1>
Thanks, ${escapeHtml(booking.name)}.
</h1>

<p>
We've received your payment details.
Your booking is now awaiting verification.
</p>

<p>
<strong>Booking ID:</strong>
${escapeHtml(booking.id)}
<br>

<strong>Service:</strong>
${escapeHtml(booking.serviceName)}
<br>

<strong>Date:</strong>
${escapeHtml(booking.date)}
<br>

<strong>Time:</strong>
${escapeHtml(booking.time)}
<br>

<strong>Amount:</strong>
₹${booking.total.toLocaleString("en-IN")}
<br>

<strong>UTR:</strong>
${escapeHtml(booking.utr)}
</p>

<p style="color:#999">
Your booking will be confirmed after CRZ verifies
the payment.
</p>

</div>

</div>

</body>
</html>
`;

    try {
        await sendEmail({
            to: booking.email,
            subject:
                `CRZ — Payment Submitted (${booking.id})`,
            html
        });
    } catch (error) {
        console.error(
            "Payment email failed:",
            error.message
        );
    }
}

// ============================================================
// CONFIRMATION EMAIL
// ============================================================

async function sendConfirmationEmail(
    booking
) {
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>

<body style="
margin:0;
background:#080808;
color:#f5f5f5;
font-family:Arial,sans-serif;
">

<div style="
max-width:620px;
margin:auto;
padding:40px 20px;
">

<div style="
font-size:28px;
font-weight:900;
letter-spacing:3px;
">
CRZ <span style="color:#1846ff">//</span> DJ STUDIO
</div>

<div style="
margin-top:30px;
background:#111;
border:1px solid #292929;
padding:30px;
">

<div style="
font-size:11px;
letter-spacing:2px;
color:#1846ff;
">
BOOKING CONFIRMED
</div>

<h1>
You're booked, ${escapeHtml(booking.name)}.
</h1>

<p>
Your CRZ session has been confirmed.
</p>

<p>
<strong>Booking ID:</strong>
${escapeHtml(booking.id)}
<br>

<strong>Service:</strong>
${escapeHtml(booking.serviceName)}
<br>

<strong>Date:</strong>
${escapeHtml(booking.date)}
<br>

<strong>Time:</strong>
${escapeHtml(booking.time)}
<br>

<strong>Amount:</strong>
₹${booking.total.toLocaleString("en-IN")}
<br>

<strong>Payment:</strong>
PAID
</p>

<p style="color:#999">
Please keep your booking ID for reference.
</p>

</div>

</div>

</body>
</html>
`;

    try {
        await sendEmail({
            to: booking.email,
            subject:
                `CRZ — Booking Confirmed (${booking.id})`,
            html
        });
    } catch (error) {
        console.error(
            "Confirmation email failed:",
            error.message
        );
    }
}

// ============================================================
// ADMIN AUTH
// ============================================================

function requireAdmin(req, res, next) {
    const header =
        req.headers.authorization || "";

    const token =
        header.startsWith("Bearer ")
            ? header.slice(7)
            : "";

    const expected =
        process.env.ADMIN_TOKEN || "";

    if (
        !token ||
        !expected ||
        token !== expected
    ) {
        return res.status(401).json({
            error: "Unauthorized"
        });
    }

    next();
}

// ============================================================
// BASIC ROUTES
// ============================================================

app.get("/", (req, res) => {
    res.json({
        status: "online",
        service: "CRZ Backend"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        status: "online"
    });
});

app.get("/api/services", (req, res) => {
    res.json({
        services:
            Object.values(SERVICES)
    });
});

// ============================================================
// AVAILABILITY
// ============================================================

function availability(req, res) {
    const date =
        req.method === "GET"
            ? req.query.date
            : req.body?.date;

    if (!validDate(date)) {
        return res.status(400).json({
            error:
                "A valid date is required."
        });
    }

    const bookings =
        getBookings().filter(
            booking =>
                booking.date === date &&
                booking.status !== "cancelled"
        );

    const blocked =
        getBlocked().filter(
            slot => slot.date === date
        );

    const bookedSlots =
        bookings.map(
            booking => booking.time
        );

    const blockedSlots =
        blocked.map(
            slot => slot.time
        );

    const availableSlots =
        TIME_SLOTS.filter(
            time =>
                !bookedSlots.includes(time) &&
                !blockedSlots.includes(time)
        );

    res.json({
        date,

        slots: TIME_SLOTS,

        availableSlots,

        bookedSlots,

        blockedSlots
    });
}

app.get(
    "/api/availability",
    availability
);

app.post(
    "/api/availability",
    availability
);

// ============================================================
// CREATE BOOKING
// ============================================================

app.post(
    "/api/bookings",
    (req, res) => {

        const {
            name,
            email,
            phone,
            date,
            time,
            service
        } = req.body || {};

        if (
            !name ||
            name.trim().length < 2 ||
            !validEmail(email) ||
            !validPhone(phone) ||
            !validDate(date) ||
            !TIME_SLOTS.includes(time) ||
            !SERVICES[String(service)]
        ) {
            return res.status(400).json({
                error:
                    "Please complete all booking details."
            });
        }

        if (date < today()) {
            return res.status(400).json({
                error:
                    "Booking date cannot be in the past."
            });
        }

        if (slotTaken(date, time)) {
            return res.status(409).json({
                error:
                    "This time slot is no longer available. Please choose another time."
            });
        }

        const serviceData =
            SERVICES[String(service)];

        const booking = {
            id: generateId(),

            name:
                name.trim(),

            email:
                email.trim().toLowerCase(),

            phone:
                phone.trim(),

            date,

            time,

            service:
                serviceData.id,

            serviceName:
                serviceData.name,

            total:
                serviceData.price,

            status:
                "pending_payment",

            paymentStatus:
                "pending",

            utr:
                null,

            createdAt:
                new Date().toISOString(),

            paidAt:
                null,

            confirmedAt:
                null
        };

        const bookings =
            getBookings();

        bookings.unshift(booking);

        writeJson(
            BOOKINGS_FILE,
            bookings
        );

        res.status(201).json({
            success: true,

            booking:
                publicBooking(booking)
        });
    }
);

// ============================================================
// GET BOOKING
// ============================================================

app.get(
    "/api/bookings/:id",
    (req, res) => {

        const bookings =
            getBookings();

        const booking =
            bookings.find(
                item =>
                    item.id ===
                    req.params.id
            );

        if (!booking) {
            return res.status(404).json({
                error:
                    "Booking not found."
            });
        }

        res.json({
            success: true,

            booking:
                publicBooking(booking)
        });
    }
);

// ============================================================
// SUBMIT QR PAYMENT
// ============================================================

app.post(
    "/api/payments/submit",
    async (req, res) => {

        const {
            bookingId,
            utr
        } = req.body || {};

        if (!bookingId) {
            return res.status(400).json({
                error:
                    "Booking ID is required."
            });
        }

        if (
            !utr ||
            String(utr).trim().length < 4
        ) {
            return res.status(400).json({
                error:
                    "Please enter your UPI transaction ID / UTR."
            });
        }

        const bookings =
            getBookings();

        const booking =
            bookings.find(
                item =>
                    item.id === bookingId
            );

        if (!booking) {
            return res.status(404).json({
                error:
                    "Booking not found."
            });
        }

        if (
            booking.status ===
            "cancelled"
        ) {
            return res.status(400).json({
                error:
                    "This booking has been cancelled."
            });
        }

        booking.utr =
            String(utr).trim();

        booking.paymentStatus =
            "submitted";

        booking.status =
            "pending_payment";

        writeJson(
            BOOKINGS_FILE,
            bookings
        );

        await sendPaymentSubmittedEmail(
            booking
        );

        res.json({
            success: true,

            booking:
                publicBooking(booking)
        });
    }
);

// ============================================================
// ADMIN LOGIN
// ============================================================

app.post(
    "/api/admin/login",
    (req, res) => {

        const {
            email,
            password
        } = req.body || {};

        if (
            !email ||
            !password
        ) {
            return res.status(400).json({
                error:
                    "Email and password are required."
            });
        }

        if (
            email !==
                process.env.ADMIN_EMAIL ||
            password !==
                process.env.ADMIN_PASSWORD
        ) {
            return res.status(401).json({
                error:
                    "Invalid admin credentials."
            });
        }

        res.json({
            success: true,

            token:
                process.env.ADMIN_TOKEN
        });
    }
);

// ============================================================
// ADMIN DASHBOARD
// ============================================================

app.get(
    "/api/admin/dashboard",
    requireAdmin,
    (req, res) => {

        const bookings =
            getBookings();

        const blocked =
            getBlocked();

        const paid =
            bookings.filter(
                booking =>
                    booking.paymentStatus ===
                    "paid"
            );

        const revenue =
            paid.reduce(
                (sum, booking) =>
                    sum +
                    Number(booking.total || 0),
                0
            );

        const todayBookings =
            bookings.filter(
                booking =>
                    booking.date === today()
            );

        res.json({

            todayCount:
                todayBookings.length,

            totalBookings:
                bookings.length,

            revenue,

            bookings:
                bookings.map(publicBooking),

            blocked
        });
    }
);

// ============================================================
// ADMIN: MARK PAYMENT PAID
// ============================================================

app.patch(
    "/api/admin/bookings/:id",
    requireAdmin,
    async (req, res) => {

        const bookings =
            getBookings();

        const booking =
            bookings.find(
                item =>
                    item.id ===
                    req.params.id
            );

        if (!booking) {
            return res.status(404).json({
                error:
                    "Booking not found."
            });
        }

        const oldPaymentStatus =
            booking.paymentStatus;

        if (
            req.body.paymentStatus
        ) {
            const allowed = [
                "pending",
                "submitted",
                "paid",
                "failed"
            ];

            if (
                !allowed.includes(
                    req.body.paymentStatus
                )
            ) {
                return res.status(400).json({
                    error:
                        "Invalid payment status."
                });
            }

            booking.paymentStatus =
                req.body.paymentStatus;
        }

        if (req.body.status) {

            const allowed = [
                "pending_payment",
                "confirmed",
                "cancelled",
                "completed"
            ];

            if (
                !allowed.includes(
                    req.body.status
                )
            ) {
                return res.status(400).json({
                    error:
                        "Invalid booking status."
                });
            }

            booking.status =
                req.body.status;
        }

        // Marking payment paid automatically
        // confirms the booking.

        if (
            booking.paymentStatus ===
            "paid"
        ) {

            booking.status =
                "confirmed";

            if (!booking.paidAt) {
                booking.paidAt =
                    new Date().toISOString();
            }

            if (!booking.confirmedAt) {
                booking.confirmedAt =
                    new Date().toISOString();
            }
        }

        writeJson(
            BOOKINGS_FILE,
            bookings
        );

        if (
            oldPaymentStatus !== "paid" &&
            booking.paymentStatus === "paid"
        ) {
            await sendConfirmationEmail(
                booking
            );
        }

        res.json({
            success: true,

            booking:
                publicBooking(booking)
        });
    }
);

// ============================================================
// ADMIN: BLOCK SLOT
// ============================================================

app.post(
    "/api/admin/block-slot",
    requireAdmin,
    (req, res) => {

        const {
            date,
            time
        } = req.body || {};

        if (
            !validDate(date) ||
            !TIME_SLOTS.includes(time)
        ) {
            return res.status(400).json({
                error:
                    "Invalid date or time."
            });
        }

        if (
            slotTaken(date, time)
        ) {

            const bookings =
                getBookings();

            const bookingExists =
                bookings.some(
                    booking =>
                        booking.date === date &&
                        booking.time === time &&
                        booking.status !==
                            "cancelled"
                );

            if (bookingExists) {
                return res.status(409).json({
                    error:
                        "This slot already has a booking."
                });
            }
        }

        const blocked =
            getBlocked();

        const exists =
            blocked.some(
                item =>
                    item.date === date &&
                    item.time === time
            );

        if (exists) {
            return res.status(409).json({
                error:
                    "This slot is already blocked."
            });
        }

        blocked.push({
            id: generateId("BLK"),

            date,

            time,

            createdAt:
                new Date().toISOString()
        });

        writeJson(
            BLOCKED_FILE,
            blocked
        );

        res.json({
            success: true
        });
    }
);

// ============================================================
// ADMIN: UNBLOCK SLOT
// ============================================================

app.post(
    "/api/admin/unblock-slot",
    requireAdmin,
    (req, res) => {

        const {
            id
        } = req.body || {};

        const blocked =
            getBlocked();

        const index =
            blocked.findIndex(
                item =>
                    item.id === id
            );

        if (index === -1) {
            return res.status(404).json({
                error:
                    "Blocked slot not found."
            });
        }

        blocked.splice(index, 1);

        writeJson(
            BLOCKED_FILE,
            blocked
        );

        res.json({
            success: true
        });
    }
);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "Server error:",
            error
        );

        res.status(500).json({
            error:
                "Internal server error."
        });
    }
);

// ============================================================
// START
// ============================================================

app.listen(
    PORT,
    () => {
        console.log(
            `CRZ backend running on port ${PORT}`
        );
    }
);
