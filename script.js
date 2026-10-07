/*
====================================================
CRZ — DJ STUDIO BENGALURU
FRONTEND PROTOTYPE
====================================================

DEMO ONLY

Authentication, payments, bookings, refunds,
email and SMS notifications are simulated with
localStorage.

PRODUCTION VERSION SHOULD USE:

- Supabase / Firebase authentication
- PostgreSQL / Supabase database
- Razorpay / another payment gateway
- Server-side payment verification
- Payment webhooks
- Transactional email provider
- Indian transactional SMS provider
- Proper admin authorization

ADMIN EMAIL:
admin@crz.studio
====================================================
*/


/* =================================================
   CONFIG
================================================= */

const ADMIN_EMAIL = "admin@crz.studio";


/* =================================================
   PACKAGES
================================================= */

const PACKAGES = {

    Practice: {
        price: 250,
        label: "Practice Only",
        desc:
            "4-CDJ setup + mixer + studio monitors"
    },

    Audio: {
        price: 400,
        label: "Practice + Audio",
        desc:
            "Practice + clean mixer audio recording"
    },

    Video: {
        price: 500,
        label: "Practice + Audio + Video",
        desc:
            "Audio + 4-camera multi-view recording"
    },

    Raw: {
        price: 600,
        label: "Raw Recording",
        desc:
            "Unedited audio + multi-view video"
    },

    Edited: {
        price: 1800,
        label: "Edited Recording",
        desc:
            "Audio + multi-view video + professional edit; 7–10 business days"
    }

};


/* =================================================
   HELPERS
================================================= */

const $ = selector =>
    document.querySelector(selector);


const esc = value =>
    String(value ?? "")
        .replace(
            /[&<>"']/g,
            character =>
                ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;"
                }[character])
        );


const money = value =>
    "₹" +
    Number(value || 0)
        .toLocaleString("en-IN");


const todayISO = () =>
    new Date()
        .toISOString()
        .slice(0, 10);


const addDays = days => {

    const date = new Date();

    date.setDate(
        date.getDate() + days
    );

    return date
        .toISOString()
        .slice(0, 10);

};


const formatDate = date =>
    new Date(
        date + "T00:00:00"
    ).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );


const generateID = () =>
    `CRZ-${Date.now()
        .toString(36)
        .toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;


/* =================================================
   STATE
================================================= */

const defaultState = {

    user: null,

    users: [],

    bookings: [],

    notifications: [],

    selectedPackage:
        "Practice",

    selectedDate:
        addDays(1),

    selectedTime:
        "18:00",

    selectedMethod:
        "UPI",

    adminTab:
        "overview"

};


let state =
    JSON.parse(
        localStorage.getItem(
            "crz_state"
        ) || "null"
    ) ||
    structuredClone(
        defaultState
    );


function save() {

    localStorage.setItem(
        "crz_state",
        JSON.stringify(state)
    );

}


/* =================================================
   TOAST
================================================= */

function toast(message) {

    const element =
        $("#toast");

    if (!element)
        return;

    element.textContent =
        message;

    element.classList.add(
        "show"
    );

    clearTimeout(
        window._toast
    );

    window._toast =
        setTimeout(
            () => {

                element.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =================================================
   NAVIGATION
================================================= */

function go(page) {

    location.hash =
        page;

}


/* =================================================
   NAVBAR
================================================= */

function navbar() {

    return `

<header class="nav">

    <a
        class="brand"
        href="#home"
    >
        CRZ
    </a>


    <nav>

        <a href="#home">
            HOME
        </a>

        <a href="#studio">
            STUDIO
        </a>

        <a href="#pricing">
            PRICING
        </a>

        <a href="#book">
            BOOK
        </a>

        ${
            state.user
                ?
                `
                <a href="#account">
                    ACCOUNT
                </a>
                `
                :
                `
                <a href="#login">
                    LOGIN
                </a>
                `
        }

        ${
            state.user?.email ===
            ADMIN_EMAIL
                ?
                `
                <a
                    class="admin-link"
                    href="#admin"
                >
                    ADMIN
                </a>
                `
                :
                ""
        }

    </nav>

</header>

`;

}


/* =================================================
   SHELL
================================================= */

function shell(content) {

    return `

<div class="shell">

    ${navbar()}

    ${content}

</div>

`;

}


/* =================================================
   HOME
================================================= */

function home() {

    return shell(`

<main class="hero">

    <div>

        <div class="eyebrow">

            BENGALURU ·
            DJ PRACTICE &
            RECORDING STUDIO

        </div>


        <h1>

            PRACTICE.<br>

            RECORD.<br>

            <span>
                CREATE.
            </span>

        </h1>


        <p class="lead">

            A compact, professional DJ
            room built around a 4-CDJ
            setup, multi-camera recording
            and a Boiler Room-inspired
            environment.

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
                href="#pricing"
            >
                VIEW PRICING
            </a>

        </div>


        <div class="stats">

            <div>

                <b>
                    4
                </b>

                <small>
                    CDJs
                </small>

            </div>


            <div>

                <b>
                    4
                </b>

                <small>
                    CAMERAS
                </small>

            </div>


            <div>

                <b>
                    ₹250
                </b>

                <small>
                    FROM / HOUR
                </small>

            </div>

        </div>

    </div>

