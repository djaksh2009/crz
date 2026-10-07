/* =========================================================
   CRZ v1
   COMPLETE FRONTEND
========================================================= */


/*
   IMPORTANT:

   GitHub Pages cannot run Node/Firebase Admin directly.

   Once your backend is deployed, change this URL.

   Example:
   https://crz-backend.onrender.com

   For local testing:
   http://localhost:3000
*/

const API_BASE =
    window.CRZ_API_BASE ||
    "https://crz-backend.onrender.com";


/* =========================================================
   DATA
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
        id: "practice",
        name: "Practice",
        price: 250,
        label: "Practice — ₹250/hr"
    },

    {
        id: "practice_audio",
        name: "Practice + Audio",
        price: 400,
        label: "Practice + Audio — ₹400/hr"
    },

    {
        id: "practice_audio_video",
        name: "Practice + Audio + Video",
        price: 500,
        label: "Practice + Audio + Video — ₹500/hr"
    },

    {
        id: "raw_recording",
        name: "Raw Recording",
        price: 600,
        label: "Raw Recording — ₹600/hr"
    },

    {
        id: "edited_recording",
        name: "Edited Recording",
        price: 1500,
        label: "Edited Recording — ₹1,500–₹2,000/hr"
    }

];


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


function toast(message) {

    let element =
        $("crzToast");


    if (!element) {

        element =
            document.createElement("div");

        element.id =
            "crzToast";

        element.style.cssText = `

            position:fixed;
            left:50%;
            bottom:30px;
            transform:translate(-50%,20px);
            background:#111;
            color:#fff;
            border:1px solid rgba(255,255,255,.15);
            padding:14px 20px;
            z-index:99999;
            font:12px Inter,sans-serif;
            opacity:0;
            transition:.25s;

        `;

        document.body.appendChild(element);

    }


    element.textContent =
        message;


    element.style.opacity =
        "1";

    element.style.transform =
        "translate(-50%,0)";


    clearTimeout(
        window.crzToastTimer
    );


    window.crzToastTimer =
        setTimeout(() => {

            element.style.opacity =
                "0";

            element.style.transform =
                "translate(-50%,20px)";

        }, 3000);

}


/* =========================================================
   NAV
========================================================= */

function scrollToBooking() {

    $("book")?.scrollIntoView({
        behavior: "smooth"
    });

}


/* =========================================================
   DATE
========================================================= */

function setupDate() {

    const input =
        $("bookingDate");

    if (!input) return;


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(2,"0");


    const day =
        String(
            today.getDate()
        ).padStart(2,"0");


    input.min =
        `${year}-${month}-${day}`;


    if (!input.value) {

        input.value =
            `${year}-${month}-${day}`;

    }


    input.addEventListener(
        "change",
        refreshAvailability
    );

}


/* =========================================================
   TIME SLOTS
========================================================= */

function populateTimeSlots(
    blocked = [],
    bookings = []
) {

    const select =
        $("bookingTime");

    if (!select) return;


    select.innerHTML = `

        <option value="">
            Select time
        </option>

    `;


    TIME_SLOTS.forEach(slot => {

        const option =
            document.createElement("option");


        option.value =
            slot;


        option.textContent =
            slot;


        const blockedSlot =
            blocked.some(
                item =>
                    item.time === slot
            );


        const bookedSlot =
            bookings.some(
                item =>
                    item.time === slot &&
                    item.status !== "cancelled"
            );


        if (
            blockedSlot ||
            bookedSlot
        ) {

            option.disabled =
                true;


            option.textContent =
                `${slot} — ${
                    blockedSlot
                        ? "UNAVAILABLE"
                        : "BOOKED"
                }`;

        }


        select.appendChild(
            option
        );

    });

}


/* =========================================================
   SERVICES
========================================================= */

function populateServices() {

    const select =
        $("bookingService");

    if (!select) return;


    select.innerHTML = `

        <option value="">
            Select service
        </option>

    `;


    SERVICES.forEach(service => {

        const option =
            document.createElement("option");


        option.value =
            service.id;


        option.textContent =
            service.label;


        select.appendChild(
            option
        );

    });

}


/* =========================================================
   ADMIN TIME DROPDOWN
========================================================= */

