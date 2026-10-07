/*
====================================================
CRZ — DJ STUDIO PLATFORM
DEMO FRONTEND
====================================================

IMPORTANT:

This is a prototype.

Authentication, payments, refunds and bookings
are simulated using localStorage.

For production:

- Supabase/Auth
- PostgreSQL database
- Razorpay
- Server-side payment verification
- Webhooks
- SMS provider
- Email provider
- Secure admin authorization

must replace the demo logic.
====================================================
*/


/* =================================================
   CONFIG
================================================= */

const ADMIN_EMAIL = "admin@crz.studio";


const PACKAGES = {

    Practice: {
        price: 349,
        description:
            "4-CDJ setup + mixer + studio monitors"
    },

    Audio: {
        price: 549,
        description:
            "Practice + clean mixer audio recording"
    },

    Video: {
        price: 799,
        description:
            "Audio + 4-camera multi-view recording"
    },

    Edited: {
        price: 2499,
        description:
            "Audio + multi-camera video + edited final set"
    }

};


/* =================================================
   APPLICATION STATE
================================================= */

const state = {

    user:
        JSON.parse(
            localStorage.getItem("crzUser") || "null"
        ),

    bookings:
        JSON.parse(
            localStorage.getItem("crzBookings") || "[]"
        ),

    page:
        location.hash.replace("#", "") || "home",

    selectedPackage: "Video",

    selectedDate: "",

    selectedTime: "7:00 PM – 8:00 PM",

    selectedMethod: "UPI"

};


/* =================================================
   STORAGE
================================================= */

function saveState() {

    localStorage.setItem(
        "crzUser",
        JSON.stringify(state.user)
    );

    localStorage.setItem(
        "crzBookings",
        JSON.stringify(state.bookings)
    );

}


/* =================================================
   UTILITIES
================================================= */

function money(value) {

    return "₹" +
        Number(value).toLocaleString("en-IN");

}


function generateID(prefix = "CRZ") {

    return prefix +
        "-" +
        Math.floor(
            10000 + Math.random() * 90000
        );

}


function todayISO() {

    return new Date()
        .toISOString()
        .slice(0, 10);

}


function tomorrowISO() {

    const date = new Date();

    date.setDate(
        date.getDate() + 1
    );

    return date
        .toISOString()
        .slice(0, 10);

}


function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }

    return new Date(
        dateString + "T00:00:00"
    ).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/[&<>"']/g, char => {

            const map = {

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            };

            return map[char];

        });

}


function toast(message) {

    const element =
        document.getElementById("toast");

    if (!element) {
        return;
    }

    element.textContent = message;

    element.classList.add("show");

    setTimeout(() => {

        element.classList.remove("show");

    }, 2800);

}


/* =================================================
   NAVIGATION
================================================= */

function go(page) {

    state.page = page;

    location.hash = page;

    render();

}


/* =================================================
   NAVBAR
================================================= */

function navbar() {

    return `

<header class="topbar">

    <a
        href="#home"
        class="logo"
    >
        CRZ<i>.</i>
    </a>


    <nav class="nav">

        <a href="#home">
            Studio
        </a>

        <a href="#packages">
            Packages
        </a>

        <a href="#book">
            Book
        </a>


        ${
            state.user
                ? `
                    <a href="#account">
                        My Bookings
                    </a>
                `
                : ""
        }


        ${
            state.user?.email === ADMIN_EMAIL
                ? `
                    <a href="#admin">
                        Admin
                    </a>
                `
                : ""
        }


        ${
            state.user
                ? `
                    <button
                        class="btn small"
                        onclick="logout()"
                    >
                        LOG OUT
                    </button>
                `
                : `
                    <button
                        class="btn small"
                        onclick="openAuth()"
                    >
                        LOGIN / SIGN UP
                    </button>
                `
        }

    </nav>

</header>

`;

}


/* =================================================
   HOME PAGE
================================================= */

