/* =========================================================
   CRZ — SCRIPT
   Booking + Admin + Spotify Visualizer
========================================================= */

/*
   IMPORTANT
   ----------
   Your frontend should NOT contain:

   - admin password
   - SMS API secret
   - email API secret
   - database credentials

   Those belong on your backend.

   Change ONLY this URL once your backend is deployed.
*/

const API_BASE = "http://localhost:3000";


/* =========================================================
   CONFIG
========================================================= */

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

const SERVICE_NAMES = {
    "250": "Practice",
    "400": "Practice + Audio",
    "500": "Practice + Audio + Video",
    "1500": "Edited Recording"
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function showToast(message) {

    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* =========================================================
   NAVIGATION
========================================================= */

function scrollToBooking() {

    const section = $("book");

    if (!section) return;

    section.scrollIntoView({
        behavior: "smooth"
    });
}


/* =========================================================
   DATE SETUP
========================================================= */

function setupDates() {

    const dateInput = $("bookingDate");

    if (!dateInput) return;

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    dateInput.min = `${year}-${month}-${day}`;

    /*
       Default to today.
    */

    if (!dateInput.value) {
        dateInput.value = `${year}-${month}-${day}`;
    }

    dateInput.addEventListener(
        "change",
        refreshAvailability
    );
}


/* =========================================================
   TIME DROPDOWN
========================================================= */

function populateTimeSlots(
    blocked = [],
    bookings = []
) {

    const select = $("bookingTime");

    if (!select) return;

    select.innerHTML = "";

    const placeholder =
        document.createElement("option");

    placeholder.value = "";
    placeholder.textContent = "Select time";

    select.appendChild(placeholder);

    TIME_SLOTS.forEach(slot => {

        const blockedSlot =
            blocked.some(
                item =>
                    item.time === slot
            );

        const bookedSlot =
            bookings.some(
                item =>
                    item.time === slot
            );

        const option =
            document.createElement("option");

        option.value = slot;

        if (blockedSlot) {

            option.disabled = true;

            option.textContent =
                `${slot} — BLOCKED`;

        } else if (bookedSlot) {

            option.disabled = true;

            option.textContent =
                `${slot} — BOOKED`;

        } else {

            option.textContent = slot;
        }

        select.appendChild(option);
    });
}


/* =========================================================
   AVAILABILITY
========================================================= */

async function refreshAvailability() {

    const dateInput = $("bookingDate");

    if (!dateInput || !dateInput.value) {

        populateTimeSlots();

        return;
    }

    /*
       If no backend has been connected yet,
       keep all slots selectable.
    */

    if (
        !API_BASE ||
        API_BASE.includes("YOUR-CRZ-BACKEND")
    ) {

        populateTimeSlots();

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/api/availability?date=${encodeURIComponent(dateInput.value)}`
            );

        if (!response.ok) {
            throw new Error("Availability request failed.");
        }

        const data =
            await response.json();

        populateTimeSlots(
            data.blocked || [],
            data.bookings || []
        );

    } catch (error) {

        console.error(
            "Availability error:",
            error
        );

        /*
           Don't destroy the booking form
           if the backend is temporarily unavailable.
        */

        populateTimeSlots();

        showToast(
            "Couldn't load live availability."
        );
    }
}


/* =========================================================
   SERVICE TOTAL
========================================================= */

function updateTotal() {

    const service = $("bookingService");
    const total = $("bookingTotal");

    if (!service || !total) return;

    const price =
        Number(service.value || 0);

    total.textContent =
        `₹${price.toLocaleString("en-IN")}`;
}

if ($("bookingService")) {

    $("bookingService").addEventListener(
        "change",
        updateTotal
    );
}


/* =========================================================
   BOOKING VALIDATION
========================================================= */

function getBookingData() {

    const name =
        $("bookingName")?.value.trim();

    const email =
        $("bookingEmail")?.value.trim();

    const phone =
        $("bookingPhone")?.value.trim();

    const date =
        $("bookingDate")?.value;

    const time =
        $("bookingTime")?.value;

    const service =
        $("bookingService")?.value;

    if (!name) {
        showToast("Enter your name.");
        return null;
    }

    if (!email) {
        showToast("Enter your email.");
        return null;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast("Enter a valid email.");
        return null;
    }

    if (!phone) {
        showToast("Enter your phone number.");
        return null;
    }

    if (!date) {
        showToast("Select a date.");
        return null;
    }

    if (!time) {
        showToast("Select a time.");
        return null;
    }

    if (!service) {
        showToast("Select a service.");
        return null;
    }

    return {
        name,
        email,
        phone,
        date,
        time,
        service,
        serviceName: SERVICE_NAMES[service],
        amount: Number(service)
    };
}


/* =========================================================
   CREATE BOOKING
========================================================= */

async function createBooking() {

    const booking =
        getBookingData();

    if (!booking) return;


    /*
       Backend isn't connected yet.
    */

    if (
        !API_BASE ||
        API_BASE.includes("YOUR-CRZ-BACKEND")
    ) {

        showToast(
            "Booking backend isn't connected yet."
        );

        console.log(
            "Booking data:",
            booking
        );

        return;
    }


    const button =
        document.querySelector(".checkout");

    if (button) {

        button.disabled = true;
        button.textContent =
            "SENDING REQUEST...";
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/bookings`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(booking)
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Booking failed."
            );
        }


        showToast(
            "Booking request sent successfully."
        );


        /*
           Clear only the booking fields.
        */

        $("bookingName").value = "";
        $("bookingEmail").value = "";
        $("bookingPhone").value = "";
        $("bookingTime").value = "";
        $("bookingService").value = "";

        updateTotal();

        /*
           Refresh available slots.
        */

        refreshAvailability();


    } catch (error) {

        console.error(
            "Booking error:",
            error
        );

        showToast(
            error.message ||
            "Could not create booking."
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.innerHTML =
                "REQUEST BOOKING ↗";
        }
    }
}


