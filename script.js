/* =========================================================
   CRZ — FRONTEND ENGINE
========================================================= */


/* -----------------------------
   STORAGE
----------------------------- */

let bookings =
    JSON.parse(
        localStorage.getItem("crzBookings") || "[]"
    );


let blockedSlots =
    JSON.parse(
        localStorage.getItem("crzBlocked") || "[]"
    );


/* -----------------------------
   DEFAULT ADMIN
----------------------------- */

const ADMIN_EMAIL = "admin@crzstudio.in";
const ADMIN_PASSWORD = "CRZadmin2026";


/* -----------------------------
   DATE
----------------------------- */

const dateInput =
    document.getElementById("bookingDate");


const today =
    new Date()
        .toISOString()
        .split("T")[0];


dateInput.min = today;


/* -----------------------------
   BOOKING PRICE
----------------------------- */

const serviceInput =
    document.getElementById("bookingService");


const totalDisplay =
    document.getElementById("bookingTotal");


serviceInput.addEventListener(
    "change",
    updateTotal
);


function updateTotal() {

    const price =
        Number(serviceInput.value || 0);

    totalDisplay.textContent =
        `₹${price.toLocaleString("en-IN")}`;
}


/* -----------------------------
   SCROLL
----------------------------- */

function scrollToBooking() {

    document
        .getElementById("book")
        .scrollIntoView({
            behavior: "smooth"
        });
}


/* -----------------------------
   CHECK SLOT
----------------------------- */

function slotIsUnavailable(date, time) {

    return blockedSlots.some(slot =>
        slot.date === date &&
        slot.time === time
    );
}


function slotAlreadyBooked(date, time) {

    return bookings.some(booking =>
        booking.date === date &&
        booking.time === time &&
        booking.status !== "cancelled"
    );
}


/* -----------------------------
   CREATE BOOKING
----------------------------- */

function createBooking() {

    const name =
        document
            .getElementById("bookingName")
            .value.trim();


    const email =
        document
            .getElementById("bookingEmail")
            .value.trim();


    const phone =
        document
            .getElementById("bookingPhone")
            .value.trim();


    const date =
        document
            .getElementById("bookingDate")
            .value;


    const time =
        document
            .getElementById("bookingTime")
            .value;


    const service =
        document
            .getElementById("bookingService");


    const serviceName =
        service.options[
            service.selectedIndex
        ]?.text || "";


    const amount =
        Number(service.value);


    if (
        !name ||
        !email ||
        !phone ||
        !date ||
        !time ||
        !amount
    ) {

        alert(
            "Please complete all booking details."
        );

        return;
    }


    if (slotIsUnavailable(date, time)) {

        alert(
            "This slot has been blocked by CRZ."
        );

        return;
    }


    if (slotAlreadyBooked(date, time)) {

        alert(
            "This slot has already been booked."
        );

        return;
    }


    const booking = {

        id:
            "CRZ-" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase(),

        name,

        email,

        phone,

        date,

        time,

        service: serviceName,

        amount,

        status: "paid",

        created:
            new Date().toISOString()
    };


    bookings.push(booking);


    localStorage.setItem(
        "crzBookings",
        JSON.stringify(bookings)
    );


    /*
       PROTOTYPE PAYMENT

       Replace this later with Razorpay.
    */

    showPaymentScreen(booking);
}


/* -----------------------------
   PAYMENT SCREEN
----------------------------- */

function showPaymentScreen(booking) {

    const paymentMethods = [

        "UPI",

        "Credit / Debit Card",

        "Net Banking",

        "Wallets"

    ];


    const method =
        prompt(
            `CRZ CHECKOUT\n\n` +
            `Booking: ${booking.id}\n` +
            `Amount: ₹${booking.amount}\n\n` +
            `Choose payment method:\n\n` +
            `1 — UPI\n` +
            `2 — Card\n` +
            `3 — Net Banking\n` +
            `4 — Wallet`
        );


    if (
        !["1","2","3","4"].includes(method)
    ) {

        /*
           If they cancel, restore booking.
        */

        bookings =
            bookings.filter(
                b => b.id !== booking.id
            );

        localStorage.setItem(
            "crzBookings",
            JSON.stringify(bookings)
        );

        return;
    }


    booking.paymentMethod =
        paymentMethods[
            Number(method) - 1
        ];


    localStorage.setItem(
        "crzBookings",
        JSON.stringify(bookings)
    );


    alert(
        `✓ PAYMENT CONFIRMED\n\n` +

        `Booking ID: ${booking.id}\n` +

        `Amount: ₹${booking.amount}\n` +

        `Method: ${booking.paymentMethod}\n\n` +

        `BOOKING CONFIRMED\n\n` +

        `In the production version, CRZ will now send:\n` +

        `📧 Payment confirmed email\n` +

        `📱 Payment confirmed SMS\n` +

        `📧 Booking confirmed email\n` +

        `📱 Booking confirmed SMS`
    );


    updateDashboard();
}


/* -----------------------------
   TEST NOTIFICATION
----------------------------- */

async function sendTestNotification() {

    const email =
        document
            .getElementById("bookingEmail")
            .value.trim();


    const phone =
        document
            .getElementById("bookingPhone")
            .value.trim();


    if (!email && !phone) {

        alert(
            "Enter your email and/or phone number in the booking form first."
        );

        return;
    }


    /*
       IMPORTANT:

       This calls your optional backend.

       When you create server.js,
       change this URL if necessary.
    */

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/test-notification",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        phone
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Notification failed"
            );
        }


        alert(
            "✓ TEST SENT\n\n" +
            "Check your email and phone."
        );


    } catch (error) {

        console.error(error);

        alert(
            "The notification server isn't running yet.\n\n" +

            "The website itself is working.\n\n" +

            "Start the CRZ notification backend to send real email/SMS."
        );
    }
}