function homePage() {

    return `

<div class="app-shell">

${navbar()}


<section class="hero">

    <div class="grid"></div>

    <div class="eyebrow">
        BENGALURU • DJ STUDIO
    </div>


    <h1>

        PLAY.<br>

        <span class="outline">
            RECORD.
        </span><br>

        CREATE.

    </h1>


    <p>

        A compact professional DJ studio
        built for practice, audio recording,
        multi-camera video and edited
        performance sessions.

    </p>


    <div class="actions">

        <a
            class="btn primary"
            href="#book"
        >
            BOOK A SESSION
        </a>


        <a
            class="btn"
            href="#packages"
        >
            VIEW PACKAGES
        </a>

    </div>


    <div class="status">

        <span class="dot"></span>

        STUDIO ONLINE

    </div>

</section>



<section class="section">

    <div class="heading">

        <div class="eyebrow">
            THE SPACE
        </div>


        <h2>

            BUILT FOR<br>

            <span class="outline">
                THE SET.
            </span>

        </h2>

    </div>



    <div class="studio">


        <div class="visual">

            <div class="mark">
                CRZ
            </div>


            <div class="booth">

                CDJ • CDJ • MIXER • CDJ • CDJ

            </div>

        </div>



        <div class="features">

            <div class="feature">

                <b>04</b>

                <span>
                    Professional CDJs
                </span>

            </div>


            <div class="feature">

                <b>04</b>

                <span>
                    Dedicated camera angles
                </span>

            </div>


            <div class="feature">

                <b>01</b>

                <span>
                    Performance room
                </span>

            </div>


            <div class="feature">

                <b>∞</b>

                <span>
                    Sets to create
                </span>

            </div>

        </div>

    </div>

</section>



${packagesSection()}



<section class="section">


    <div class="cameras">


        <div>

            <div class="eyebrow">
                CRZ SESSION SYSTEM
            </div>


            <div class="heading">

                <h2>

                    FOUR ANGLES.<br>

                    <span class="outline">
                        ONE SET.
                    </span>

                </h2>

            </div>


            <p
                style="
                    color:#888;
                    line-height:1.8;
                "
            >

                Straight, left, right and
                overhead cameras give the
                video package a compact
                Boiler Room-inspired look.

            </p>

        </div>



        <div class="cammap">


            <div class="cam s">

                <b>CAM 01</b>

                STRAIGHT

            </div>


            <div class="cam l">

                <b>CAM 02</b>

                LEFT

            </div>


            <div class="cam r">

                <b>CAM 03</b>

                RIGHT

            </div>


            <div class="cam t">

                <b>CAM 04</b>

                TOP

            </div>


        </div>


    </div>

</section>



<section
    class="section dark"
    id="book"
>


    <div class="heading center">

        <div class="eyebrow">
            RESERVE YOUR SESSION
        </div>


        <h2>

            BOOK<br>

            <span class="outline">
                CRZ.
            </span>

        </h2>

    </div>


    ${bookingForm()}


</section>



<section class="delivery">


    <div>

        <div class="eyebrow">
            POST-PRODUCTION
        </div>


        <div class="heading">

            <h2>

                YOUR SET.<br>

                <span class="outline">
                    OUR EDIT.
                </span>

            </h2>

        </div>

    </div>


    <div>

        <p>

            Edited recordings go through
            synchronization, audio processing,
            multi-camera editing, colour work
            and CRZ quality control.

        </p>


        <div class="big">
            7–10
        </div>


        <p>
            BUSINESS DAYS — standard edited
            delivery window.
        </p>

    </div>

</section>



<footer>

    <div class="footerlogo">
        CRZ.
    </div>

    <p>
        PLAY. RECORD. CREATE.
    </p>

    <p>
        © 2026 CRZ — Prototype
    </p>

</footer>


</div>

`;

}


/* =================================================
   PACKAGES
================================================= */

function packagesSection() {

    return `

<section
    class="section dark"
    id="packages"
>


    <div class="heading center">

        <div class="eyebrow">
            CHOOSE YOUR SESSION
        </div>


        <h2>

            YOUR SET.<br>

            <span class="outline">
                YOUR WAY.
            </span>

        </h2>

    </div>



    <div class="packages">


        ${
            Object.entries(PACKAGES)
                .map(
                    ([name, packageData], index) => `

<article
    class="
        card
        ${
            name === "Video"
                ? "featured"
                : ""
        }
    "
>


    ${
        name === "Video"
            ? `
                <div class="tag">
                    MOST POPULAR
                </div>
            `
            : ""
    }


    <div class="num">
        0${index + 1}
    </div>


    <h3>
        ${name.toUpperCase()}
    </h3>


    <p>
        ${packageData.description}
    </p>


    <div class="price">

        ${money(packageData.price)}

        <small>
            / hr
        </small>

    </div>


    <button
        class="
            btn
            ${
                name === "Video"
                    ? "blue"
                    : ""
            }
        "
        onclick="
            choosePackage('${name}')
        "
    >

        BOOK

    </button>


</article>

`
                )
                .join("")
        }


    </div>

</section>

`;

}


/* =================================================
   BOOKING FORM
================================================= */