/* =========================================================
   TEST EMAIL / SMS
========================================================= */

async function sendTestNotification() {

    if (
        !API_BASE ||
        API_BASE.includes("YOUR-CRZ-BACKEND")
    ) {

        showToast(
            "Connect the backend first."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/test-notification`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Test notification failed."
            );
        }


        showToast(
            data.message ||
            "Test notification sent."
        );


    } catch (error) {

        console.error(
            error
        );

        showToast(
            error.message ||
            "Could not send test notification."
        );
    }
}


/* =========================================================
   ADMIN LOGIN MODAL
========================================================= */

function openAdminLogin() {

    const modal =
        $("adminModal");

    if (!modal) return;

    modal.classList.add("show");

    setTimeout(() => {

        $("adminEmail")?.focus();

    }, 100);
}


function closeAdminLogin() {

    $("adminModal")
        ?.classList.remove("show");
}


/* =========================================================
   ADMIN LOGIN
========================================================= */

async function adminLogin() {

    const email =
        $("adminEmail")?.value.trim();

    const password =
        $("adminPassword")?.value;


    if (!email || !password) {

        showToast(
            "Enter your admin credentials."
        );

        return;
    }


    if (
        !API_BASE ||
        API_BASE.includes("YOUR-CRZ-BACKEND")
    ) {

        showToast(
            "Admin backend isn't connected."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/admin/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            email,
                            password
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Invalid admin credentials."
            );
        }


        /*
           Store ONLY the authentication token,
           never the password.
        */

        if (data.token) {

            sessionStorage.setItem(
                "crz_admin_token",
                data.token
            );
        }


        closeAdminLogin();

        openDashboard();

        showToast(
            "Admin login successful."
        );


    } catch (error) {

        console.error(
            error
        );

        showToast(
            error.message ||
            "Login failed."
        );
    }
}


/* =========================================================
   ADMIN LOGOUT
========================================================= */

function logoutAdmin() {

    sessionStorage.removeItem(
        "crz_admin_token"
    );

    $("dashboard")
        ?.classList.remove("show");

    showToast(
        "Logged out."
    );
}


/* =========================================================
   DASHBOARD
========================================================= */

async function openDashboard() {

    const dashboard =
        $("dashboard");

    if (!dashboard) return;

    dashboard.classList.add("show");

    await loadAdminData();
}


async function loadAdminData() {

    if (
        !API_BASE ||
        API_BASE.includes("YOUR-CRZ-BACKEND")
    ) {

        renderLocalDashboard();

        return;
    }


    const token =
        sessionStorage.getItem(
            "crz_admin_token"
        );


    if (!token) {

        $("dashboard")
            ?.classList.remove("show");

        openAdminLogin();

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/admin/dashboard`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        if (response.status === 401) {

            logoutAdmin();

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Dashboard request failed."
            );
        }


        renderDashboard(
            data
        );


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        showToast(
            "Couldn't load dashboard."
        );
    }
}


/* =========================================================
   DASHBOARD RENDER
========================================================= */

