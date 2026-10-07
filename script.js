/* =========================================================
   CRZ — COMPLETE FRONTEND SCRIPT
   Local backend: http://localhost:3000
========================================================= */

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

const SERVICES = [
    {
        value: "250",
        name: "Practice",
        label: "Practice — ₹250/hr"
    },
    {
        value: "400",
        name: "Practice + Audio",
        label: "Practice + Audio — ₹400/hr"
    },
    {
        value: "500",
        name: "Practice + Audio + Video",
        label: "Practice + Audio + Video — ₹500/hr"
    },
    {
        value: "1500",
        name: "Edited Recording",
        label: "Edited Recording — ₹1,500/hr"
    }
];


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function showToast(message) {

    let toast = $("crzToast");

    if (!toast) {

        toast = document.createElement("div");

        toast.id = "crzToast";

        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: #080808;
            color: #F1ECE0;
            border: 1px solid rgba(241,236,224,.2);
            padding: 14px 22px;
            border-radius: 10px;
            font-family: Inter, sans-serif;
            font-size: 14px;
            z-index: 99999;
            opacity: 0;
            pointer-events: none;
            transition: .3s ease;
        `;

        document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.style.opacity = "1";
    toast.style.transform =
        "translateX(-50%) translateY(0)";

    clearTimeout(window.crzToastTimer);

    window.crzToastTimer = setTimeout(() => {

        toast.style.opacity = "0";

        toast.style.transform =
            "translateX(-50%) translateY(20px)";

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
   DATE
========================================================= */

function setupDate() {

    const input = $("bookingDate");

    if (!input) return;

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    const todayString =
        `${year}-${month}-${day}`;

    input.min = todayString;

    if (!input.value) {
        input.value = todayString;
    }

    input.addEventListener(
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

    const select =
        $("bookingTime");

    if (!select) {

        console.error(
            "CRZ: #bookingTime was not found."
        );

        return;
    }


    /*
       Completely rebuild the dropdown.
       This guarantees the options appear even
       if the backend returns nothing.
    */

    select.innerHTML = "";


    const placeholder =
        document.createElement("option");

    placeholder.value = "";

    placeholder.textContent =
        "Select time";

    placeholder.selected = true;

    select.appendChild(
        placeholder
    );


    TIME_SLOTS.forEach(slot => {

        const option =
            document.createElement("option");

        option.value = slot;

        option.textContent = slot;


        const blockedSlot =
            blocked.some(
                item =>
                    item &&
                    item.time === slot
            );


        const bookedSlot =
            bookings.some(
                item =>
                    item &&
                    item.time === slot
            );


        if (blockedSlot) {

            option.disabled = true;

            option.textContent =
                `${slot} — BLOCKED`;

        }


        if (bookedSlot) {

            option.disabled = true;

            option.textContent =
                `${slot} — BOOKED`;

        }


        select.appendChild(
            option
        );
    });


    console.log(
        `CRZ: ${TIME_SLOTS.length} time slots loaded.`
    );
}


/* =========================================================
   SERVICE DROPDOWN
========================================================= */

function populateServices() {

    const select =
        $("bookingService");

    if (!select) {

        console.error(
            "CRZ: #bookingService was not found."
        );

        return;
    }


    select.innerHTML = "";


    const placeholder =
        document.createElement("option");

    placeholder.value = "";

    placeholder.textContent =
        "Select service";

    placeholder.selected = true;

    select.appendChild(
        placeholder
    );


    SERVICES.forEach(service => {

        const option =
            document.createElement("option");

        option.value =
            service.value;

        option.textContent =
            service.label;

        select.appendChild(
            option
        );
    });


    console.log(
        `CRZ: ${SERVICES.length} services loaded.`
    );
}


/* =========================================================
   TOTAL
========================================================= */

function updateTotal() {

    const select =
        $("bookingService");

    const total =
        $("bookingTotal");

    if (!select || !total) return;


    const amount =
        Number(select.value || 0);


    total.textContent =
        `₹${amount.toLocaleString("en-IN")}`;
}


/* =========================================================
   AVAILABILITY
========================================================= */

async function refreshAvailability() {

    const dateInput =
        $("bookingDate");

    if (!dateInput) return;


    const date =
        dateInput.value;


    /*
       Always show the slots first.
       The backend can then disable booked/blocked ones.
    */

    populateTimeSlots();


    if (!date) return;


    try {

        const response =
            await fetch(
                `${API_BASE}/api/availability?date=${encodeURIComponent(date)}`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        populateTimeSlots(
            data.blocked || [],
            data.bookings || []
        );


    } catch (error) {

        console.error(
            "CRZ availability error:",
            error
        );

        /*
           Don't leave the user with an empty dropdown
           just because availability failed.
        */

        populateTimeSlots();

    }
}


/* =========================================================
   BOOKING DATA
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

        showToast(
            "Please enter your name."
        );

        return null;
    }


    if (!email) {

        showToast(
            "Please enter your email."
        );

        return null;
    }


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email)
    ) {

        showToast(
            "Please enter a valid email."
        );

        return null;
    }


    if (!phone) {

        showToast(
            "Please enter your phone number."
        );

        return null;
    }


    if (!date) {

        showToast(
            "Please select a date."
        );

        return null;
    }


    if (!time) {

        showToast(
            "Please select a time."
        );

        return null;
    }


    if (!service) {

        showToast(
            "Please select a service."
        );

        return null;
    }


    const selectedService =
        SERVICES.find(
            item =>
                item.value === service
        );


    return {

        name,

        email,

        phone,

        date,

        time,

        service,

        serviceName:
            selectedService?.name ||
            "CRZ Service",

        amount:
            Number(service)

    };
}


/* =========================================================
   CREATE BOOKING
========================================================= */

async function createBooking() {

    const booking =
        getBookingData();

    if (!booking) return;


    const button =
        document.querySelector(
            ".checkout-button"
        );


    const originalText =
        button
            ? button.innerHTML
            : "";


    if (button) {

        button.disabled = true;

        button.innerHTML =
            "PROCESSING...";
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
                        JSON.stringify(
                            booking
                        )
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


        console.log(
            "CRZ booking:",
            data
        );


        showToast(
            data.message ||
            "Booking request received!"
        );


        /*
           Clear form.
        */

        $("bookingName").value = "";

        $("bookingEmail").value = "";

        $("bookingPhone").value = "";

        $("bookingTime").value = "";

        $("bookingService").value = "";

        updateTotal();


        /*
           Refresh availability.
        */

        await refreshAvailability();


    } catch (error) {

        console.error(
            "CRZ booking error:",
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
                originalText ||
                "CONTINUE TO PAYMENT ↗";
        }
    }
}


/* =========================================================
   TEST EMAIL / SMS
========================================================= */

async function sendTestNotification() {

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
            "Notification error:",
            error
        );


        showToast(
            error.message ||
            "Notification test failed."
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
        $("adminEmail")
            ?.value.trim();

    const password =
        $("adminPassword")
            ?.value;


    if (!email || !password) {

        showToast(
            "Enter your admin email and password."
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
                "Invalid credentials."
            );
        }


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
            "Admin login error:",
            error
        );


        showToast(
            error.message ||
            "Admin login failed."
        );
    }
}


/* =========================================================
   LOGOUT
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
   ADMIN DASHBOARD
========================================================= */

async function openDashboard() {

    const dashboard =
        $("dashboard");

    if (!dashboard) return;


    dashboard.classList.add(
        "show"
    );


    await loadAdminData();
}


/* =========================================================
   LOAD ADMIN DATA
========================================================= */

async function loadAdminData() {

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


        if (
            response.status === 401
        ) {

            logoutAdmin();

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Dashboard failed."
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

    if ($("todayCount")) {

        $("todayCount")
            .textContent =
            data.todayCount ?? 0;
    }


    if ($("futureCount")) {

        $("futureCount")
            .textContent =
            data.futureCount ?? 0;
    }


    if ($("completedCount")) {

        $("completedCount")
            .textContent =
            data.completedCount ?? 0;
    }


    if ($("revenue")) {

        $("revenue")
            .textContent =
            `₹${Number(
                data.revenue || 0
            ).toLocaleString("en-IN")}`;
    }


    renderBookings(
        data.bookings || []
    );


    renderBlockedSlots(
        data.blocked || []
    );
}


/* =========================================================
   BOOKINGS LIST
========================================================= */

function renderBookings(
    bookings
) {

    const container =
        $("bookingList");

    if (!container) return;


    container.innerHTML = "";


    if (!bookings.length) {

        container.innerHTML = `
            <p class="empty">
                No bookings yet.
            </p>
        `;

        return;
    }


    bookings.forEach(
        booking => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "booking-item";


            item.innerHTML = `

                <strong>
                    ${escapeHTML(
                        booking.name ||
                        "Unknown"
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        booking.date ||
                        ""
                    )}
                    ·
                    ${escapeHTML(
                        booking.time ||
                        ""
                    )}
                </small>

                <small>
                    ${escapeHTML(
                        booking.serviceName ||
                        ""
                    )}
                    ·
                    ₹${Number(
                        booking.amount ||
                        0
                    ).toLocaleString("en-IN")}
                </small>

                <small>
                    ${escapeHTML(
                        booking.email ||
                        ""
                    )}

                    <br>

                    ${escapeHTML(
                        booking.phone ||
                        ""
                    )}
                </small>

                <div class="booking-actions">

                    <button
                        onclick="updateBookingStatus(
                            '${escapeAttribute(
                                booking.id
                            )}',
                            'confirmed'
                        )"
                    >
                        CONFIRM
                    </button>

                    <button
                        onclick="updateBookingStatus(
                            '${escapeAttribute(
                                booking.id
                            )}',
                            'completed'
                        )"
                    >
                        COMPLETED
                    </button>

                    <button
                        onclick="updateBookingStatus(
                            '${escapeAttribute(
                                booking.id
                            )}',
                            'cancelled'
                        )"
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