function bookingForm() {

    if (!state.user) {

        return `

<div class="booking">

    <div class="summary">

        <b>
            LOGIN REQUIRED
        </b>

        <br>

        <span>

            You need a CRZ account before
            making a booking.

            Your booking, payment and
            recording history stay attached
            to your account.

        </span>

    </div>


    <button
        class="btn primary"
        style="
            width:100%;
            margin-top:18px;
        "
        onclick="openAuth()"
    >

        LOGIN / SIGN UP

    </button>

</div>

`;

    }


    return `

<div class="booking">


    <div class="fields">


        <div class="field">

            <label>
                SESSION
            </label>


            <select
                id="bookPackage"
                onchange="updateBookPrice()"
            >

                ${
                    Object.entries(PACKAGES)
                        .map(
                            ([name, packageData]) => `

<option
    value="${name}"
    ${
        state.selectedPackage === name
            ? "selected"
            : ""
    }
>

    ${name}
    —
    ${money(packageData.price)}/hr

</option>

`
                        )
                        .join("")
                }

            </select>

        </div>



        <div class="field">

            <label>
                DATE
            </label>


            <input
                id="bookDate"
                type="date"
                min="${todayISO()}"
                value="${state.selectedDate}"
            >

        </div>



        <div class="field full">

            <label>
                TIME
            </label>


            <select id="bookTime">

                ${
                    [
                        "10:00 AM – 11:00 AM",
                        "11:00 AM – 12:00 PM",
                        "12:00 PM – 1:00 PM",
                        "1:00 PM – 2:00 PM",
                        "2:00 PM – 3:00 PM",
                        "3:00 PM – 4:00 PM",
                        "4:00 PM – 5:00 PM",
                        "5:00 PM – 6:00 PM",
                        "6:00 PM – 7:00 PM",
                        "7:00 PM – 8:00 PM",
                        "8:00 PM – 9:00 PM"
                    ]
                    .map(
                        time => `

<option
    ${
        state.selectedTime === time
            ? "selected"
            : ""
    }
>

    ${time}

</option>

`
                    )
                    .join("")
                }

            </select>

        </div>

    </div>



    <div class="total">

        <span>
            TOTAL
        </span>


        <strong id="bookTotal">

            ${money(
                PACKAGES[
                    state.selectedPackage
                ].price
            )}

        </strong>

    </div>



    <button
        class="btn primary"
        style="
            width:100%;
            margin-top:22px;
        "
        onclick="startCheckout()"
    >

        CONTINUE TO PAYMENT

    </button>


    <div class="notice">

        Payment is required to confirm
        the slot.

        Demo checkout only.

    </div>


</div>

`;

}


/* =================================================
   PACKAGE SELECTION
================================================= */

function choosePackage(packageName) {

    state.selectedPackage =
        packageName;

    location.hash = "book";

    render();


    setTimeout(() => {

        document
            .getElementById("book")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }, 30);

}


function updateBookPrice() {

    state.selectedPackage =
        document
            .getElementById("bookPackage")
            .value;


    document
        .getElementById("bookTotal")
        .textContent =
            money(
                PACKAGES[
                    state.selectedPackage
                ].price
            );

}


/* =================================================
   AUTHENTICATION
================================================= */

function openAuth() {

    document
        .getElementById("authModal")
        .classList
        .add("show");

}


function closeModal(id) {

    document
        .getElementById(id)
        .classList
        .remove("show");

}


function auth(mode) {

    document
        .getElementById("authMode")
        .value = mode;


    document
        .querySelectorAll(
            ".auth-tabs button"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.mode === mode
            );

        });


    document
        .getElementById("authSubmit")
        .textContent =
            mode === "login"
                ? "LOGIN"
                : "CREATE ACCOUNT";


    document
        .getElementById("nameWrap")
        .style.display =
            mode === "login"
                ? "none"
                : "block";

}


function submitAuth() {

    const mode =
        document
            .getElementById("authMode")
            .value;


    const email =
        document
            .getElementById("authEmail")
            .value
            .trim()
            .toLowerCase();


    const name =
        document
            .getElementById("authName")
            .value
            .trim();


    const phone =
        document
            .getElementById("authPhone")
            .value
            .trim();


    const error =
        document
            .getElementById("authError");


    if (
        !email ||
        !email.includes("@")
    ) {

        error.textContent =
            "Enter a valid email.";

        return;

    }


    if (!phone) {

        error.textContent =
            "Phone number is required for booking notifications.";

        return;

    }


    if (
        mode === "signup" &&
        !name
    ) {

        error.textContent =
            "Enter your name.";

        return;

    }


    state.user = {

        name:
            name ||
            email.split("@")[0],

        email,

        phone

    };


    saveState();


    closeModal("authModal");


    render();


    toast(
        "Welcome to CRZ."
    );

}


function googleDemo() {

    state.user = {

        name: "Google User",

        email:
            "google.demo@example.com",

        phone:
            "+91 90000 00000"

    };


    saveState();

    closeModal("authModal");

    render();

    toast(
        "Demo Google login successful."
    );

}


function logout() {

    state.user = null;

    saveState();

    go("home");

    toast(
        "Logged out."
    );

}


/* =================================================
   CHECKOUT
================================================= */

function startCheckout() {

    const date =
        document
            .getElementById("bookDate")
            .value;


    const time =
        document
            .getElementById("bookTime")
            .value;


    if (!date) {

        toast(
            "Choose a date first."
        );

        return;

    }


    if (date < todayISO()) {

        toast(
            "Choose a future date."
        );

        return;

    }


    state.selectedDate = date;

    state.selectedTime = time;


    const packageData =
        PACKAGES[
            state.selectedPackage
        ];


    document
        .getElementById("checkoutBody")
        .innerHTML = `

<div class="eyebrow">
    CRZ CHECKOUT
</div>


<h2>

    SELECT<br>

    <span class="outline">
        PAYMENT.
    </span>

</h2>


<div class="summary">

    <b>

        ${escapeHTML(
            state.selectedPackage
        )}

        —

        ${money(
            packageData.price
        )}

    </b>

    <br>

    ${formatDate(date)}

    <br>

    ${escapeHTML(time)}

    <br><br>

    Total

    <b style="color:#fff">

        ${money(
            packageData.price
        )}

    </b>

</div>



<div class="method-grid">


    ${
        [
            "UPI",
            "BHIM / UPI",
            "Credit / Debit Card",
            "Net Banking",
            "Wallets"
        ]
        .map(
            (method, index) => `

<button
    class="
        method
        ${
            index === 0
                ? "active"
                : ""
        }
    "
    onclick="
        selectMethod(
            this,
            '${method}'
        )
    "
>

    ${method}

</button>

`
        )
        .join("")
    }


</div>



<div
    id="methodExtra"
    class="field"
></div>



<button
    class="btn primary"
    style="width:100%"
    onclick="demoPay()"
>

    PAY

    ${money(
        packageData.price
    )}

</button>


<div class="notice">

    Demo only —
    no real payment is processed.

</div>

`;


    document
        .getElementById("checkoutModal")
        .classList
        .add("show");

}