function populateAdminTimes() {

    const select =
        $("blockTime");

    if (!select) return;


    select.innerHTML = "";


    TIME_SLOTS.forEach(slot => {

        const option =
            document.createElement("option");

        option.value =
            slot;

        option.textContent =
            slot;

        select.appendChild(
            option
        );

    });

}


/* =========================================================
   TOTAL
========================================================= */

function updateTotal() {

    const serviceId =
        $("bookingService")?.value;


    const service =
        SERVICES.find(
            item =>
                item.id === serviceId
        );


    $("bookingTotal").textContent =
        service
            ? `₹${service.price.toLocaleString("en-IN")}`
            : "₹0";

}


/* =========================================================
   AVAILABILITY
========================================================= */

async function refreshAvailability() {

    populateTimeSlots();


    const date =
        $("bookingDate")?.value;


    if (!date) return;


    try {

        const response =
            await fetch(
                `${API_BASE}/api/availability?date=${encodeURIComponent(date)}`
            );


        if (!response.ok)
            throw new Error();


        const data =
            await response.json();


        populateTimeSlots(
            data.blocked || [],
            data.bookings || []
        );


    } catch {

        /*
           Backend unavailable should NOT
           make the dropdown disappear.
        */

        populateTimeSlots();

    }

}


/* =========================================================
   CREATE BOOKING
========================================================= */

async function createBooking() {

    const name =
        $("bookingName").value.trim();


    const email =
        $("bookingEmail").value.trim();


    const phone =
        $("bookingPhone").value.trim();


    const date =
        $("bookingDate").value;


    const time =
        $("bookingTime").value;


    const serviceId =
        $("bookingService").value;


    if (!name)
        return toast("Enter your name.");


    if (!email)
        return toast("Enter your email.");


    if (!phone)
        return toast("Enter your phone number.");


    if (!date)
        return toast("Select a date.");


    if (!time)
        return toast("Select a time.");


    if (!serviceId)
        return toast("Select a service.");


    const service =
        SERVICES.find(
            item =>
                item.id === serviceId
        );


    const button =
        document.querySelector(
            ".booking-card .checkout-button"
        );


    const original =
        button.innerHTML;


    button.disabled =
        true;


    button.innerHTML =
        "CHECKING SLOT...";


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
                        JSON.stringify({

                            name,
                            email,
                            phone,
                            date,
                            time,

                            service:
                                service.id,

                            serviceName:
                                service.name,

                            amount:
                                service.price

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok)
            throw new Error(
                data.message ||
                "Booking failed."
            );


        toast(
            "Booking request received. Check your email and SMS."
        );


        $("bookingName").value = "";
        $("bookingEmail").value = "";
        $("bookingPhone").value = "";
        $("bookingTime").value = "";
        $("bookingService").value = "";


        updateTotal();


        refreshAvailability();


    } catch (error) {

        toast(
            error.message ||
            "Could not create booking."
        );

    } finally {

        button.disabled =
            false;

        button.innerHTML =
            original;

    }

}


/* =========================================================
   ADMIN MODAL
========================================================= */

function openAdminLogin() {

    $("adminModal")
        ?.classList.add("show");

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
        $("adminEmail").value.trim();


    const password =
        $("adminPassword").value;


    if (!email || !password)
        return toast(
            "Enter your admin credentials."
        );


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


        if (!response.ok)
            throw new Error(
                data.message ||
                "Login failed."
            );


        sessionStorage.setItem(
            "crz_admin_token",
            data.token
        );


        closeAdminLogin();

        $("dashboard")
            .classList.add("show");


        loadDashboard();


    } catch (error) {

        toast(
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

}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

    const token =
        sessionStorage.getItem(
            "crz_admin_token"
        );


    if (!token)
        return;


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


        $("todayCount")
            .textContent =
            data.todayCount || 0;


        $("futureCount")
            .textContent =
            data.futureCount || 0;


        $("pendingPaymentCount")
            .textContent =
            data.pendingPaymentCount || 0;


        $("revenue")
            .textContent =
            `₹${Number(
                data.revenue || 0
            ).toLocaleString("en-IN")}`;


        renderBookings(
            data.bookings || []
        );


        renderBlocked(
            data.blocked || []
        );


    } catch (error) {

        console.error(error);

        toast(
            "Could not load dashboard."
        );

    }

}


/* =========================================================
   RENDER BOOKINGS
========================================================= */