/* =========================================================
   BLOCKED SLOTS
========================================================= */

function renderBlockedSlots(
    blocked
) {

    const container =
        $("blockedList");

    if (!container) return;


    container.innerHTML = "";


    if (!blocked.length) {

        container.innerHTML = `
            <p class="empty">
                No blocked slots.
            </p>
        `;

        return;
    }


    blocked.forEach(
        item => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "blocked-item";


            div.innerHTML = `

                <strong>
                    ${escapeHTML(
                        item.date || ""
                    )}
                </strong>

                <br>

                ${escapeHTML(
                    item.time || ""
                )}

                <br>

                ${escapeHTML(
                    item.reason ||
                    "Blocked by admin"
                )}

            `;


            container.appendChild(
                div
            );
        }
    );
}


/* =========================================================
   BLOCK TIME
========================================================= */

async function blockTime() {

    const date =
        $("blockDate")
            ?.value;

    const time =
        $("blockTime")
            ?.value;

    const reason =
        $("blockReason")
            ?.value.trim();


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
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Could not block slot."
            );
        }


        $("blockReason").value = "";


        await loadAdminData();


        showToast(
            "Time slot blocked."
        );


    } catch (error) {

        console.error(
            "Block error:",
            error
        );


        showToast(
            error.message ||
            "Could not block slot."
        );
    }
}