/* =================================================
   PAYMENT METHOD
================================================= */

function selectMethod(
    element,
    method
) {

    document
        .querySelectorAll(".method")
        .forEach(
            button =>
                button.classList.remove(
                    "active"
                )
        );


    element.classList.add(
        "active"
    );


    state.selectedMethod =
        method;


    const extra =
        document
            .getElementById("methodExtra");


    if (
        method.includes("Card")
    ) {

        extra.innerHTML = `

<label>
    CARD DETAILS
</label>

<input
    placeholder="4111 1111 1111 1111"
>


<br><br>


<input
    placeholder="MM/YY"
    style="width:48%"
>


<input
    placeholder="CVV"
    style="
        width:48%;
        margin-left:2%;
    "
>

`;

    }

    else if (
        method === "Net Banking"
    ) {

        extra.innerHTML = `

<label>
    BANK
</label>

<select>

    <option>
        Select bank
    </option>

    <option>
        HDFC Bank
    </option>

    <option>
        ICICI Bank
    </option>

    <option>
        SBI
    </option>

    <option>
        Axis Bank
    </option>

</select>

`;

    }

    else if (
        method.includes("UPI")
    ) {

        extra.innerHTML = `

<label>
    UPI ID
</label>

<input
    placeholder="name@upi"
>

`;

    }

    else {

        extra.innerHTML = "";

    }

}


/* =================================================
   DEMO PAYMENT
================================================= */

function demoPay() {

    const packageData =
        PACKAGES[
            state.selectedPackage
        ];


    const booking = {

        id:
            generateID(),

        userEmail:
            state.user.email,

        userName:
            state.user.name,

        phone:
            state.user.phone,

        package:
            state.selectedPackage,

        price:
            packageData.price,

        date:
            state.selectedDate,

        time:
            state.selectedTime,

        paymentMethod:
            state.selectedMethod,

        paymentStatus:
            "Paid",

        bookingStatus:
            "Confirmed",

        refundStatus:
            "Not Requested",

        recordingStatus:
            state.selectedPackage === "Practice"
                ? "None"
                : state.selectedPackage === "Audio"
                    ? "Audio"
                    : "Pending",

        editingStatus:
            state.selectedPackage === "Edited"
                ? "Queued"
                : "Not Applicable",

        createdAt:
            new Date().toISOString()

    };


    state.bookings.push(
        booking
    );


    saveState();


    document
        .getElementById("checkoutBody")
        .innerHTML = `

<div class="success">


    <div class="check">
        ✓
    </div>


    <h2>

        BOOKING<br>

        <span class="outline">
            CONFIRMED.
        </span>

    </h2>


    <div class="summary">

        <b>
            ${booking.id}
        </b>

        <br>

        ${booking.package}

        •

        ${money(
            booking.price
        )}

        <br>

        ${formatDate(
            booking.date
        )}

        •

        ${booking.time}

        <br>

        Payment:

        ${booking.paymentMethod}

        ✓

    </div>


    <p
        style="
            color:#888;
            line-height:1.7;
        "
    >

        A confirmation email and SMS
        would be sent here in the
        production system.

    </p>


    <button
        class="btn primary"
        style="width:100%"
        onclick="
            closeModal('checkoutModal');
            go('account');
        "
    >

        VIEW MY BOOKING

    </button>


</div>

`;

}


/* =================================================
   CUSTOMER ACCOUNT
================================================= */