function renderBookings(
    bookings
) {

    const list =
        $("bookingList");


    if (!bookings.length) {

        list.innerHTML = `
            <p class="empty">
                No bookings yet.
            </p>
        `;

        return;

    }


    list.innerHTML =
        bookings.map(
            booking => `

            <div class="booking-item">

                <strong>
                    ${escapeHTML(
                        booking.name
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        booking.date
                    )}
                    ·
                    ${escapeHTML(
                        booking.time
                    )}
                </small>

                <small>
                    ${escapeHTML(
                        booking.serviceName
                    )}
                    ·
                    ₹${Number(
                        booking.amount || 0
                    ).toLocaleString("en-IN")}
                </small>

                <small>
                    ${escapeHTML(
                        booking.email
                    )}
                    <br>
                    ${escapeHTML(
                        booking.phone
                    )}
                </small>

                <span class="booking-status">
                    ${escapeHTML(
                        booking.status
                    )}
                    ·
                    payment:
                    ${escapeHTML(
                        booking.paymentStatus
                    )}
                </span>


                <div class="booking-actions">

                    <button
                        onclick="markPayment(
                            '${escapeAttribute(
                                booking.id
                            )}'
                        )"
                    >
                        PAYMENT CONFIRMED
                    </button>


                    <button
                        onclick="confirmBooking(
                            '${escapeAttribute(
                                booking.id
                            )}'
                        )"
                    >
                        CONFIRM BOOKING
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

            </div>

        `
        ).join("");

}


/* =========================================================
   PAYMENT CONFIRMATION
========================================================= */

async function markPayment(id) {

    await adminAction(
        `/api/admin/bookings/${encodeURIComponent(id)}/payment`,
        "POST",
        {},
        "Payment marked confirmed."
    );

}


/* =========================================================
   BOOKING CONFIRMATION
========================================================= */

async function confirmBooking(id) {

    await adminAction(
        `/api/admin/bookings/${encodeURIComponent(id)}/confirm`,
        "POST",
        {},
        "Booking confirmed."
    );

}


/* =========================================================
   STATUS
========================================================= */

async function updateBookingStatus(
    id,
    status
) {

    await adminAction(
        `/api/admin/bookings/${encodeURIComponent(id)}/status`,
        "PATCH",
        { status },
        `Booking marked ${status}.`
    );

}


/* =========================================================
   ADMIN ACTION
========================================================= */

async function adminAction(
    endpoint,
    method,
    body,
    success
) {

    const token =
        sessionStorage.getItem(
            "crz_admin_token"
        );


    try {

        const response =
            await fetch(
                `${API_BASE}${endpoint}`,
                {

                    method,

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify(body)

                }
            );


        const data =
            await response.json();


        if (!response.ok)
            throw new Error(
                data.message ||
                "Action failed."
            );


        toast(success);


        loadDashboard();


    } catch (error) {

        toast(
            error.message ||
            "Action failed."
        );

    }

}


/* =========================================================
   BLOCK TIME
========================================================= */

async function blockTime() {

    const date =
        $("blockDate").value;


    const time =
        $("blockTime").value;


    const reason =
        $("blockReason")
            .value.trim();


    if (!date)
        return toast(
            "Select a date."
        );


    if (!time)
        return toast(
            "Select a time."
        );


    const token =
        sessionStorage.getItem(
            "crz_admin_token"
        );


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
                                "Blocked by CRZ admin"

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok)
            throw new Error(
                data.message ||
                "Could not block slot."
            );


        $("blockReason").value =
            "";


        toast(
            "Time slot blocked."
        );


        loadDashboard();


    } catch (error) {

        toast(
            error.message
        );

    }

}


/* =========================================================
   RENDER BLOCKED
========================================================= */

function renderBlocked(
    blocked
) {

    const element =
        $("blockedList");


    if (!blocked.length) {

        element.innerHTML = `
            <p class="empty">
                No blocked slots.
            </p>
        `;

        return;

    }


    element.innerHTML =
        blocked.map(
            item => `

            <div class="blocked-item">

                <strong>
                    ${escapeHTML(
                        item.date
                    )}
                </strong>

                <br>

                ${escapeHTML(
                    item.time
                )}

                <br>

                <small>
                    ${escapeHTML(
                        item.reason
                    )}
                </small>

            </div>

        `
        ).join("");

}


/* =========================================================
   DJ CONTROLLER
========================================================= */

