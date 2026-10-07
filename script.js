/* =========================================================
   CRZ DJ STUDIO
   FRONTEND DEMO / V1
   ========================================================= */


/* =========================================================
   PACKAGES
   ========================================================= */

const packages = {
    practice: {
        name: "Practice Only",
        price: 250
    },

    audio: {
        name: "Practice + Audio",
        price: 400
    },

    video: {
        name: "Practice + Audio + Video",
        price: 500
    },

    raw: {
        name: "Raw Recording",
        price: 600
    },

    edited: {
        name: "Edited Recording",
        price: 1500
    }
};


/* =========================================================
   DEMO DATA
   ========================================================= */

let bookings = JSON.parse(
    localStorage.getItem("crzBookings") || "[]"
);

let blockedSlots = JSON.parse(
    localStorage.getItem("crzBlockedSlots") || "[]"
);

let selectedSlot = null;

let selectedPackage =
    document.getElementById("packageSelect")?.value || "practice";


/* =========================================================
   STUDIO HOURS
   ========================================================= */

const studioHours = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00"
];


/* =========================================================
   UTILITIES
   ========================================================= */

function saveData() {

    localStorage.setItem(
        "crzBookings",
        JSON.stringify(bookings)
    );

    localStorage.setItem(
        "crzBlockedSlots",
        JSON.stringify(blockedSlots)
    );
}


function formatTime(time) {

    const [hour, minute] = time.split(":");

    let h = Number(hour);

    const suffix = h >= 12 ? "PM" : "AM";

    h = h % 12;

    if (h === 0) h = 12;

    return `${h}:${minute} ${suffix}`;
}