function accountPage() {

    if (!state.user) {

        return `

<div class="app-shell">

${navbar()}

<section
    class="section center"
>

    <div class="heading">

        <h2>

            LOGIN<br>

            <span class="outline">
                REQUIRED.
            </span>

        </h2>

    </div>


    <button
        class="btn primary"
        onclick="openAuth()"
    >

        LOGIN / SIGN UP

    </button>

</section>

</div>

`;

    }


    const bookings =
        state.bookings
            .filter(
                booking =>
                    booking.userEmail ===
                    state.user.email
            )
            .sort(
                (a, b) =>
                    a.date.localeCompare(
                        b.date
                    )
            );


    return `

<div class="app-shell">

${navbar()}


<section class="section">


<div class="dash-head">


<div>

    <div class="eyebrow">
        CUSTOMER ACCOUNT
    </div>


    <h1>

        WELCOME,

        ${escapeHTML(
            state.user.name
        ).toUpperCase()}

    </h1>


    <p
        style="color:#777"
    >

        ${escapeHTML(
            state.user.email
        )}

        •

        ${escapeHTML(
            state.user.phone
        )}

    </p>

</div>


<button
    class="btn primary"
    onclick="go('book')"
>

    BOOK AGAIN

</button>


</div>



<div class="metrics">


<div class="metric">

    <div class="label">
        TOTAL BOOKINGS
    </div>

    <div class="value">
        ${bookings.length}
    </div>

</div>


<div class="metric">

    <div class="label">
        UPCOMING
    </div>

    <div class="value">

        ${
            bookings.filter(
                booking =>
                    booking.date >= todayISO() &&
                    booking.bookingStatus ===
                        "Confirmed"
            ).length
        }

    </div>

</div>


<div class="metric">

    <div class="label">
        COMPLETED
    </div>

    <div class="value">

        ${
            bookings.filter(
                booking =>
                    booking.bookingStatus ===
                    "Completed"
            ).length
        }

    </div>

</div>


<div class="metric">

    <div class="label">
        RECORDINGS
    </div>

    <div class="value">

        ${
            bookings.filter(
                booking =>
                    booking.recordingStatus !==
                    "None"
            ).length
        }

    </div>

</div>


</div>



<div class="tablebox">


<div class="tabletop">

    <b>
        MY BOOKINGS
    </b>

</div>


${bookingTable(
    bookings,
    false
)}


</div>


</section>

</div>

`;

}


/* =================================================
   BOOKING TABLE
================================================= */

function bookingTable(
    bookings,
    admin = false
) {

    if (!bookings.length) {

        return `

<div
    style="
        padding:35px;
        color:#777;
    "
>

    No bookings yet.

</div>

`;

    }


    return `

<table class="table">


<thead>

<tr>

<th>
    ID
</th>


${
    admin
        ? `
<th>
    CUSTOMER
</th>
`
        : ""
}


<th>
    SESSION
</th>


<th>
    DATE / TIME
</th>


<th>
    PAYMENT
</th>


<th>
    BOOKING
</th>


<th>
    REFUND
</th>


<th>
    ACTIONS
</th>

</tr>

</thead>



<tbody>


${
    bookings
        .map(
            booking => `

<tr>


<td>
    ${booking.id}
</td>


${
    admin
        ? `
<td>

    ${escapeHTML(
        booking.userName
    )}

    <br>

    <span
        style="color:#555"
    >

        ${escapeHTML(
            booking.userEmail
        )}

    </span>

</td>
`
        : ""
}


<td>
    ${booking.package}
</td>


<td>

    ${formatDate(
        booking.date
    )}

    <br>

    ${booking.time}

</td>


<td>

<span
    class="
        badge
        ${
            booking.paymentStatus ===
            "Paid"
                ? "ok"
                : "warn"
        }
    "
>

    ${booking.paymentStatus}

</span>

</td>


<td>

<span
    class="
        badge

        ${
            booking.bookingStatus ===
            "Completed"
                ? "ok"
                : booking.bookingStatus ===
                    "Cancelled"
                    ? "bad"
                    : "blue"
        }
    "
>

    ${booking.bookingStatus}

</span>

</td>


<td>

<span
    class="
        badge

        ${
            booking.refundStatus ===
            "Refund Completed"
                ? "ok"
                : booking.refundStatus.includes(
                    "Refund"
                )
                    ? "warn"
                    : ""
        }
    "
>

    ${booking.refundStatus}

</span>

</td>


<td>

<div class="admin-actions">


${
    admin
        ? `
<button
    class="btn small"
    onclick="
        completeBooking(
            '${booking.id}'
        )
    "
>

    COMPLETE

</button>


<button
    class="btn small"
    onclick="
        cycleRefund(
            '${booking.id}'
        )
    "
>

    UPDATE REFUND

</button>
`
        : ""
}


${
    booking.bookingStatus !==
        "Cancelled" &&
    booking.bookingStatus !==
        "Completed"

        ? `

<button
    class="btn small danger"
    onclick="
        requestRefund(
            '${booking.id}'
        )
    "
>

    REFUND

</button>

`
        : ""
}


</div>

</td>


</tr>

`
        )
        .join("")
}


</tbody>

</table>

`;

}


/* =================================================
   ADMIN DASHBOARD
================================================= */