const DJ = {

    playing: {
        A: false,
        B: false
    },

    rotation: {
        A: 0,
        B: 0
    },

    time: {
        A: 0,
        B: 0
    },

    bpm: {
        A: 128,
        B: 128
    }

};


/* =========================================================
   WAVEFORM
========================================================= */

function createWaveform() {

    const container =
        $("waveBars");


    if (!container) return;


    container.innerHTML =
        "";


    for (
        let i = 0;
        i < 120;
        i++
    ) {

        const bar =
            document.createElement("span");


        bar.style.height =
            `${15 + Math.random() * 70}%`;


        container.appendChild(
            bar
        );

    }

}


/* =========================================================
   PLAY
========================================================= */

document
    .querySelectorAll(".play-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const deck =
                    button.dataset.deck;


                DJ.playing[deck] =
                    !DJ.playing[deck];


                button.classList.toggle(
                    "playing",
                    DJ.playing[deck]
                );


                button.textContent =
                    DJ.playing[deck]
                        ? "❚❚"
                        : "▶";

            }
        );

    });


/* =========================================================
   CUE
========================================================= */

document
    .querySelectorAll(".cue-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                button.classList.toggle(
                    "active"
                );

            }
        );

    });


/* =========================================================
   SYNC
========================================================= */

document
    .querySelectorAll(".sync-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                DJ.bpm.A =
                    128;

                DJ.bpm.B =
                    128;


                $("deckABpm")
                    .textContent =
                    "128.0";


                $("deckBBpm")
                    .textContent =
                    "128.0";


                button.classList.add(
                    "active"
                );


                setTimeout(
                    () =>
                        button.classList.remove(
                            "active"
                        ),
                    400
                );

            }
        );

    });


/* =========================================================
   PADS
========================================================= */

document
    .querySelectorAll(
        ".performance-pads button"
    )
    .forEach(pad => {

        pad.addEventListener(
            "pointerdown",
            () => {

                pad.classList.add(
                    "active"
                );

            }
        );


        pad.addEventListener(
            "pointerup",
            () => {

                pad.classList.remove(
                    "active"
                );

            }
        );


        pad.addEventListener(
            "pointerleave",
            () => {

                pad.classList.remove(
                    "active"
                );

            }
        );

    });


/* =========================================================
   JOG WHEELS
========================================================= */

document
    .querySelectorAll(".jog-wheel")
    .forEach(jog => {

        let dragging =
            false;

        let previousX =
            0;


        jog.addEventListener(
            "pointerdown",
            event => {

                dragging =
                    true;

                previousX =
                    event.clientX;


                jog.setPointerCapture(
                    event.pointerId
                );

            }
        );


        jog.addEventListener(
            "pointermove",
            event => {

                if (!dragging)
                    return;


                const deck =
                    jog.dataset.deck;


                const movement =
                    event.clientX -
                    previousX;


                previousX =
                    event.clientX;


                DJ.rotation[deck] +=
                    movement * 2;


                jog.style.transform =
                    `rotate(${DJ.rotation[deck]}deg)`;

            }
        );


        jog.addEventListener(
            "pointerup",
            () => {

                dragging =
                    false;

            }
        );

    });


/* =========================================================
   KNOBS
========================================================= */

document
    .querySelectorAll(
        ".knob,.master-knob"
    )
    .forEach(knob => {

        let rotation =
            0;

        let previousY =
            0;


        knob.addEventListener(
            "pointerdown",
            event => {

                previousY =
                    event.clientY;


                knob.setPointerCapture(
                    event.pointerId
                );

            }
        );


        knob.addEventListener(
            "pointermove",
            event => {

                if (
                    !knob.hasPointerCapture(
                        event.pointerId
                    )
                )
                    return;


                const movement =
                    previousY -
                    event.clientY;


                rotation +=
                    movement * 2;


                rotation =
                    Math.max(
                        -135,
                        Math.min(
                            135,
                            rotation
                        )
                    );


                knob.style.transform =
                    `rotate(${rotation}deg)`;


                previousY =
                    event.clientY;

            }
        );

    });


/* =========================================================
   CROSS FADER
========================================================= */

const crossKnob =
    document.querySelector(
        ".cross-knob"
    );