/* -----------------------------
   ADMIN LOGIN
----------------------------- */

function openAdminLogin() {

    document
        .getElementById("adminModal")
        .classList.add("show");
}


function closeAdminLogin() {

    document
        .getElementById("adminModal")
        .classList.remove("show");
}


function adminLogin() {

    const email =
        document
            .getElementById("adminEmail")
            .value.trim();


    const password =
        document
            .getElementById("adminPassword")
            .value;


    if (
        email === ADMIN_EMAIL &&
        password === ADMIN_PASSWORD
    ) {

        localStorage.setItem(
            "crzAdmin",
            "true"
        );


        closeAdminLogin();


        document
            .getElementById("dashboard")
            .classList.add("show");


        updateDashboard();

    } else {

        alert(
            "Invalid admin credentials."
        );
    }
}


/* -----------------------------
   ADMIN LOGOUT
----------------------------- */

function logoutAdmin() {

    localStorage.removeItem(
        "crzAdmin"
    );


    document
        .getElementById("dashboard")
        .classList.remove("show");
}


/* -----------------------------
   BLOCK TIME
----------------------------- */

function blockTime() {

    const date =
        document
            .getElementById("blockDate")
            .value;


    const time =
        document
            .getElementById("blockTime")
            .value;


    const reason =
        document
            .getElementById("blockReason")
            .value.trim();


    if (!date || !time) {

        alert(
            "Select a date and time."
        );

        return;
    }


    if (slotAlreadyBooked(date, time)) {

        alert(
            "A customer has already booked this slot."
        );

        return;
    }


    const blocked = {

        id:
            "BLK-" +
            Date.now(),

        date,

        time,

        reason:
            reason || "Unavailable"
    };


    blockedSlots.push(blocked);


    localStorage.setItem(
        "crzBlocked",
        JSON.stringify(blockedSlots)
    );


    document
        .getElementById("blockReason")
        .value = "";


    updateDashboard();


    alert(
        "✓ Time slot blocked."
    );
}


/* -----------------------------
   REMOVE BLOCK
----------------------------- */

function removeBlock(id) {

    blockedSlots =
        blockedSlots.filter(
            slot => slot.id !== id
        );


    localStorage.setItem(
        "crzBlocked",
        JSON.stringify(blockedSlots)
    );


    updateDashboard();
}


/* -----------------------------
   DASHBOARD
----------------------------- */

function updateDashboard() {

    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    const todayBookings =
        bookings.filter(
            b => b.date === today
        );


    const futureBookings =
        bookings.filter(
            b => b.date > today
        );


    const completed =
        bookings.filter(
            b => b.status === "completed"
        );


    const revenue =
        bookings
            .filter(
                b => b.status !== "cancelled"
            )
            .reduce(
                (sum,b) =>
                    sum + Number(b.amount),
                0
            );


    document
        .getElementById("todayCount")
        .textContent =
            todayBookings.length;


    document
        .getElementById("futureCount")
        .textContent =
            futureBookings.length;


    document
        .getElementById("completedCount")
        .textContent =
            completed.length;


    document
        .getElementById("revenue")
        .textContent =
            `₹${revenue.toLocaleString("en-IN")}`;


    renderBookings();

    renderBlocked();
}


/* -----------------------------
   RENDER BOOKINGS
----------------------------- */

function renderBookings() {

    const container =
        document
            .getElementById("bookingList");


    if (!bookings.length) {

        container.innerHTML =
            `<p class="empty">
                No bookings yet.
            </p>`;

        return;
    }


    container.innerHTML =
        bookings
            .slice()
            .reverse()
            .map(booking => `

                <div class="booking-row">

                    <div>

                        <strong>
                            ${escapeHTML(booking.name)}
                        </strong>

                        <small>
                            ${escapeHTML(booking.date)}
                            ·
                            ${escapeHTML(booking.time)}
                        </small>

                        <small>
                            ${escapeHTML(booking.service)}
                        </small>

                        <small>
                            ${escapeHTML(booking.email)}
                        </small>

                    </div>

                    <div>

                        <div class="booking-status">
                            ${booking.status.toUpperCase()}
                        </div>

                        <small>
                            ₹${booking.amount}
                        </small>

                    </div>

                </div>

            `)
            .join("");
}


/* -----------------------------
   RENDER BLOCKED
----------------------------- */

function renderBlocked() {

    const container =
        document
            .getElementById("blockedList");


    if (!blockedSlots.length) {

        container.innerHTML =
            `<p class="empty">
                No blocked slots.
            </p>`;

        return;
    }


    container.innerHTML =
        blockedSlots
            .slice()
            .reverse()
            .map(slot => `

                <div class="blocked-item">

                    <div>

                        <strong>
                            ${escapeHTML(slot.date)}
                        </strong>

                        <br>

                        ${escapeHTML(slot.time)}

                        <br>

                        <span style="color:#777">
                            ${escapeHTML(slot.reason)}
                        </span>

                    </div>

                    <button
                        onclick="removeBlock('${slot.id}')"
                    >
                        REMOVE
                    </button>

                </div>

            `)
            .join("");
}


/* -----------------------------
   CLEAR BOOKINGS
----------------------------- */

function clearBookings() {

    if (
        !confirm(
            "Delete all prototype bookings?"
        )
    ) return;


    bookings = [];


    localStorage.removeItem(
        "crzBookings"
    );


    updateDashboard();
}


/* -----------------------------
   SECURITY HELPER
----------------------------- */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* -----------------------------
   INITIALISE
----------------------------- */

if (
    localStorage.getItem("crzAdmin") === "true"
) {

    document
        .getElementById("dashboard")
        .classList.add("show");

    updateDashboard();
}


updateTotal();