function adminPage() {

    if (
        state.user?.email !==
        ADMIN_EMAIL
    ) {

        return `

<div class="app-shell">

${navbar()}


<section
    class="section center"
>

    <h2>
        ACCESS DENIED
    </h2>


    <p
        style="color:#777"
    >

        Admin access is restricted.

    </p>

</section>

</div>

`;

    }


    const bookings =
        [
            ...state.bookings
        ].sort(
            (a, b) =>
                (
                    a.date +
                    a.time
                ).localeCompare(
                    b.date +
                    b.time
                )
        );


    const today =
        bookings.filter(
            booking =>
                booking.date ===
                todayISO()
        );


    const tomorrow =
        bookings.filter(
            booking =>
                booking.date ===
                tomorrowISO()
        );


    const future =
        bookings.filter(
            booking =>
                booking.date >
                    todayISO() &&
                booking.bookingStatus ===
                    "Confirmed"
        );


    const completed =
        bookings.filter(
            booking =>
                booking.bookingStatus ===
                "Completed"
        );


    const pendingPayment =
        bookings.filter(
            booking =>
                booking.paymentStatus ===
                "Pending"
        );


    const cancelled =
        bookings.filter(
            booking =>
                booking.bookingStatus ===
                "Cancelled"
        );


    const revenue =
        bookings
            .filter(
                booking =>
                    booking.paymentStatus ===
                    "Paid"
            )
            .reduce(
                (total, booking) =>
                    total + booking.price,
                0
            );


    const todayRevenue =
        today.reduce(
            (total, booking) =>
                total +
                (
                    booking.paymentStatus ===
                    "Paid"
                        ? booking.price
                        : 0
                ),
            0
        );


    return `

<div class="app-shell">

${navbar()}


<div class="dashboard">


<aside class="sidebar">


<div class="side-title">

    CRZ ADMIN

</div>


<div class="side">


<button
    class="active"
    onclick="
        adminTab('overview')
    "
>

    Overview

</button>


<button
    onclick="
        adminTab('bookings')
    "
>

    Bookings

</button>


<button
    onclick="
        adminTab('calendar')
    "
>

    Calendar

</button>


<button
    onclick="
        adminTab('customers')
    "
>

    Customers

</button>


<button
    onclick="
        adminTab('recordings')
    "
>

    Recordings

</button>


<button
    onclick="
        adminTab('editing')
    "
>

    Editing Queue

</button>


<button
    onclick="
        adminTab('refunds')
    "
>

    Refunds

</button>


<button
    onclick="
        adminTab('revenue')
    "
>

    Revenue

</button>


</div>

</aside>



<main
    class="main"
    id="adminMain"
>


<div class="dash-head">


<div>

    <div class="eyebrow">
        CONTROL CENTRE
    </div>


    <h1>
        OVERVIEW
    </h1>


    <p
        style="color:#777"
    >

        Today:

        ${formatDate(
            todayISO()
        )}

    </p>

</div>


<input
    class="search"
    placeholder="
        Search booking/customer...
    "
    oninput="
        adminSearch(
            this.value
        )
    "
>


</div>



<div class="metrics">


<div class="metric">

    <div class="label">
        TODAY BOOKINGS
    </div>

    <div class="value">
        ${today.length}
    </div>

</div>


<div class="metric">

    <div class="label">
        TODAY REVENUE
    </div>

    <div class="value">
        ${money(
            todayRevenue
        )}
    </div>

</div>


<div class="metric">

    <div class="label">
        TOTAL BOOKINGS
    </div>

    <div class="value">
        ${bookings.length}
    </div>

</div>


<div class="metric">

    <div class="label">
        TOTAL REVENUE
    </div>

    <div class="value">
        ${money(
            revenue
        )}
    </div>

</div>


</div>



<div class="submetrics">


<div class="mini">

    <b>
        ${tomorrow.length}
    </b>

    <span>
        TOMORROW
    </span>

</div>


<div class="mini">

    <b>
        ${future.length}
    </b>

    <span>
        FUTURE PENDING
    </span>

</div>


<div class="mini">

    <b>
        ${completed.length}
    </b>

    <span>
        COMPLETED
    </span>

</div>


<div class="mini">

    <b>
        ${cancelled.length}
    </b>

    <span>
        CANCELLED
    </span>

</div>


<div class="mini">

    <b>
        ${pendingPayment.length}
    </b>

    <span>
        PENDING PAYMENT
    </span>

</div>


</div>



<div class="tablebox">


<div class="tabletop">

    <b>
        TODAY'S SESSIONS
    </b>


    <span>
        ${today.length}
        bookings
    </span>

</div>


${bookingTable(
    today,
    true
)}


</div>



<div class="tablebox">


<div class="tabletop">

    <b>
        REFUND ACTIVITY
    </b>


    <span>

        ${
            bookings.filter(
                booking =>
                    booking.refundStatus !==
                    "Not Requested"
            ).length
        }

        records

    </span>

</div>


${bookingTable(
    bookings.filter(
        booking =>
            booking.refundStatus !==
            "Not Requested"
    ),
    true
)}


</div>


</main>


</div>


</div>

`;

}


/* =================================================
   ADMIN TABS
================================================= */

function adminTab(tab) {

    const main =
        document.getElementById(
            "adminMain"
        );


    if (!main) {
        return;
    }


    const bookings =
        [...state.bookings];


    let title = "";

    let rows = bookings;


    if (tab === "bookings") {

        title =
            "ALL BOOKINGS";

    }


    if (tab === "calendar") {

        renderCalendar();

        return;

    }


    if (tab === "customers") {

        renderCustomers();

        return;

    }


    if (tab === "recordings") {

        title =
            "RECORDINGS";

        rows =
            bookings.filter(
                booking =>
                    booking.recordingStatus !==
                    "None"
            );

    }


    if (tab === "editing") {

        title =
            "EDITING QUEUE";

        rows =
            bookings.filter(
                booking =>
                    booking.editingStatus &&
                    booking.editingStatus !==
                        "Not Applicable"
            );

    }


    if (tab === "refunds") {

        title =
            "REFUNDS";

        rows =
            bookings.filter(
                booking =>
                    booking.refundStatus !==
                    "Not Requested"
            );

    }


    if (tab === "revenue") {

        renderRevenue();

        return;

    }


    main.innerHTML = `

<div class="dash-head">

    <div>

        <div class="eyebrow">
            CRZ ADMIN
        </div>


        <h1>
            ${title}
        </h1>

    </div>

</div>



<div class="tablebox">

${bookingTable(
    rows,
    true
)}

</div>

`;

}