if (crossKnob) {

    let dragging =
        false;


    crossKnob.addEventListener(
        "pointerdown",
        event => {

            dragging =
                true;

            crossKnob.setPointerCapture(
                event.pointerId
            );

        }
    );


    crossKnob.addEventListener(
        "pointermove",
        event => {

            if (!dragging)
                return;


            const track =
                crossKnob.parentElement;


            const rect =
                track.getBoundingClientRect();


            let x =
                event.clientX -
                rect.left;


            x =
                Math.max(
                    0,
                    Math.min(
                        rect.width,
                        x
                    )
                );


            crossKnob.style.left =
                `${x}px`;

        }
    );


    crossKnob.addEventListener(
        "pointerup",
        () => {

            dragging =
                false;

        }
    );

}


/* =========================================================
   FADERS
========================================================= */

document
    .querySelectorAll(
        ".fader-cap,.pitch-knob"
    )
    .forEach(fader => {

        let dragging =
            false;


        fader.addEventListener(
            "pointerdown",
            event => {

                dragging =
                    true;

                fader.setPointerCapture(
                    event.pointerId
                );

            }
        );


        fader.addEventListener(
            "pointermove",
            event => {

                if (!dragging)
                    return;


                const track =
                    fader.parentElement;


                const rect =
                    track.getBoundingClientRect();


                let y =
                    event.clientY -
                    rect.top;


                y =
                    Math.max(
                        0,
                        Math.min(
                            rect.height,
                            y
                        )
                    );


                fader.style.top =
                    `${(y / rect.height) * 100}%`;

            }
        );


        fader.addEventListener(
            "pointerup",
            () => {

                dragging =
                    false;

            }
        );

    });


/* =========================================================
   DJ LOOP
========================================================= */

function djLoop() {

    ["A","B"].forEach(
        deck => {

            const jog =
                document.querySelector(
                    `.jog-wheel[data-deck="${deck}"]`
                );


            if (
                jog &&
                DJ.playing[deck]
            ) {

                DJ.rotation[deck] +=
                    .75;


                jog.style.transform =
                    `rotate(${DJ.rotation[deck]}deg)`;


                DJ.time[deck] +=
                    1 / 60;


                const seconds =
                    Math.floor(
                        DJ.time[deck]
                    );


                const minutes =
                    Math.floor(
                        seconds / 60
                    );


                const remaining =
                    seconds % 60;


                const text =
                    `${String(minutes).padStart(2,"0")}:${String(remaining).padStart(2,"0")}`;


                $(
                    `deck${deck}Time`
                ).textContent =
                    text;

            }

        }
    );


    const progress =
        $("waveProgress");


    if (progress) {

        const active =
            DJ.playing.A
                ? "A"
                : DJ.playing.B
                    ? "B"
                    : null;


        if (active) {

            const value =
                (
                    DJ.time[active] % 60
                ) / 60 * 100;


            progress.style.width =
                `${value}%`;

        }

    }


    document
        .querySelectorAll(
            ".master-meter span"
        )
        .forEach(bar => {

            bar.style.height =
                (
                    DJ.playing.A ||
                    DJ.playing.B
                )
                    ? `${20 + Math.random() * 75}%`
                    : "15%";

        });


    if (
        DJ.playing.A ||
        DJ.playing.B
    ) {

        document
            .querySelectorAll(
                "#waveBars span"
            )
            .forEach(bar => {

                if (
                    Math.random() < .08
                ) {

                    bar.style.height =
                        `${15 + Math.random() * 75}%`;

                }

            });

    }


    requestAnimationFrame(
        djLoop
    );

}


/* =========================================================
   NOW PLAYING
========================================================= */

function setupNowPlaying() {

    const disc =
        document.querySelector(
            ".now-disc"
        );


    if (!disc)
        return;


    /*
       Keep the vinyl spinning.
       Actual Spotify/YouTube playback state cannot
       be read directly from a cross-origin iframe.
    */

    disc.style.animationPlayState =
        "running";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

}


function escapeAttribute(value) {

    return String(
        value ?? ""
    )
        .replace(/\\/g,"\\\\")
        .replace(/'/g,"\\'");

}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupDate();

        populateTimeSlots();

        populateServices();

        populateAdminTimes();

        updateTotal();

        createWaveform();

        setupNowPlaying();


        $("bookingService")
            ?.addEventListener(
                "change",
                updateTotal
            );


        $("adminModal")
            ?.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        $("adminModal")
                    )
                        closeAdminLogin();

                }
            );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                )
                    closeAdminLogin();

            }
        );


        djLoop();

    }
);