</main>


<section
    id="studio"
    class="section"
>

    <div class="section-head">

        <span>
            01
        </span>

        <h2>
            THE STUDIO
        </h2>

    </div>


    <div class="grid3">

        <article>

            <b>
                PRO DJ SETUP
            </b>

            <p>

                Four CDJs, professional
                mixer and studio monitoring
                for serious practice.

            </p>

        </article>


        <article>

            <b>
                4-CAMERA SYSTEM
            </b>

            <p>

                Straight, left, right and
                top camera angles for
                content and set recording.

            </p>

        </article>


        <article>

            <b>
                CONTROLLED ROOM
            </b>

            <p>

                Acoustic treatment,
                controlled lighting and
                a focused environment.

            </p>

        </article>

    </div>

</section>


<section class="cta">

    <div>

        <span class="eyebrow">
            CRZ · BENGALURU
        </span>

        <h2>

            Your set.<br>
            Your room.

        </h2>

    </div>


    <a
        class="btn primary"
        href="#book"
    >
        BOOK NOW
    </a>

</section>

`);

}


/* =================================================
   PRICING
================================================= */

function pricing() {

    return shell(`

<section
    id="pricing"
    class="section pricing"
>

    <div class="section-head">

        <span>
            02
        </span>

        <h2>
            PRICING
        </h2>

    </div>


    <div class="cards">

        ${
            Object.entries(
                PACKAGES
            )
            .map(
                ([key, pkg], index) => `

<article
    class="price-card
    ${
        index === 2
            ? "featured"
            : ""
    }"
>

    <div class="num">

        0${index + 1}

    </div>


    <h3>

        ${esc(pkg.label)}

    </h3>


    <p>

        ${esc(pkg.desc)}

    </p>


    <strong>

        ${money(pkg.price)}

        <small>
            /hr
        </small>

    </strong>


    <button
        class="btn
        ${
            index === 2
                ? "primary"
                : ""
        }"
        onclick="
            selectPackage('${key}')
        "
    >

        BOOK THIS

    </button>

</article>

`
            )
            .join("")
        }

    </div>


    <p class="note">

        Edited recordings are delivered
        within approximately 7–10
        business days. Editing availability
        may affect delivery time.

    </p>

</section>

`);

}


/* =================================================
   STUDIO
================================================= */

function studio() {

    return shell(`

<section class="section">

    <div class="section-head">

        <span>
            03
        </span>

        <h2>
            STUDIO
        </h2>

    </div>


    <div class="studio-panel">

        <div>

            <div class="camera-grid">

                <i>
                    CAM 1 · FRONT
                </i>

                <i>
                    CAM 2 · LEFT
                </i>

                <i>
                    CAM 3 · RIGHT
                </i>

                <i>
                    CAM 4 · TOP
                </i>

            </div>

        </div>


        <div>

            <h3>

                4-CDJ ·
                MULTI-VIEW ·
                RECORDING

            </h3>


            <p>

                Designed for DJs who want
                professional practice sessions
                without the scale of a full
                event venue.

            </p>


            <a
                class="btn primary"
                href="#book"
            >

                RESERVE THE ROOM

            </a>

        </div>

    </div>

</section>

`);

}


/* =================================================
   LOGIN
================================================= */

function login() {

    return shell(`

<section class="auth">

    <div class="auth-card">

        <span class="eyebrow">
            CRZ ACCOUNT
        </span>


        <h2>
            WELCOME BACK.
        </h2>


        <form
            onsubmit="
                loginSubmit(event)
            "
        >

            <input
                id="loginEmail"
                type="email"
                placeholder="Email"
                required
            >


            <input
                id="loginPass"
                type="password"
                placeholder="Password"
                required
            >


            <button
                class="btn primary"
            >

                LOGIN

            </button>

        </form>


        <p>

            New to CRZ?

            <a href="#signup">
                Create an account
            </a>

        </p>


        <p class="demo">

            Admin demo:
            admin@crz.studio

        </p>

    </div>

</section>

`);

}


/* =================================================
   SIGNUP
================================================= */

function signup() {

    return shell(`

