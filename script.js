const API_BASE = "https://crz-backend.onrender.com";

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
    250: "Practice",
    400: "Practice + Audio",
    500: "Practice + Audio + Video",
    1500: "Edited Recording"
};

const bookingTime = document.getElementById("bookingTime");
const blockTimeSelect = document.getElementById("blockTime");

TIME_SLOTS.forEach(slot => {

    bookingTime.add(
        new Option(slot, slot)
    );

    blockTimeSelect.add(
        new Option(slot, slot)
    );
});

const today = new Date();

const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, "0");
const dd = String(today.getDate()).padStart(2, "0");

const todayString = `${yyyy}-${mm}-${dd}`;

document.getElementById("bookingDate").min = todayString;
document.getElementById("blockDate").min = todayString;

document
    .getElementById("bookingService")
    .addEventListener("change", updateTotal);

document
    .getElementById("bookingDate")
    .addEventListener("change", checkSlot);

document
    .getElementById("bookingTime")
    .addEventListener("change", checkSlot);

function updateTotal() {

    const price =
        Number(
            document.getElementById(
                "bookingService"
            ).value
        ) || 0;

    document.getElementById(
        "bookingTotal"
    ).textContent = `₹${price.toLocaleString("en-IN")}`;
}

async function checkSlot() {

    const date =
        document.getElementById("bookingDate").value;

    const time =
        document.getElementById("bookingTime").value;

    const status =
        document.getElementById("slotStatus");

    if (!date || !time) {

        status.textContent = "";
        status.className = "slot-status";

        return;
    }

    status.textContent = "Checking availability...";
    status.className = "slot-status";

    try {

        const response = await fetch(
            `${API_BASE}/api/slot-status?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error || "Unable to check slot."
            );
        }

        if (result.available) {

            status.textContent =
                "✓ Slot available";

            status.className =
                "slot-status available";

        } else {

            status.textContent =
                "✕ BOOKED";

            status.className =
                "slot-status unavailable";

        }

    } catch (error) {

        status.textContent =
            "Unable to check availability.";

        status.className =
            "slot-status unavailable";
    }
}

async function createBooking() {

    const button =
        document.getElementById("checkoutButton");

    const booking = {

        name:
            document.getElementById(
                "bookingName"
            ).value.trim(),

        email:
            document.getElementById(
                "bookingEmail"
            ).value.trim(),

        phone:
            document.getElementById(
                "bookingPhone"
            ).value.trim(),

        date:
            document.getElementById(
                "bookingDate"
            ).value,

        time:
            document.getElementById(
                "bookingTime"
            ).value,

        service:
            Number(
                document.getElementById(
                    "bookingService"
                ).value
            )
    };

    if (
        !booking.name ||
        !booking.email ||
        !booking.phone ||
        !booking.date ||
        !booking.time ||
        !booking.service
    ) {

        showToast(
            "Please complete all booking details."
        );

        return;
    }

    button.disabled = true;
    button.innerHTML = "CHECKING SLOT...";

    try {

        const response = await fetch(
            `${API_BASE}/api/bookings/create`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(booking)
            }
        );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to create booking."
            );
        }

        if (!result.razorpayOrder) {

            throw new Error(
                "Payment gateway is not configured."
            );
        }

        await openRazorpay(
            result,
            booking
        );

    } catch (error) {

        showToast(
            error.message
        );

        button.disabled = false;
        button.innerHTML =
            "CONTINUE TO PAYMENT <span>↗</span>";
    }
}

async function openRazorpay(
    bookingResult,
    booking
) {

    const options = {

        key:
            bookingResult.razorpayKey,

        amount:
            bookingResult.razorpayOrder.amount,

        currency: "INR",

        name: "CRZ Studio",

        description:
            `${SERVICE_NAMES[booking.service]} — ${booking.time}`,

        order_id:
            bookingResult.razorpayOrder.id,

        prefill: {
            name: booking.name,
            email: booking.email,
            contact: booking.phone
        },

        theme: {
            color: "#ff1744"
        },

        handler: async function(response) {

            try {

                const verifyResponse =
                    await fetch(
                        `${API_BASE}/api/payments/verify`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                bookingId:
                                    bookingResult.bookingId,

                                razorpay_order_id:
                                    response.razorpay_order_id,

                                razorpay_payment_id:
                                    response.razorpay_payment_id,

                                razorpay_signature:
                                    response.razorpay_signature
                            })
                        }
                    );

                const result =
                    await verifyResponse.json();

                if (!verifyResponse.ok) {

                    throw new Error(
                        result.error ||
                        "Payment verification failed."
                    );
                }

                showToast(
                    "Payment successful. Booking confirmed!"
                );

                document
                    .getElementById("bookingName")
                    .value = "";

                document
                    .getElementById("bookingEmail")
                    .value = "";

                document
                    .getElementById("bookingPhone")
                    .value = "";

                document
                    .getElementById("bookingDate")
                    .value = "";

                document
                    .getElementById("bookingTime")
                    .value = "";

                document
                    .getElementById("bookingService")
                    .value = "";

                updateTotal();

            } catch (error) {

                showToast(
                    error.message
                );
            }

            document
                .getElementById("checkoutButton")
                .disabled = false;

            document
                .getElementById("checkoutButton")
                .innerHTML =
                    "CONTINUE TO PAYMENT <span>↗</span>";
        },

        modal: {
            ondismiss: function() {

                document
                    .getElementById("checkoutButton")
                    .disabled = false;

                document
                    .getElementById("checkoutButton")
                    .innerHTML =
                        "CONTINUE TO PAYMENT <span>↗</span>";
            }
        }
    };

    const rzp =
        new Razorpay(options);

    rzp.open();
}

function scrollToBooking() {

    document
        .getElementById("book")
        .scrollIntoView({
            behavior: "smooth"
        });
}

/* =========================
   ADMIN
========================= */

function openAdminLogin() {

    document
        .getElementById("adminModal")
        .classList.add("active");
}

function closeAdminLogin() {

    document
        .getElementById("adminModal")
        .classList.remove("active");
}

async function adminLogin() {

    const email =
        document
            .getElementById("adminEmail")
            .value.trim();

    const password =
        document
            .getElementById("adminPassword")
            .value;

    const error =
        document.getElementById(
            "adminLoginError"
        );

    error.textContent = "";

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

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Login failed."
            );
        }

        sessionStorage.setItem(
            "crzAdminToken",
            result.token
        );

        closeAdminLogin();

        document
            .getElementById("dashboard")
            .classList.add("active");

        await loadAdminDashboard();

    } catch (err) {

        error.textContent =
            err.message;
    }
}

function logoutAdmin() {

    sessionStorage.removeItem(
        "crzAdminToken"
    );

    document
        .getElementById("dashboard")
        .classList.remove("active");
}

async function loadAdminDashboard() {

    const token =
        sessionStorage.getItem(
            "crzAdminToken"
        );

    if (!token) return;

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

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to load dashboard."
            );
        }

        renderBookings(
            result.bookings
        );

        renderBlockedSlots(
            result.blockedSlots
        );

        document.getElementById(
            "todayCount"
        ).textContent =
            result.stats.today;

        document.getElementById(
            "futureCount"
        ).textContent =
            result.stats.future;

        document.getElementById(
            "completedCount"
        ).textContent =
            result.stats.completed;

        document.getElementById(
            "revenue"
        ).textContent =
            `₹${Number(
                result.stats.revenue
            ).toLocaleString("en-IN")}`;

    } catch (error) {

        showToast(error.message);
    }
}

function renderBookings(bookings) {

    const list =
        document.getElementById(
            "bookingList"
        );

    if (!bookings.length) {

        list.innerHTML =
            `<p class="empty">
                No bookings yet.
            </p>`;

        return;
    }

    list.innerHTML =
        bookings.map(booking => `

            <div class="admin-booking">

                <strong>
                    ${escapeHTML(booking.name)}
                </strong>

                <span>
                    ${escapeHTML(booking.date)}
                    ·
                    ${escapeHTML(booking.time)}
                </span>

                <span>
                    ${escapeHTML(booking.email)}
                </span>

                <span>
                    ${escapeHTML(booking.phone)}
                </span>

                <span>
                    ${escapeHTML(booking.serviceName)}
                </span>

                <strong>
                    ₹${Number(
                        booking.total
                    ).toLocaleString("en-IN")}
                </strong>

                <span class="booking-status">
                    ${escapeHTML(
                        booking.status
                    )}
                </span>

            </div>

        `).join("");
}

function renderBlockedSlots(slots) {

    const list =
        document.getElementById(
            "blockedList"
        );

    if (!slots.length) {

        list.innerHTML =
            `<p class="empty">
                No blocked slots.
            </p>`;

        return;
    }

    list.innerHTML =
        slots.map(slot => `

            <div class="blocked-item">

                <div>
                    <strong>
                        ${escapeHTML(slot.date)}
                    </strong>

                    <br>

                    <small>
                        ${escapeHTML(slot.time)}
                    </small>

                    <br>

                    <small>
                        ${escapeHTML(
                            slot.reason || "Blocked"
                        )}
                    </small>
                </div>

                <button
                    onclick="unblockTime('${slot.id}')"
                >
                    UNBLOCK
                </button>

            </div>

        `).join("");
}

async function blockTime() {

    const token =
        sessionStorage.getItem(
            "crzAdminToken"
        );

    if (!token) {

        showToast(
            "Admin login required."
        );

        return;
    }

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

        showToast(
            "Select a date and time."
        );

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/api/admin/block-slot`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        date,
                        time,
                        reason
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to block slot."
            );
        }

        document
            .getElementById("blockReason")
            .value = "";

        showToast(
            "Slot blocked successfully."
        );

        await loadAdminDashboard();

    } catch (error) {

        showToast(error.message);
    }
}

async function unblockTime(id) {

    const token =
        sessionStorage.getItem(
            "crzAdminToken"
        );

    if (!confirm(
        "Unblock this time slot?"
    )) return;

    try {

        const response =
            await fetch(
                `${API_BASE}/api/admin/unblock-slot`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        id
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to unblock slot."
            );
        }

        showToast(
            "Slot unblocked."
        );

        await loadAdminDashboard();

    } catch (error) {

        showToast(error.message);
    }
}

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