function formatDate(date) {

    if (!date) return "";

    const d = new Date(date + "T00:00:00");

    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


function generateBookingID() {

    return "CRZ-" +
        Math.floor(10000 + Math.random() * 90000);
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function scrollToBooking() {

    document
        .getElementById("booking")
        .scrollIntoView({
            behavior: "smooth"
        });
}


function scrollToSection(id) {

    document
        .getElementById(id)
        .scrollIntoView({
            behavior: "smooth"
        });
}


/* =========================================================
   PACKAGE SELECTION
   ========================================================= */

function startBooking(type) {

    document.getElementById("packageSelect").value = type;

    selectedPackage = type;

    scrollToBooking();

    loadSlots();
}


/* =========================================================
   DATE
   ========================================================= */

const dateInput =
    document.getElementById("bookingDate");

if (dateInput) {

    const today =
        new Date().toISOString().split("T")[0];

    dateInput.min = today;

    dateInput.value = today;

    loadSlots();
}


/* =========================================================
   SLOT AVAILABILITY
   ========================================================= */

function isSlotUnavailable(date, time) {

    const bookingExists = bookings.some(
        booking =>
            booking.date === date &&
            booking.time === time &&
            booking.status !== "cancelled"
    );

    const blockedExists = blockedSlots.some(
        blocked =>
            blocked.date === date &&
            blocked.time === time
    );

    return bookingExists || blockedExists;
}


function loadSlots() {

    const date =
        document.getElementById("bookingDate")?.value;

    const slotsContainer =
        document.getElementById("slots");

    const paymentButton =
        document.getElementById("continuePayment");

    if (!date) {

        slotsContainer.innerHTML = `
            <div class="slot-placeholder">
                Select a date first.
            </div>
        `;

        paymentButton.disabled = true;

        return;
    }

    slotsContainer.innerHTML = "";

    selectedSlot = null;

    paymentButton.disabled = true;

    studioHours.forEach(time => {

        const button =
            document.createElement("button");

        button.className = "slot";

        button.textContent =
            `${formatTime(time)} – ${formatTime(addHour(time))}`;

        const unavailable =
            isSlotUnavailable(date, time);

        if (unavailable) {

            button.classList.add("unavailable");

            button.disabled = true;

            button.textContent += "  •  UNAVAILABLE";

        } else {

            button.onclick = () => selectSlot(
                button,
                time
            );

        }

        slotsContainer.appendChild(button);

    });
}


function addHour(time) {

    let [hour, minute] =
        time.split(":").map(Number);

    hour++;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}


/* =========================================================
   SELECT SLOT
   ========================================================= */

function selectSlot(button, time) {

    document
        .querySelectorAll(".slot")
        .forEach(slot => {
            slot.classList.remove("selected");
        });

    button.classList.add("selected");

    selectedSlot = time;

    document.getElementById(
        "continuePayment"
    ).disabled = false;
}


/* =========================================================
   PAYMENT
   ========================================================= */

function continueToPayment() {

    if (!selectedSlot) return;

    const date =
        document.getElementById("bookingDate").value;

    selectedPackage =
        document.getElementById("packageSelect").value;

    const packageData =
        packages[selectedPackage];

    document.getElementById(
        "paymentSummary"
    ).innerHTML = `
        <strong>${packageData.name}</strong><br>
        ${formatDate(date)}<br>
        ${formatTime(selectedSlot)}
        – ${formatTime(addHour(selectedSlot))}<br>
        <br>
        <strong>₹${packageData.price} / hour</strong>
    `;

    document
        .getElementById("paymentModal")
        .classList.add("show");
}


function closePayment() {

    document
        .getElementById("paymentModal")
        .classList.remove("show");
}


function selectPaymentMethod(button) {

    document
        .querySelectorAll(".payment-methods button")
        .forEach(btn =>
            btn.classList.remove("selected")
        );

    button.classList.add("selected");
}


/* =========================================================
   PAYMENT DEMO
   ========================================================= */

function simulatePayment() {

    if (!selectedSlot) return;

    const date =
        document.getElementById("bookingDate").value;

    const packageData =
        packages[
            document.getElementById("packageSelect").value
        ];

    /*
        DOUBLE-BOOKING CHECK

        This is still performed immediately before
        creating the booking.

        In production this check MUST also happen
        server-side/database-side.
    */

    if (isSlotUnavailable(date, selectedSlot)) {

        alert(
            "Sorry — this slot has just been taken. Please select another slot."
        );

        closePayment();

        loadSlots();

        return;
    }


    const booking = {

        id: generateBookingID(),

        date: date,

        time: selectedSlot,

        package: packageData.name,

        price: packageData.price,

        status: "upcoming",

        paymentStatus: "paid",

        createdAt: new Date().toISOString(),

        customer: {
            name: "Demo Customer",
            email: "customer@example.com",
            phone: "+91 90000 00000"
        }

    };


    /*
        PAYMENT CONFIRMED
    */

    console.log(
        "EMAIL + SMS: PAYMENT CONFIRMED",
        booking
    );


    /*
        BOOKING CONFIRMED
    */

    bookings.push(booking);

    saveData();


    console.log(
        "EMAIL + SMS: BOOKING CONFIRMED",
        booking
    );


    closePayment();

    showBookingConfirmation(booking);

    loadSlots();

    updateAdminStats();

}


/* =========================================================
   BOOKING CONFIRMATION
   ========================================================= */

function showBookingConfirmation(booking) {

    alert(
        `CRZ BOOKING CONFIRMED\n\n` +

        `Booking ID: ${booking.id}\n` +

        `Date: ${formatDate(booking.date)}\n` +

        `Time: ${formatTime(booking.time)} – ${formatTime(addHour(booking.time))}\n\n` +

        `Payment: ₹${booking.price} PAID\n\n` +

        `Payment confirmation and booking confirmation ` +
        `will be sent by EMAIL + SMS in the production system.`
    );
}


/* =========================================================
   AUTH
   ========================================================= */

function openAuth() {

    document
        .getElementById("authModal")
        .classList.add("show");
}


function closeAuth() {

    document
        .getElementById("authModal")
        .classList.remove("show");
}


function showEmailLogin() {

    document
        .getElementById("emailLogin")
        .classList.remove("hidden");

    document
        .getElementById("phoneLogin")
        .classList.add("hidden");

    document
        .getElementById("emailTab")
        .classList.add("active");

    document
        .getElementById("phoneTab")
        .classList.remove("active");
}


function showPhoneLogin() {

    document
        .getElementById("emailLogin")
        .classList.add("hidden");

    document
        .getElementById("phoneLogin")
        .classList.remove("hidden");

    document
        .getElementById("phoneTab")
        .classList.add("active");

    document
        .getElementById("emailTab")
        .classList.remove("active");
}


function fakeLogin() {

    alert(
        "Demo login successful.\n\n" +
        "Production CRZ will use Supabase authentication."
    );

    closeAuth();
}


function showSignup() {

    alert(
        "Customer signup will use email + phone number in the production version."
    );
}


/* =========================================================
   ADMIN
   ========================================================= */

const ADMIN_EMAIL =
    "admin@crzstudio.in";

const ADMIN_PASSWORD =
    "CRZ@Admin2026!";


function adminLogin() {

    const email =
        document.getElementById("adminEmail").value.trim();

    const password =
        document.getElementById("adminPassword").value;

    const error =
        document.getElementById("adminError");


    if (
        email === ADMIN_EMAIL &&
        password === ADMIN_PASSWORD
    ) {

        document
            .getElementById("adminModal")
            .classList.remove("show");

        document
            .getElementById("adminDashboard")
            .classList.remove("hidden");

        document
            .getElementById("app")
            .querySelectorAll(
                "body > *"
            );

        updateAdminDashboard();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } else {

        error.innerHTML = `
            <div style="
                color:#d96b6b;
                font-size:11px;
                margin-top:15px;
            ">
                Invalid administrator credentials.
            </div>
        `;

    }
}


function logoutAdmin() {

    document
        .getElementById("adminDashboard")
        .classList.add("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   ADMIN DASHBOARD
   ========================================================= */

function updateAdminDashboard() {

    updateAdminStats();

    renderAdminBookings();

    renderBlockedSlots();

    document.getElementById(
        "adminDate"
    ).textContent =
        new Date().toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
}


function updateAdminStats() {

    const today =
        new Date().toISOString().split("T")[0];

    const todayCount =
        bookings.filter(
            b =>
                b.date === today &&
                b.status !== "cancelled"
        ).length;


    const upcoming =
        bookings.filter(
            b =>
                b.status === "upcoming"
        ).length;


    const completed =
        bookings.filter(
            b =>
                b.status === "completed"
        ).length;


    const revenue =
        bookings
            .filter(
                b =>
                    b.paymentStatus === "paid"
            )
            .reduce(
                (sum, b) =>
                    sum + Number(b.price),
                0
            );


    document.getElementById(
        "todayBookings"
    ).textContent = todayCount;

    document.getElementById(
        "upcomingBookings"
    ).textContent = upcoming;

    document.getElementById(
        "completedBookings"
    ).textContent = completed;

    document.getElementById(
        "totalRevenue"
    ).textContent =
        "₹" + revenue.toLocaleString("en-IN");
}


/* =========================================================
   ADMIN BOOKINGS
   ========================================================= */

function renderAdminBookings() {

    const container =
        document.getElementById("adminBookings");

    if (!container) return;

    const filter =
        document.getElementById(
            "bookingFilter"
        ).value;


    let filtered = [...bookings];


    if (filter !== "all") {

        filtered =
            filtered.filter(
                booking =>
                    booking.status === filter
            );

    }


    filtered.sort(
        (a, b) =>
            new Date(a.date + "T" + a.time) -
            new Date(b.date + "T" + b.time)
    );


    if (filtered.length === 0) {

        container.innerHTML = `
            <div style="
                padding:30px;
                color:#555;
                text-align:center;
                font-size:11px;
            ">
                No bookings found.
            </div>
        `;

        return;
    }


    let html = `

        <div class="booking-row header">

            <span>BOOKING</span>
            <span>DATE</span>
            <span>PACKAGE</span>
            <span>PAYMENT</span>
            <span>STATUS</span>

        </div>

    `;


    filtered.forEach(booking => {

        html += `

            <div class="booking-row">

                <span>
                    ${booking.id}
                </span>

                <span>
                    ${formatDate(booking.date)}
                    <br>
                    ${formatTime(booking.time)}
                </span>

                <span>
                    ${booking.package}
                </span>

                <span>
                    ₹${booking.price}
                </span>

                <span class="booking-status">
                    ${booking.status.toUpperCase()}
                </span>

            </div>

        `;

    });


    container.innerHTML = html;
}


/* =========================================================
   BLOCK TIME
   ========================================================= */

function blockTime() {

    const date =
        document.getElementById(
            "blockDate"
        ).value;

    const start =
        document.getElementById(
            "blockStart"
        ).value;

    const end =
        document.getElementById(
            "blockEnd"
        ).value;

    const reason =
        document.getElementById(
            "blockReason"
        ).value.trim();


    if (!date || !start || !end) {

        alert(
            "Please select a date and time."
        );

        return;
    }


    if (start >= end) {

        alert(
            "End time must be after start time."
        );

        return;
    }


    /*
        IMPORTANT:

        Do NOT allow the admin to block an already
        booked slot.
    */

    const booked =
        bookings.some(
            booking =>
                booking.date === date &&
                booking.time === start &&
                booking.status !== "cancelled"
        );


    if (booked) {

        alert(
            "This slot already has a confirmed booking. " +
            "Cancel the booking first if you need to make it unavailable."
        );

        return;
    }


    /*
        For each hour between start and end,
        create a blocked slot.
    */

    let current =
        Number(start.split(":")[0]);

    const ending =
        Number(end.split(":")[0]);


    while (current < ending) {

        const time =
            String(current).padStart(2, "0") +
            ":00";


        const alreadyBlocked =
            blockedSlots.some(
                blocked =>
                    blocked.date === date &&
                    blocked.time === time
            );


        if (!alreadyBlocked) {

            blockedSlots.push({

                date: date,

                time: time,

                reason:
                    reason ||
                    "Admin blocked",

                createdAt:
                    new Date().toISOString()

            });

        }

        current++;
    }


    saveData();

    renderBlockedSlots();

    loadSlots();


    document.getElementById(
        "blockReason"
    ).value = "";


    alert(
        `${formatDate(date)} ${formatTime(start)}–${formatTime(end)} has been blocked.`
    );
}


/* =========================================================
   BLOCKED SLOT LIST
   ========================================================= */

function renderBlockedSlots() {

    const container =
        document.getElementById(
            "blockedSlots"
        );

    if (!container) return;


    if (blockedSlots.length === 0) {

        container.innerHTML = `
            <div style="
                color:#555;
                font-size:11px;
                padding:15px 0;
            ">
                No blocked slots.
            </div>
        `;

        return;
    }


    let html = "";


    blockedSlots
        .sort(
            (a, b) =>
                new Date(a.date + "T" + a.time) -
                new Date(b.date + "T" + b.time)
        )
        .forEach(
            (blocked, index) => {

                html += `

                    <div class="blocked-row">

                        <div>

                            <strong>
                                ${formatDate(blocked.date)}
                            </strong>

                            <br>

                            <span style="color:#666">
                                ${formatTime(blocked.time)}
                                —
                                ${blocked.reason}
                            </span>

                        </div>

                        <button
                            onclick="unblockTime(${index})"
                        >
                            UNBLOCK
                        </button>

                    </div>

                `;

            }
        );


    container.innerHTML = html;
}


/* =========================================================
   UNBLOCK
   ========================================================= */

function unblockTime(index) {

    const blocked =
        blockedSlots[index];

    if (!blocked) return;


    const confirmed =
        confirm(
            `Unblock ${formatDate(blocked.date)} ${formatTime(blocked.time)}?`
        );


    if (!confirmed) return;


    blockedSlots.splice(index, 1);

    saveData();

    renderBlockedSlots();

    loadSlots();
}


/* =========================================================
   ADMIN ACCESS
   ========================================================= */

/*
    Demo shortcut:

    Press CTRL + SHIFT + A

    Production version should NOT expose this.
*/

document.addEventListener(
    "keydown",
    event => {

        if (
            event.ctrlKey &&
            event.shiftKey &&
            event.key.toLowerCase() === "a"
        ) {

            document
                .getElementById("adminModal")
                .classList.add("show");

        }

    }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const date =
            document.getElementById(
                "blockDate"
            );

        if (date) {

            date.min =
                new Date()
                    .toISOString()
                    .split("T")[0];

        }

        loadSlots();

    }
);