<section class="auth">

    <div class="auth-card">

        <span class="eyebrow">
            CRZ ACCOUNT
        </span>


        <h2>
            CREATE ACCOUNT.
        </h2>


        <form
            onsubmit="
                signupSubmit(event)
            "
        >

            <input
                id="signupName"
                placeholder="Full name"
                required
            >


            <input
                id="signupEmail"
                type="email"
                placeholder="Email"
                required
            >


            <input
                id="signupPhone"
                type="tel"
                placeholder="Phone number"
                required
            >


            <input
                id="signupPass"
                type="password"
                minlength="6"
                placeholder="Password (6+ characters)"
                required
            >


            <button
                class="btn primary"
            >

                CREATE ACCOUNT

            </button>

        </form>


        <p>

            Already registered?

            <a href="#login">
                Login
            </a>

        </p>

    </div>

</section>

`);

}


/* =================================================
   PACKAGE SELECTION
================================================= */

function selectPackage(key) {

    state.selectedPackage =
        key;

    save();

    go("book");

}


/* =================================================
   BOOKING PAGE
================================================= */

function book() {

    if (!state.user) {

        return shell(`

<section class="auth">

    <div class="auth-card">

        <span class="eyebrow">
            BOOK CRZ
        </span>


        <h2>
            LOGIN REQUIRED.
        </h2>


        <p>

            Create an account so CRZ
            can send booking confirmations
            and keep your sessions in your
            account.

        </p>


        <a
            class="btn primary"
            href="#login"
        >

            LOGIN / SIGN UP

        </a>

    </div>

</section>

`);

    }


    return shell(`

<section
    class="section booking-page"
>

    <div class="section-head">

        <span>
            04
        </span>

        <h2>
            BOOK A SESSION
        </h2>

    </div>


    <div class="booking-layout">


        <form
            class="booking-form"
            onsubmit="
                openCheckout(event)
            "
        >

            <label>

                SESSION

                <select id="package">

                    ${
                        Object.entries(
                            PACKAGES
                        )
                        .map(
                            ([key, pkg]) => `

<option
    value="${key}"
    ${
        key ===
        state.selectedPackage
            ? "selected"
            : ""
    }
>

    ${pkg.label}
    —
    ${money(pkg.price)}/hr

</option>

`
                        )
                        .join("")
                    }

                </select>

            </label>


            <div class="two">

                <label>

                    DATE

                    <input
                        id="date"
                        type="date"
                        min="${todayISO()}"
                        value="${state.selectedDate}"
                        required
                    >

                </label>


                <label>

                    TIME

                    <select id="time">

                        ${
                            [
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
                                "20:00",
                                "21:00"
                            ]
                            .map(
                                time => `

<option
    ${
        time ===
        state.selectedTime
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

                </label>

            </div>


            <div class="account-info">

                <b>
                    Notifications
                </b>

                <span>
                    ${esc(state.user.email)}
                </span>

                <span>
                    ${esc(state.user.phone)}
                </span>

                <small>

                    Confirmation email +
                    SMS will be simulated
                    in this prototype.

                </small>

            </div>


            <button
                class="btn primary full"
            >

                CONTINUE TO PAYMENT ·

                <span>

                    ${money(
                        PACKAGES[
                            state.selectedPackage
                        ].price
                    )}

                </span>

            </button>

        </form>


        <aside class="booking-summary">

            <span class="eyebrow">
                YOUR SESSION
            </span>


            <h3>

                ${
                    PACKAGES[
                        state.selectedPackage
                    ].label
                }

            </h3>


            <p>

                ${
                    PACKAGES[
                        state.selectedPackage
                    ].desc
                }

            </p>


            <strong>

                ${money(
                    PACKAGES[
                        state.selectedPackage
                    ].price
                )}/hr

            </strong>


            <hr>


            <small>

                Professional equipment ·
                Controlled room ·
                Booking confirmation

            </small>

        </aside>

    </div>

</section>

`);

}


/* =================================================
   CHECKOUT
================================================= */

function openCheckout(event) {

    event.preventDefault();


    state.selectedPackage =
        $("#package").value;


    state.selectedDate =
        $("#date").value;


    state.selectedTime =
        $("#time").value;


    save();


    const pkg =
        PACKAGES[
            state.selectedPackage
        ];


    document.body.insertAdjacentHTML(
        "beforeend",
        `

<div
    class="modal"
    id="checkout"
>

    <div class="modal-card">

        <button
            class="close"
            onclick="
                closeModal()
            "
        >

            ×

        </button>


        <span class="eyebrow">
            PAYMENT
        </span>


        <h2>
            CONFIRM & PAY.
        </h2>


        <div class="checkout-summary">

            <b>
                ${pkg.label}
            </b>

            <span>

                ${formatDate(
                    state.selectedDate
                )}

                ·

                ${state.selectedTime}

            </span>


            <strong>

                ${money(pkg.price)}

            </strong>

        </div>


        <div class="methods">

            <button
                class="method active"
                onclick="
                    setMethod(this,'UPI')
                "
            >
                UPI
            </button>


            <button
                class="method"
                onclick="
                    setMethod(this,'Card')
                "
            >
                CARD
            </button>


            <button
                class="method"
                onclick="
                    setMethod(
                        this,
                        'Net Banking'
                    )
                "
            >
                NET BANKING
            </button>


            <button
                class="method"
                onclick="
                    setMethod(
                        this,
                        'BHIM UPI'
                    )
                "
            >
                BHIM
            </button>

        </div>


        <div
            id="methodExtra"
            class="method-extra"
        >

            <input
                placeholder="UPI ID (demo)"
                id="upi"
            >

        </div>


        <button
            class="btn primary full"
            onclick="
                demoPay()
            "
        >

            PAY
            ${money(pkg.price)}
            · TEST PAYMENT

        </button>


        <p class="demo">

            Prototype mode —
            no real money is charged.

        </p>

    </div>

</div>

`
    );

}