function renderDashboard(data) {

    $("todayCount").textContent =
        data.todayCount ?? 0;

    $("futureCount").textContent =
        data.futureCount ?? 0;

    $("completedCount").textContent =
        data.completedCount ?? 0;

    $("revenue").textContent =
        `₹${Number(data.revenue || 0).toLocaleString("en-IN")}`;


    renderBookings(
        data.bookings || []
    );

    renderBlockedSlots(
        data.blocked || []
    );
}


function renderBookings(bookings) {

    const container =
        $("bookingList");

    if (!container) return;

    container.innerHTML = "";


    if (!bookings.length) {

        container.innerHTML =
            `<p class="empty">
                No bookings yet.
            </p>`;

        return;
    }


    bookings.forEach(
        booking => {

            const item =
                document.createElement("div");

            item.className =
                "booking-item";


            item.innerHTML = `
                <strong>
                    ${escapeHTML(booking.name || "Unknown")}
                </strong>

                <small>
                    ${escapeHTML(booking.date || "")}
                    ·
                    ${escapeHTML(booking.time || "")}
                </small>

                <small>
                    ${escapeHTML(booking.serviceName || "")}
                    ·
                    ₹${Number(booking.amount || 0).toLocaleString("en-IN")}
                </small>

                <small>
                    ${escapeHTML(booking.email || "")}
                    <br>
                    ${escapeHTML(booking.phone || "")}
                </small>

                <div class="booking-actions">

                    <button
                        onclick="updateBookingStatus('${escapeAttribute(booking.id)}','confirmed')"
                    >
                        CONFIRM
                    </button>

                    <button
                        onclick="updateBookingStatus('${escapeAttribute(booking.id)}','completed')"
                    >
                        COMPLETED
                    </button>

                    <button
                        onclick="updateBookingStatus('${escapeAttribute(booking.id)}','cancelled')"
                    >
                        CANCEL
                    </button>

                </div>
            `;


            container.appendChild(
                item
            );
        }
    );
}


function renderBlockedSlots(blocked) {

    const container =
        $("blockedList");

    if (!container) return;

    container.innerHTML = "";


    if (!blocked.length) {

        container.innerHTML =
            `<p class="empty">
                No blocked slots.
            </p>`;

        return;
    }


    blocked.forEach(
        item => {

            const div =
                document.createElement("div");

            div.className =
                "blocked-item";

            div.innerHTML = `
                <strong>
                    ${escapeHTML(item.date || "")}
                </strong>

                <br>

                ${escapeHTML(item.time || "")}

                <br>

                ${escapeHTML(item.reason || "Blocked")}
            `;

            container.appendChild(
                div
            );
        }
    );
}


/* =========================================================
   LOCAL DASHBOARD FALLBACK
========================================================= */

function getLocalBookings() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "crz_bookings"
            )
        ) || [];

    } catch {

        return [];
    }
}


function saveLocalBookings(bookings) {

    localStorage.setItem(
        "crz_bookings",
        JSON.stringify(bookings)
    );
}


function renderLocalDashboard() {

    const bookings =
        getLocalBookings();


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
        completed.reduce(
            (sum, booking) =>
                sum + Number(booking.amount || 0),
            0
        );


    $("todayCount").textContent =
        todayBookings.length;

    $("futureCount").textContent =
        futureBookings.length;

    $("completedCount").textContent =
        completed.length;

    $("revenue").textContent =
        `₹${revenue.toLocaleString("en-IN")}`;


    renderBookings(
        bookings
    );


    const blocked =
        getLocalBlocked();

    renderBlockedSlots(
        blocked
    );
}


/* =========================================================
   LOCAL BLOCKED SLOTS
========================================================= */

function getLocalBlocked() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "crz_blocked"
            )
        ) || [];

    } catch {

        return [];
    }
}


function saveLocalBlocked(blocked) {

    localStorage.setItem(
        "crz_blocked",
        JSON.stringify(blocked)
    );
}


/* =========================================================
   BLOCK SLOT
========================================================= */