/* =================================================
   CUSTOMERS
================================================= */

function renderCustomers() {

    const main =
        document.getElementById(
            "adminMain"
        );


    const customerMap = {};


    state.bookings.forEach(
        booking => {

            customerMap[
                booking.userEmail
            ] = booking;

        }
    );


    const customers =
        Object.values(
            customerMap
        );


    main.innerHTML = `

<div class="dash-head">

    <div>

        <div class="eyebrow">
            CUSTOMERS
        </div>

        <h1>
            CUSTOMERS
        </h1>

    </div>

</div>



<div class="tablebox">


${
    customers.length

        ? customers
            .map(
                customer => `

<div
    style="
        padding:18px;
        border-bottom:
            1px solid #1c1c20;
    "
>

    <b>
        ${escapeHTML(
            customer.userName
        )}
    </b>

    <br>

    <span
        style="color:#777"
    >

        ${escapeHTML(
            customer.userEmail
        )}

        •

        ${escapeHTML(
            customer.phone
        )}

    </span>

</div>

`
            )
            .join("")

        : `

<div
    style="
        padding:30px;
        color:#777;
    "
>

    No customers.

</div>

`

}


</div>

`;

}


/* =================================================
   CALENDAR
================================================= */

function renderCalendar() {

    const main =
        document.getElementById(
            "adminMain"
        );


    const start =
        new Date();


    start.setDate(
        start.getDate() -
        start.getDay()
    );


    let html = `

<div class="dash-head">

    <div>

        <div class="eyebrow">
            SCHEDULE
        </div>

        <h1>
            CALENDAR
        </h1>

    </div>

</div>



<div class="calendar">

`;


    for (
        let i = 0;
        i < 35;
        i++
    ) {

        const day =
            new Date(start);


        day.setDate(
            start.getDate() + i
        );


        const iso =
            day
                .toISOString()
                .slice(0, 10);


        const events =
            state.bookings.filter(
                booking =>
                    booking.date ===
                    iso
            );


        html += `

<div class="day">

    <div class="date">

        ${day.toLocaleDateString(
            "en-IN",
            {
                weekday:
                    "short",
                day:
                    "numeric",
                month:
                    "short"
            }
        )}

    </div>


    ${
        events
            .map(
                booking => `

<div class="event">

    <b>

        ${
            booking.time
                .split("–")[0]
        }

        •

        ${booking.package}

    </b>


    ${escapeHTML(
        booking.userName
    )}

</div>

`
            )
            .join("")
    }

</div>

`;

    }


    html += `
</div>
`;


    main.innerHTML =
        html;

}


/* =================================================
   REVENUE
================================================= */

function renderRevenue() {

    const main =
        document.getElementById(
            "adminMain"
        );


    const paid =
        state.bookings.filter(
            booking =>
                booking.paymentStatus ===
                "Paid"
        );


    const gross =
        paid.reduce(
            (total, booking) =>
                total +
                booking.price,
            0
        );


    const refunded =
        state.bookings
            .filter(
                booking =>
                    booking.refundStatus ===
                    "Refund Completed"
            )
            .reduce(
                (total, booking) =>
                    total +
                    booking.price,
                0
            );


    main.innerHTML = `

<div class="dash-head">

    <div>

        <div class="eyebrow">
            FINANCE
        </div>

        <h1>
            REVENUE
        </h1>

    </div>

</div>



<div class="metrics">


<div class="metric">

    <div class="label">
        GROSS REVENUE
    </div>

    <div class="value">

        ${money(gross)}

    </div>

</div>


<div class="metric">

    <div class="label">
        PAID BOOKINGS
    </div>

    <div class="value">

        ${paid.length}

    </div>

</div>


<div class="metric">

    <div class="label">
        REFUNDED
    </div>

    <div class="value">

        ${money(refunded)}

    </div>

</div>


<div class="metric">

    <div class="label">
        NET DEMO TOTAL
    </div>

    <div class="value">

        ${money(
            gross - refunded
        )}

    </div>

</div>


</div>

`;

}


/* =================================================
   ADMIN SEARCH
================================================= */

function adminSearch(query) {

    if (!query) {

        adminTab(
            "bookings"
        );

        return;

    }


    const results =
        state.bookings.filter(
            booking => {

                const searchable =
                    `
                    ${booking.id}
                    ${booking.userName}
                    ${booking.userEmail}
                    ${booking.phone}
                    `
                    .toLowerCase();


                return searchable.includes(
                    query.toLowerCase()
                );

            }
        );


    document
        .getElementById("adminMain")
        .innerHTML = `

<div class="dash-head">

    <div>

        <div class="eyebrow">
            SEARCH
        </div>

        <h1>
            RESULTS
        </h1>

    </div>

</div>



<div class="tablebox">

${bookingTable(
    results,
    true
)}

</div>

`;

}