/* =================================================
   PAYMENT METHOD
================================================= */

function setMethod(
    element,
    method
) {

    document
        .querySelectorAll(
            ".method"
        )
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
        $("#methodExtra");


    if (
        method.includes(
            "UPI"
        )
    ) {

        extra.innerHTML = `

<input
    id="upi"
    placeholder="UPI ID (demo)"
>

`;

    }

    else if (
        method === "Card"
    ) {

        extra.innerHTML = `

<div class="two">

<input
    placeholder="Card number"
>

<input
    placeholder="MM/YY"
>

</div>

`;

    }

    else if (
        method ===
        "Net Banking"
    ) {

        extra.innerHTML = `

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

    else {

        extra.innerHTML = "";

    }

}


/* =================================================
   DEMO PAYMENT
================================================= */

function demoPay() {

    const pkg =
        PACKAGES[
            state.selectedPackage
        ];


    const slotTaken =
        state.bookings.some(
            booking =>

                booking.date ===
                    state.selectedDate &&

                booking.time ===
                    state.selectedTime &&

                booking.bookingStatus !==
                    "Cancelled"
        );


    if (slotTaken) {

        toast(
            "That slot is already booked."
        );

        return;

    }


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

        packageLabel:
            pkg.label,

        price:
            pkg.price,

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

            state.selectedPackage ===
                "Practice"

                ?

                "None"

                :

                state.selectedPackage ===
                    "Audio"

                ?

                "Audio"

                :

                state.selectedPackage ===
                    "Video"

                ?

                "Audio + Video"

                :

                "Raw Audio + Video",


        editingStatus:

            state.selectedPackage ===
                "Edited"

                ?

                "Queued"

                :

                "Not Applicable",


        createdAt:
            new Date()
                .toISOString()

    };


    state.bookings.push(
        booking
    );


    /*
    =================================================
    TEST EMAIL + SMS
    =================================================
    */

    sendTestNotifications(
        booking
    );


    save();


    $("#checkout").innerHTML = `

<div
    class="modal-card success"
>

    <div class="check">
        ✓
    </div>


    <span class="eyebrow">

        CRZ ·
        ${esc(booking.id)}

    </span>


    <h2>

        BOOKING<br>

        <span>
            CONFIRMED.
        </span>

    </h2>


    <p>

        ${esc(pkg.label)}

        ·

        ${formatDate(
            booking.date
        )}

        ·

        ${booking.time}

    </p>


    <strong>

        ${money(
            booking.price
        )}

    </strong>


    <div
        class="notification-result"
    >

        <b>
            TEST NOTIFICATIONS SENT
        </b>


        <span>

            ✓ Email →

            ${esc(
                booking.userEmail
            )}

        </span>


        <span>

            ✓ SMS →

            ${esc(
                booking.phone
            )}

        </span>

    </div>


    <button
        class="btn primary full"
        onclick="
            closeModal();
            go('account')
        "
    >

        VIEW MY BOOKING

    </button>

</div>

`;


    toast(
        "Booking confirmed — test email + SMS logged."
    );

}


/* =================================================
   TEST EMAIL + SMS
================================================= */

function sendTestNotifications(
    booking
) {

    const timestamp =
        new Date()
            .toISOString();


    /*
    EMAIL
    */

    state.notifications.push({

        id:
            generateID(),

        bookingId:
            booking.id,

        type:
            "EMAIL",

        to:
            booking.userEmail,

        status:
            "Sent (Test)",

        subject:
            `CRZ booking confirmed · ${booking.id}`,

        message:

            `Your CRZ session is confirmed for ` +

            `${formatDate(
                booking.date
            )} at ${booking.time}. ` +

            `${booking.packageLabel}. ` +

            `Total ${money(
                booking.price
            )}.`,

        createdAt:
            timestamp

    });


    /*
    SMS
    */

    state.notifications.push({

        id:
            generateID(),

        bookingId:
            booking.id,

        type:
            "SMS",

        to:
            booking.phone,

        status:
            "Sent (Test)",

        subject:
            "CRZ booking confirmation",

        message:

            `CRZ: Booking ${booking.id} ` +

            `confirmed. ` +

            `${formatDate(
                booking.date
            )} ${booking.time}. ` +

            `${money(
                booking.price
            )}.`,

        createdAt:
            timestamp

    });

}


/* =================================================
   ACCOUNT
================================================= */

function account() {

    if (!state.user)
        return login();


    const bookings =
        state.bookings
            .filter(
                booking =>
                    booking.userEmail ===
                    state.user.email
            )
            .reverse();


    return shell(`

<section class="section">

    <div class="account-head">

        <div>

            <span class="eyebrow">
                MY CRZ
            </span>


            <h2>

                ${esc(
                    state.user.name
                ).toUpperCase()}

            </h2>


            <p>

                ${esc(
                    state.user.email
                )}

                ·

                ${esc(
                    state.user.phone
                )}

            </p>

        </div>


        <button
            class="btn"
            onclick="
                logout()
            "
        >

            LOGOUT

        </button>

    </div>


    <div
        class="stats cards4"
    >

        <div>

            <b>
                ${bookings.length}
            </b>

            <small>
                TOTAL BOOKINGS
            </small>

        </div>


        <div>

            <b>

                ${
                    bookings.filter(
                        b =>
                            b.bookingStatus ===
                            "Confirmed"
                    ).length
                }

            </b>

            <small>
                UPCOMING
            </small>

        </div>


        <div>

            <b>

                ${
                    bookings.filter(
                        b =>
                            b.bookingStatus ===
                            "Completed"
                    ).length
                }

            </b>

            <small>
                COMPLETED
            </small>

        </div>


        <div>

            <b>

                ${money(
                    bookings.reduce(
                        (
                            total,
                            booking
                        ) =>
                            total +
                            booking.price,
                        0
                    )
                )}

            </b>

            <small>
                SPEND
            </small>

        </div>

    </div>


    <div class="table-wrap">

        <table>

            <thead>

                <tr>

                    <th>
                        BOOKING
                    </th>

                    <th>
                        SESSION
                    </th>

                    <th>
                        DATE
                    </th>

                    <th>
                        PAYMENT
                    </th>

                    <th>
                        STATUS
                    </th>

                </tr>

            </thead>


            <tbody>

                ${
                    bookings.length

                    ?

                    bookings
                        .map(
                            bookingRow
                        )
                        .join("")

                    :

                    `

<tr>

<td
    colspan="5"
    class="empty"
>

    No bookings yet.

</td>

</tr>

`
                }

            </tbody>

        </table>

    </div>

</section>

`);

}


/* =================================================
   BOOKING ROW
================================================= */

function bookingRow(
    booking
) {

    return `

<tr>

<td>

    <b>
        ${esc(
            booking.id
        )}
    </b>

    <small>
        ${esc(
            booking.userEmail
        )}
    </small>

</td>


<td>

    ${esc(
        booking.packageLabel
    )}

</td>


<td>

    ${formatDate(
        booking.date
    )}

    <small>
        ${booking.time}
    </small>

</td>


<td>

    ${money(
        booking.price
    )}

    <small>
        ${esc(
            booking.paymentMethod
        )}
    </small>

</td>


<td>

    <span
        class="
            status
            ${booking.bookingStatus.toLowerCase()}
        "
    >

        ${esc(
            booking.bookingStatus
        )}

    </span>

</td>

</tr>

`;

}


/* =================================================
   ADMIN DASHBOARD
================================================= */

function admin() {

    if (
        state.user?.email !==
        ADMIN_EMAIL
    ) {

        return shell(`

<section class="auth">

    <div class="auth-card">

        <h2>
            ACCESS DENIED.
        </h2>


        <p>

            Admin access is restricted
            to the configured admin email.

        </p>

    </div>

</section>

`);

    }


    const bookings =
        [
            ...state.bookings
        ]
        .sort(
            (a, b) =>
                (
                    a.date +
                    a.time
                )
                .localeCompare(
                    b.date +
                    b.time
                )
        );


    const revenue =
        bookings
            .filter(
                booking =>
                    booking.paymentStatus ===
                    "Paid"
            )
            .reduce(
                (
                    total,
                    booking
                ) =>
                    total +
                    booking.price,
                0
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
                addDays(1)
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


    const refunds =
        bookings.filter(
            booking =>
                booking.refundStatus !==
                "Not Requested"
        );


    let content = "";


    /* =================================================
       ADMIN TABS
    ================================================= */

    switch (
        state.adminTab
    ) {


        /* ---------------------------------------------
           BOOKINGS
        --------------------------------------------- */

        case "bookings":

            content = `

<div class="table-wrap">

<table>

<thead>

<tr>

<th>
    ID / CUSTOMER
</th>

<th>
    SESSION
</th>

<th>
    DATE
</th>

<th>
    PAYMENT
</th>

<th>
    STATUS
</th>

<th>
    ACTIONS
</th>

</tr>

</thead>


<tbody>

${
    bookings.length

    ?

    bookings
        .map(
            booking => `

<tr>

<td>

    <b>
        ${esc(
            booking.id
        )}
    </b>

    <small>
        ${esc(
            booking.userName
        )}
        <br>
        ${esc(
            booking.userEmail
        )}
    </small>

</td>


<td>

    ${esc(
        booking.packageLabel
    )}

</td>


<td>

    ${formatDate(
        booking.date
    )}

    <small>
        ${booking.time}
    </small>

</td>


<td>

    ${money(
        booking.price
    )}

    <small>
        ${esc(
            booking.paymentMethod
        )}
    </small>

</td>


<td>

    <span
        class="
            status
            ${booking.bookingStatus.toLowerCase()}
        "
    >

        ${esc(
            booking.bookingStatus
        )}

    </span>

</td>


<td>

    <button
        class="mini"
        onclick="
            completeBooking(
                '${booking.id}'
            )
        "
    >

        Complete

    </button>


    <button
        class="mini danger"
        onclick="
            refund(
                '${booking.id}'
            )
        "
    >

        Refund

    </button>

</td>

</tr>

`
        )
        .join("")

    :

    `

<tr>

<td
    colspan="6"
    class="empty"
>

    No bookings.

</td>

</tr>

`
}

</tbody>

</table>

</div>

`;

            break;


        /* ---------------------------------------------
           CALENDAR
        --------------------------------------------- */

        case "calendar":

            content = `

<div class="grid3">

<article>

    <b>
        TODAY
    </b>

    <h3>
        ${today.length}
    </h3>


    <p>

        ${
            today
                .map(
                    booking =>
                        esc(
                            booking.time
                        ) +
                        " · " +
                        esc(
                            booking.packageLabel
                        )
                )
                .join("<br>")

            ||

            "No sessions"
        }

    </p>

</article>


<article>

    <b>
        TOMORROW
    </b>

    <h3>
        ${tomorrow.length}
    </h3>


    <p>

        ${
            tomorrow
                .map(
                    booking =>
                        esc(
                            booking.time
                        ) +
                        " · " +
                        esc(
                            booking.packageLabel
                        )
                )
                .join("<br>")

            ||

            "No sessions"
        }

    </p>

</article>


<article>

    <b>
        FUTURE
    </b>

    <h3>
        ${future.length}
    </h3>


    <p>
        Confirmed future bookings.
    </p>

</article>

</div>

`;

            break;


        /* ---------------------------------------------
           CUSTOMERS
        --------------------------------------------- */

        case "customers": {

            const customers =
                [
                    ...new Map(
                        bookings.map(
                            booking => [

                                booking.userEmail,

                                {
                                    name:
                                        booking.userName,

                                    email:
                                        booking.userEmail,

                                    phone:
                                        booking.phone

                                }

                            ]
                        )
                    ).values()
                ];


            content = `

<div class="table-wrap">

<table>

<thead>

<tr>

<th>
    NAME
</th>

<th>
    EMAIL
</th>

<th>
    PHONE
</th>

<th>
    BOOKINGS
</th>

</tr>

</thead>


<tbody>

${
    customers
        .map(
            customer => `

<tr>

<td>
    ${esc(
        customer.name
    )}
</td>

<td>
    ${esc(
        customer.email
    )}
</td>

<td>
    ${esc(
        customer.phone
    )}
</td>

<td>

    ${
        bookings.filter(
            booking =>
                booking.userEmail ===
                customer.email
        ).length
    }

</td>

</tr>

`
        )
        .join("")

    ||

    `

<tr>

<td colspan="4">
    No customers.
</td>

</tr>

`
}

</tbody>

</table>

</div>

`;

            break;

        }


        /* ---------------------------------------------
           RECORDINGS
        --------------------------------------------- */

        case "recordings":

            content = `

<div class="queue">

${
    bookings
        .filter(
            booking =>
                booking.recordingStatus !==
                "None"
        )
        .map(
            booking => `

<article>

    <b>
        ${esc(
            booking.id
        )}
    </b>

    <span>
        ${esc(
            booking.packageLabel
        )}
    </span>

    <small>
        ${esc(
            booking.recordingStatus
        )}
    </small>

</article>

`
        )
        .join("")

    ||

    `
    <p class="empty">
        No recording jobs.
    </p>
    `
}

</div>

`;

            break;


        /* ---------------------------------------------
           EDITING
        --------------------------------------------- */

        case "editing":

            content = `

<div class="queue">

${
    bookings
        .filter(
            booking =>
                booking.editingStatus ===
                "Queued"
        )
        .map(
            booking => `

<article>

    <b>
        ${esc(
            booking.id
        )}
    </b>

    <span>
        ${esc(
            booking.userName
        )}
    </span>

    <small>

        Queued ·
        7–10 business days

    </small>

</article>

`
        )
        .join("")

    ||

    `
    <p class="empty">
        No editing jobs.
    </p>
    `
}

</div>

`;

            break;


        /* ---------------------------------------------
           REFUNDS
        --------------------------------------------- */

        case "refunds":

            content = `

<div class="table-wrap">

<table>

<thead>

<tr>

<th>
    BOOKING
</th>

<th>
    AMOUNT
</th>

<th>
    STATUS
</th>

</tr>

</thead>


<tbody>

${
    refunds
        .map(
            booking => `

<tr>

<td>
    ${esc(
        booking.id
    )}
</td>

<td>
    ${money(
        booking.price
    )}
</td>

<td>
    ${esc(
        booking.refundStatus
    )}
</td>

</tr>

`
        )
        .join("")

    ||

    `

<tr>

<td colspan="3">
    No refunds.
</td>

</tr>

`
}

</tbody>

</table>

</div>

`;

            break;


        /* ---------------------------------------------
           NOTIFICATIONS
        --------------------------------------------- */

        case "notifications":

            content = `

<div class="table-wrap">

<table>

<thead>

<tr>

<th>
    TYPE
</th>

<th>
    TO
</th>

<th>
    BOOKING
</th>

<th>
    STATUS
</th>

<th>
    TIME
</th>

</tr>

</thead>


<tbody>

${
    state.notifications
        .slice()
        .reverse()
        .map(
            notification => `

<tr>

<td>

    ${esc(
        notification.type
    )}

</td>


<td>

    ${esc(
        notification.to
    )}

</td>


<td>

    ${esc(
        notification.bookingId
    )}

</td>


<td>

<span
    class="
        status
        completed
    "
>

    ${esc(
        notification.status
    )}

</span>

</td>


<td>

    ${new Date(
        notification.createdAt
    ).toLocaleString(
        "en-IN"
    )}

</td>

</tr>

`
        )
        .join("")

    ||

    `

<tr>

<td colspan="5">
    No notifications.
</td>

</tr>

`
}

</tbody>

</table>

</div>

`;

            break;


        /* ---------------------------------------------
           OVERVIEW
        --------------------------------------------- */

        default:

            content = `

<div class="stats cards4">

<div>

    <b>
        ${bookings.length}
    </b>

    <small>
        TOTAL BOOKINGS
    </small>

</div>


<div>

    <b>
        ${today.length}
    </b>

    <small>
        TODAY
    </small>

</div>


<div>

    <b>
        ${future.length}
    </b>

    <small>
        FUTURE PENDING
    </small>

</div>


<div>

    <b>
        ${money(revenue)}
    </b>

    <small>
        REVENUE
    </small>

</div>

</div>


<div class="grid3">

<article>

    <b>
        COMPLETED
    </b>

    <h3>
        ${completed.length}
    </h3>

</article>


<article>

    <b>
        REFUNDS
    </b>

    <h3>
        ${refunds.length}
    </h3>

</article>


<article>

    <b>
        NOTIFICATIONS
    </b>

    <h3>
        ${state.notifications.length}
    </h3>

    <a
        href="#admin?notifications"
        onclick="
            adminTab('notifications')
        "
    >

        View test email/SMS log

    </a>

</article>

</div>

`;

    }


    return shell(`

<section class="admin">

    <div class="admin-top">

        <div>

            <span class="eyebrow">
                CRZ CONTROL
            </span>

            <h2>
                ADMIN DASHBOARD
            </h2>

        </div>


        <span class="admin-pill">

            ${esc(
                ADMIN_EMAIL
            )}

        </span>

    </div>


    <div class="admin-layout">


        <aside class="side">

            <button
                class="${
                    state.adminTab ===
                    "overview"
                        ? "active"
                        : ""
                }"
                onclick="
                    adminTab('overview')
                "
            >
                Overview
            </button>


            <button
                class="${
                    state.adminTab ===
                    "bookings"
                        ? "active"
                        : ""
                }"
                onclick="
                    adminTab('bookings')
                "
            >
                Bookings
            </button>


            <button
                class="${
                    state.adminTab ===
                    "calendar"
                        ? "active"
                        : ""
                }"
                onclick="
                    adminTab('calendar')
                "
            >
                Calendar
            </button>


            <button
                class="${
                    state.adminTab ===
                    "customers"
                        ? "active"
                        : ""
                }"
                onclick="
                    adminTab('customers')
                "
            >
                Customers
            </button>


            <button
                class="${
                    state.adminTab ===
                    "recordings"
                        ? "active"
                        : ""
                }"
                onclick="
                    adminTab('recordings')
                "
            >
                Recordings
            </button>


            <button
                class="${
                    state.adminTab ===
                    "editing"
                        ? "active"
                        : ""
                }"
                onclick="
                    adminTab('editing')
                "
            >
                Editing Queue
            </button>


            <button
                class="${
                    state.adminTab ===
                    "refunds"
                        ? "active"
                        : ""
                }"
                onclick="
                    adminTab('refunds')
                "
            >
                Refunds
            </button>


            <button
                class="${
                    state.adminTab ===
                    "notifications"
                        ? "active"
                        : ""
                }"
                onclick="
                    adminTab('notifications')
                "
            >
                Email / SMS
            </button>

        </aside>


        <main class="admin-main">

            ${content}

        </main>

    </div>