async function blockTime() {

    const date =
        $("blockDate")?.value;

    const time =
        $("blockTime")?.value;

    const reason =
        $("blockReason")?.value.trim();


    if (!date) {

        showToast(
            "Select a date."
        );

        return;
    }


    if (!time) {

        showToast(
            "Select a time."
        );

        return;
    }


    if (
        !API_BASE ||
        API_BASE.includes("YOUR-CRZ-BACKEND")
    ) {

        const blocked =
            getLocalBlocked();


        blocked.push({
            id:
                Date.now().toString(),

            date,
            time,

            reason:
                reason ||
                "Blocked by admin"
        });


        saveLocalBlocked(
            blocked
        );


        $("blockReason").value =
            "";


        renderLocalDashboard();


        showToast(
            "Time slot blocked."
        );

        return;
    }


    const token =
        sessionStorage.getItem(
            "crz_admin_token"
        );


    if (!token) {

        openAdminLogin();

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/admin/block`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            date,
                            time,
                            reason:
                                reason ||
                                "Blocked by admin"
                        })
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not block slot."
            );
        }


        $("blockReason").value =
            "";


        await loadAdminData();


        showToast(
            "Time slot blocked."
        );


    } catch (error) {

        console.error(
            error
        );

        showToast(
            error.message ||
            "Could not block slot."
        );
    }
}


/* =========================================================
   UPDATE BOOKING STATUS
========================================================= */

async function updateBookingStatus(
    id,
    status
) {

    if (
        !API_BASE ||
        API_BASE.includes("YOUR-CRZ-BACKEND")
    ) {

        const bookings =
            getLocalBookings();

        const booking =
            bookings.find(
                b => String(b.id) === String(id)
            );

        if (booking) {

            booking.status =
                status;

            saveLocalBookings(
                bookings
            );

            renderLocalDashboard();

            showToast(
                `Booking marked ${status}.`
            );
        }

        return;
    }


    const token =
        sessionStorage.getItem(
            "crz_admin_token"
        );


    if (!token) {

        openAdminLogin();

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/admin/bookings/${encodeURIComponent(id)}/status`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        JSON.stringify({
                            status
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not update booking."
            );
        }


        await loadAdminData();


        showToast(
            `Booking marked ${status}.`
        );


    } catch (error) {

        console.error(
            error
        );

        showToast(
            error.message ||
            "Could not update booking."
        );
    }
}


/* =========================================================
   CLEAR BOOKINGS
========================================================= */

async function clearBookings() {

    const confirmed =
        window.confirm(
            "Clear all bookings? This cannot be undone."
        );


    if (!confirmed) return;


    if (
        !API_BASE ||
        API_BASE.includes("YOUR-CRZ-BACKEND")
    ) {

        localStorage.removeItem(
            "crz_bookings"
        );

        renderLocalDashboard();

        showToast(
            "Local bookings cleared."
        );

        return;
    }


    const token =
        sessionStorage.getItem(
            "crz_admin_token"
        );


    if (!token) {

        openAdminLogin();

        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE}/api/admin/bookings`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not clear bookings."
            );
        }


        await loadAdminData();


        showToast(
            "Bookings cleared."
        );


    } catch (error) {

        console.error(
            error
        );

        showToast(
            error.message ||
            "Could not clear bookings."
        );
    }
}


/* =========================================================
   SPOTIFY / DJ VISUAL
========================================================= */

/*
   IMPORTANT:

   Spotify's iframe does NOT expose the actual audio
   waveform/BPM to our JavaScript.

   Therefore we cannot truthfully make the CRZ deck
   beat-sync to the Spotify audio itself.

   What we CAN do is make the deck look alive:
   waveform animation + jog rotation + meters.

   The Spotify player remains the actual music source.
*/


function createWaveform() {

    const waveform =
        $("waveform");

    if (!waveform) return;

    waveform.innerHTML = "";


    const bars = 46;


    for (
        let i = 0;
        i < bars;
        i++
    ) {

        const bar =
            document.createElement("i");


        const height =
            25 +
            Math.random() * 75;


        const delay =
            Math.random() * 0.7;


        bar.style.setProperty(
            "--h",
            `${height}px`
        );


        bar.style.setProperty(
            "--delay",
            `${delay}s`
        );


        waveform.appendChild(
            bar
        );
    }
}


/* =========================================================
   INTERACTION-BASED DJ ANIMATION
========================================================= */

function activateDJVisual() {

    const deck =
        $("djDeck");

    if (!deck) return;


    document.addEventListener(
        "click",
        () => {

            deck.classList.add(
                "active"
            );

        },
        {
            once: true
        }
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


function escapeAttribute(value) {

    return String(value ?? "")
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        );
}


/* =========================================================
   KEYBOARD SHORTCUT
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeAdminLogin();
        }
    }
);


/* =========================================================
   CLICK OUTSIDE MODAL
========================================================= */

$("adminModal")
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("adminModal")
            ) {

                closeAdminLogin();
            }
        }
    );


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        createWaveform();

        setupDates();

        populateTimeSlots();

        updateTotal();

        activateDJVisual();


        /*
           Load availability after the
           initial date is established.
        */

        refreshAvailability();


        /*
           If an admin token exists,
           don't automatically expose the
           dashboard. The admin still needs
           to deliberately open it.
        */

        console.log(
            "CRZ website initialized."
        );
    }
);