/* =========================================================
   BOOKING STATUS
========================================================= */

async function updateBookingStatus(
    id,
    status
) {

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
            "Status error:",
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
        confirm(
            "Clear all bookings? This cannot be undone."
        );


    if (!confirmed) return;


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
            "Clear bookings error:",
            error
        );


        showToast(
            error.message ||
            "Could not clear bookings."
        );
    }
}


/* =========================================================
   DJ VISUAL
========================================================= */

function createWaveform() {

    const waveform =
        document.querySelector(
            ".waveform"
        );

    if (!waveform) return;


    waveform.innerHTML = "";


    for (
        let i = 0;
        i < 40;
        i++
    ) {

        const bar =
            document.createElement(
                "span"
            );


        const height =
            15 +
            Math.random() * 55;


        bar.style.height =
            `${height}px`;


        bar.style.animationDelay =
            `${Math.random() * 1.2}s`;


        waveform.appendChild(
            bar
        );
    }
}


/* =========================================================
   ADMIN MODAL
========================================================= */

function setupAdminModal() {

    const modal =
        $("adminModal");

    if (!modal) return;


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeAdminLogin();

            }

        }
    );


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
}


/* =========================================================
   SECURITY HELPERS
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
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "CRZ initializing..."
        );


        /*
           1. Build dropdowns FIRST.
        */

        populateTimeSlots();

        populateServices();


        /*
           2. Set today's date.
        */

        setupDate();


        /*
           3. Calculate initial total.
        */

        updateTotal();


        /*
           4. Create DJ visual.
        */

        createWaveform();


        /*
           5. Admin modal.
        */

        setupAdminModal();


        /*
           6. Service changes.
        */

        const serviceSelect =
            $("bookingService");

        if (serviceSelect) {

            serviceSelect.addEventListener(
                "change",
                updateTotal
            );
        }


        /*
           7. Load availability.
        */

        await refreshAvailability();


        console.log(
            "CRZ initialized successfully."
        );
    }
);