/* =================================================
   BOOKING ACTIONS
================================================= */

function completeBooking(
    bookingID
) {

    const booking =
        state.bookings.find(
            item =>
                item.id ===
                bookingID
        );


    if (!booking) {
        return;
    }


    booking.bookingStatus =
        "Completed";


    if (
        booking.package ===
        "Edited"
    ) {

        booking.editingStatus =
            "Queued";

    }


    saveState();

    render();

    toast(
        "Booking marked completed."
    );

}


/* =================================================
   REFUND REQUEST
================================================= */

function requestRefund(
    bookingID
) {

    const booking =
        state.bookings.find(
            item =>
                item.id ===
                bookingID
        );


    if (!booking) {
        return;
    }


    booking.bookingStatus =
        "Cancelled";


    booking.refundStatus =
        "Refund Requested";


    saveState();

    render();

    toast(
        "Refund requested."
    );

}


/* =================================================
   REFUND LIFECYCLE
================================================= */

function cycleRefund(
    bookingID
) {

    const booking =
        state.bookings.find(
            item =>
                item.id ===
                bookingID
        );


    if (!booking) {
        return;
    }


    const stages = [

        "Refund Requested",

        "Refund Initiated",

        "Refund Processing",

        "Refund Completed",

        "Refund Failed"

    ];


    let index =
        stages.indexOf(
            booking.refundStatus
        );


    booking.refundStatus =
        stages[
            (index + 1) %
            stages.length
        ];


    if (
        booking.refundStatus ===
        "Refund Completed"
    ) {

        booking.paymentStatus =
            "Refunded";

    }


    saveState();

    render();

    toast(
        `Refund: ${booking.refundStatus}`
    );

}


/* =================================================
   MODALS
================================================= */

function createModals() {

    if (
        document.getElementById(
            "authModal"
        )
    ) {

        return;

    }


    document.body.insertAdjacentHTML(
        "beforeend",

        `

<div
    class="modal"
    id="authModal"
>


<div class="modalbox">


<button
    class="close"
    onclick="
        closeModal(
            'authModal'
        )
    "
>

    ×

</button>


<div class="eyebrow">
    CRZ ACCOUNT
</div>


<h2>

    WELCOME<br>

    <span class="outline">
        BACK.
    </span>

</h2>



<div class="auth-tabs">


<button
    data-mode="login"
    class="active"
    onclick="
        auth('login')
    "
>

    LOGIN

</button>


<button
    data-mode="signup"
    onclick="
        auth('signup')
    "
>

    SIGN UP

</button>


</div>



<button
    class="google"
    onclick="googleDemo()"
>

    Continue with Google (Demo)

</button>


<div class="or">
    OR
</div>



<input
    type="hidden"
    id="authMode"
    value="login"
>



<div
    id="nameWrap"
    style="display:none"
    class="field"
>

    <label>
        NAME
    </label>


    <input
        id="authName"
        placeholder="Your name"
    >

</div>



<div class="field">

    <label>
        EMAIL
    </label>


    <input
        id="authEmail"
        type="email"
        placeholder="you@example.com"
    >

</div>



<div class="field">

    <label>
        PHONE
    </label>


    <input
        id="authPhone"
        placeholder="+91 XXXXX XXXXX"
    >

</div>



<div class="field">

    <label>
        PASSWORD
    </label>


    <input
        type="password"
        placeholder="Demo password"
    >

</div>



<div
    id="authError"
    class="auth-error"
></div>



<button
    id="authSubmit"
    class="btn primary"
    style="width:100%"
    onclick="
        submitAuth()
    "
>

    LOGIN

</button>



<div class="notice">

    Prototype authentication only.

</div>


</div>

</div>



<div
    class="modal"
    id="checkoutModal"
>


<div
    class="modalbox"
    id="checkoutBody"
></div>


</div>



<div
    id="toast"
    class="toast"
></div>

`

    );

}


/* =================================================
   RENDER
================================================= */

function render() {

    const app =
        document.getElementById(
            "app"
        );


    if (
        state.page ===
        "account"
    ) {

        app.innerHTML =
            accountPage();

    }

    else if (
        state.page ===
        "admin"
    ) {

        app.innerHTML =
            adminPage();

    }

    else {

        app.innerHTML =
            homePage();

    }


    createModals();


    if (
        location.hash ===
        "#packages"
    ) {

        setTimeout(
            () =>
                document
                    .getElementById(
                        "packages"
                    )
                    ?.scrollIntoView(),

            10
        );

    }


    if (
        location.hash ===
        "#book"
    ) {

        setTimeout(
            () =>
                document
                    .getElementById(
                        "book"
                    )
                    ?.scrollIntoView(),

            10
        );

    }

}


/* =================================================
   HASH ROUTING
================================================= */

window.addEventListener(
    "hashchange",
    () => {

        state.page =
            location.hash
                .replace(
                    "#",
                    ""
                ) ||
            "home";


        render();

    }
);


/* =================================================
   START
================================================= */

render();