</section>

`);

}


/* =================================================
   ADMIN TAB
================================================= */

function adminTab(tab) {

    state.adminTab =
        tab;

    save();

    render();

}


/* =================================================
   COMPLETE BOOKING
================================================= */

function completeBooking(
    bookingID
) {

    const booking =
        state.bookings.find(
            booking =>
                booking.id ===
                bookingID
        );


    if (!booking)
        return;


    booking.bookingStatus =
        "Completed";


    save();

    render();

    toast(
        "Booking marked completed."
    );

}


/* =================================================
   REFUND
================================================= */

function refund(
    bookingID
) {

    const booking =
        state.bookings.find(
            item =>
                item.id ===
                bookingID
        );


    if (!booking)
        return;


    booking.refundStatus =
        "Refund Initiated";


    save();

    render();

    toast(
        "Refund initiated (demo)."
    );


    setTimeout(
        () => {

            const updated =
                state.bookings.find(
                    item =>
                        item.id ===
                        bookingID
                );


            if (!updated)
                return;


            updated.refundStatus =
                "Refund Completed";


            save();

            render();

        },
        1200
    );

}


/* =================================================
   SIGNUP
================================================= */

function signupSubmit(
    event
) {

    event.preventDefault();


    const name =
        $("#signupName")
            .value
            .trim();


    const email =
        $("#signupEmail")
            .value
            .trim()
            .toLowerCase();


    const phone =
        $("#signupPhone")
            .value
            .trim();


    const password =
        $("#signupPass")
            .value;


    if (
        state.users.some(
            user =>
                user.email ===
                email
        )
        ||
        email ===
        ADMIN_EMAIL
    ) {

        toast(
            "Email already registered."
        );

        return;

    }


    state.users.push({

        name,

        email,

        phone,

        pass:
            password

    });


    state.user = {

        name,

        email,

        phone

    };


    save();


    toast(
        "Account created."
    );


    go("book");

}


/* =================================================
   LOGIN
================================================= */

function loginSubmit(
    event
) {

    event.preventDefault();


    const email =
        $("#loginEmail")
            .value
            .trim()
            .toLowerCase();


    const password =
        $("#loginPass")
            .value;


    /*
    ADMIN DEMO
    */

    if (
        email ===
        ADMIN_EMAIL
    ) {

        state.user = {

            name:
                "CRZ Admin",

            email:
                ADMIN_EMAIL,

            phone:
                "+91 00000 00000"

        };


        save();

        go("admin");

        return;

    }


    const user =
        state.users.find(
            item =>
                item.email ===
                    email &&

                item.pass ===
                    password
        );


    if (!user) {

        toast(
            "Invalid email or password."
        );

        return;

    }


    state.user = {

        name:
            user.name,

        email:
            user.email,

        phone:
            user.phone

    };


    save();


    go("account");

}


/* =================================================
   LOGOUT
================================================= */

function logout() {

    state.user =
        null;

    save();

    go("home");

}


/* =================================================
   CLOSE MODALS
================================================= */

function closeModal() {

    document
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            modal =>
                modal.remove()
        );

}


/* =================================================
   ROUTER
================================================= */

function render() {

    const route =
        location.hash
            .slice(1) ||
        "home";


    let html;


    if (
        route ===
        "home"
    ) {

        html =
            home();

    }

    else if (
        route ===
        "studio"
    ) {

        html =
            studio();

    }

    else if (
        route ===
        "pricing"
    ) {

        html =
            pricing();

    }

    else if (
        route ===
        "book"
    ) {

        html =
            book();

    }

    else if (
        route ===
        "login"
    ) {

        html =
            login();

    }

    else if (
        route ===
        "signup"
    ) {

        html =
            signup();

    }

    else if (
        route ===
        "account"
    ) {

        html =
            account();

    }

    else if (
        route.startsWith(
            "admin"
        )
    ) {

        html =
            admin();

    }

    else {

        html =
            home();

    }


    $("#app").innerHTML =
        html;

}


/* =================================================
   GLOBAL EVENTS
================================================= */

window.addEventListener(
    "hashchange",
    render
);


/* =================================================
   GLOBAL FUNCTIONS
================================================= */

window.selectPackage =
    selectPackage;

window.openCheckout =
    openCheckout;

window.setMethod =
    setMethod;

window.demoPay =
    demoPay;

window.closeModal =
    closeModal;

window.loginSubmit =
    loginSubmit;

window.signupSubmit =
    signupSubmit;

window.logout =
    logout;

window.adminTab =
    adminTab;

window.completeBooking =
    completeBooking;

window.refund =
    refund;


/* =================================================
   START
================================================= */

render();
