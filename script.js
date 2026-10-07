/*
=========================================================
CRZ FRONTEND
NO FIREBASE
NO RAZORPAY
NO PAYMENT GATEWAY
=========================================================
*/


/*
=========================================================
API
=========================================================
*/

const API_BASE = "https://crz-backend.onrender.com";


/*
=========================================================
TIME SLOTS
=========================================================
*/

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


let services = [];


/*
=========================================================
HELPERS
=========================================================
*/

const $ = id => document.getElementById(id);


function showToast(message) {

    const toast = $("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);
}


function money(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(Number(value) || 0);

}


/*
=========================================================
API REQUEST
=========================================================
*/

async function apiRequest(
    endpoint,
    options = {}
) {

    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );


    let data = {};

    try {

        data = await response.json();

    } catch {

        data = {};

    }


    if (!response.ok) {

        throw new Error(
            data.error ||
            `Request failed (${response.status})`
        );

    }


    return data;

}


/*
=========================================================
NAVIGATION
=========================================================
*/

function scrollToBooking() {

    const section = $("book");

    if (!section) return;

    section.scrollIntoView({
        behavior: "smooth"
    });

}


/*
=========================================================
DATES
=========================================================
*/

function setupDates() {

    const dateInput = $("bookingDate");

    if (!dateInput) return;


    const today = new Date();

    const year = today.getFullYear();

    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");


    const formatted =
        `${year}-${month}-${day}`;


    dateInput.min = formatted;


    if (!dateInput.value) {

        dateInput.value = formatted;

    }


    dateInput.addEventListener(
        "change",
        refreshAvailability
    );

}


/*
=========================================================
SERVICES
=========================================================
*/

async function loadServices() {

    const select =
        $("bookingService");

    const grid =
        $("servicesGrid");


    try {

        const data =
            await apiRequest(
                "/api/services",
                {
                    method: "GET"
                }
            );


        services =
            Array.isArray(data.services)
                ? data.services
                : [];


        if (select) {

            select.innerHTML =
                `<option value="">
                    Select service
                </option>`;


            services.forEach(service => {

                const option =
                    document.createElement("option");

                option.value =
                    service.id;

                option.textContent =
                    `${service.name} — ${money(service.price)}`;

                select.appendChild(option);

            });

        }


        if (grid) {

            if (!services.length) {

                grid.innerHTML =
                    `<div class="loading">
                        No services available.
                    </div>`;

                return;

            }


            grid.innerHTML =
                services.map(service => `

                    <article class="service-card">

                        <div class="service-number">
                            ${String(service.id).padStart(2, "0")}
                        </div>

                        <h3>
                            ${escapeHTML(service.name)}
                        </h3>

                        <strong>
                            ${money(service.price)}
                        </strong>

                        <p>
                            Professional CRZ session.
                        </p>

                        <button
                            class="service-select"
                            data-service="${service.id}"
                        >
                            SELECT →
                        </button>

                    </article>

                `).join("");


            document
                .querySelectorAll(".service-select")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const id =
                                button.dataset.service;

                            select.value = id;

                            updateBookingTotal();

                            scrollToBooking();

                        }
                    );

                });

        }


        updateBookingTotal();

    } catch (error) {

        console.error(
            "Services error:",
            error
        );


        if (grid) {

            grid.innerHTML =
                `<div class="error-box">
                    Unable to load services.
                </div>`;

        }

    }

}


/*
=========================================================
AVAILABILITY
=========================================================
*/

async function refreshAvailability() {

    const dateInput =
        $("bookingDate");

    if (
        !dateInput ||
        !dateInput.value
    ) {

        populateTimeSlots();

        return;

    }


    try {

        /*
        IMPORTANT:
        Backend uses POST /api/availability
        */

        const data =
            await apiRequest(
                "/api/availability",
                {
                    method: "POST",

                    body: JSON.stringify({
                        date: dateInput.value
                    })
                }
            );


        const booked =
            Array.isArray(data.bookedSlots)
                ? data.bookedSlots
                : [];


        const blocked =
            Array.isArray(data.blockedSlots)
                ? data.blockedSlots
                : [];


        populateTimeSlots(
            blocked,
            booked
        );


    } catch (error) {

        console.error(
            "Availability error:",
            error
        );


        /*
        Don't completely break booking
        if availability temporarily fails.
        */

        populateTimeSlots();

        showToast(
            "Could not refresh availability."
        );

    }

}


/*
=========================================================
TIME SLOTS
=========================================================
*/

function populateTimeSlots(
    blocked = [],
    booked = []
) {

    const select =
        $("bookingTime");

    if (!select) return;


    select.innerHTML =
        `<option value="">
            Select time
        </option>`;


    TIME_SLOTS.forEach(slot => {

        const option =
            document.createElement("option");


        option.value = slot;


        const isBlocked =
            blocked.includes(slot) ||
            blocked.some(
                item =>
                    item &&
                    item.time === slot
            );


        const isBooked =
            booked.includes(slot) ||
            booked.some(
                item =>
                    item &&
                    item.time === slot
            );


        if (isBlocked) {

            option.disabled = true;

            option.textContent =
                `${slot} — BLOCKED`;

        } else if (isBooked) {

            option.disabled = true;

            option.textContent =
                `${slot} — BOOKED`;

        } else {

            option.textContent = slot;

        }


        select.appendChild(option);

    });

}


/*
=========================================================
BOOKING TOTAL
=========================================================
*/

function updateBookingTotal() {

    const select =
        $("bookingService");

    const total =
        $("bookingTotal");


    if (!select || !total) return;


    const service =
        services.find(
            item =>
                String(item.id) ===
                String(select.value)
        );


    total.textContent =
        service
            ? money(service.price)
            : "₹0";

}


$("bookingService")?.addEventListener(
    "change",
    updateBookingTotal
);


/*
=========================================================
BOOKING
=========================================================
*/

async function submitBooking(event) {

    event.preventDefault();


    const form =
        $("bookingForm");

    const message =
        $("bookingMessage");


    const name =
        $("bookingName").value.trim();

    const email =
        $("bookingEmail").value.trim();

    const phone =
        $("bookingPhone").value.trim();

    const service =
        $("bookingService").value;

    const date =
        $("bookingDate").value;

    const time =
        $("bookingTime").value;


    if (
        !name ||
        !email ||
        !phone ||
        !service ||
        !date ||
        !time
    ) {

        setBookingMessage(
            "Please complete every field.",
            "error"
        );

        return;

    }


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    button.disabled = true;

    button.innerHTML =
        "RESERVING...";


    setBookingMessage(
        "Creating your reservation...",
        "info"
    );


    try {

        /*
        The backend should expose
        POST /api/bookings.
        */

        const data =
            await apiRequest(
                "/api/bookings",
                {
                    method: "POST",

                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        service,
                        date,
                        time
                    })
                }
            );


        const bookingId =
            data.bookingId ||
            data.id ||
            data.booking?.id;


        if (bookingId) {

            $("statusBookingId").value =
                bookingId;

        }


        setBookingMessage(
            bookingId
                ? `Booking created successfully. Your booking ID is ${bookingId}.`
                : "Booking created successfully.",
            "success"
        );


        showToast(
            "Session reserved successfully."
        );


        form.reset();

        setupDates();

        populateTimeSlots();


        /*
        Refresh availability after booking.
        */

        await refreshAvailability();


    } catch (error) {

        console.error(
            "Booking error:",
            error
        );


        setBookingMessage(
            error.message ||
            "Unable to create booking.",
            "error"
        );

    } finally {

        button.disabled = false;

        button.innerHTML =
            `RESERVE SESSION <b>↗</b>`;

    }

}


/*
=========================================================
BOOKING MESSAGE
=========================================================
*/

function setBookingMessage(
    message,
    type
) {

    const element =
        $("bookingMessage");

    if (!element) return;


    element.textContent =
        message;


    element.className =
        `form-message ${type}`;

}


/*
=========================================================
BOOKING STATUS
=========================================================
*/

async function checkBookingStatus() {

    const id =
        $("statusBookingId")
            ?.value
            .trim();


    const result =
        $("statusResult");


    if (!id) {

        result.textContent =
            "Enter your booking ID.";

        result.className =
            "status-result error";

        return;

    }


    result.textContent =
        "Checking...";


    result.className =
        "status-result info";


    try {

        /*
        Backend endpoint:
        GET /api/bookings/:id
        */

        const data =
            await apiRequest(
                `/api/bookings/${encodeURIComponent(id)}`,
                {
                    method: "GET"
                }
            );


        const booking =
            data.booking ||
            data;


        result.innerHTML = `

            <div class="status-success">

                <strong>
                    ${escapeHTML(
                        booking.status ||
                        "Booking found"
                    )}
                </strong>

                <span>
                    ${escapeHTML(
                        booking.name || ""
                    )}
                </span>

                <span>
                    ${escapeHTML(
                        booking.date || ""
                    )}
                    ${escapeHTML(
                        booking.time || ""
                    )}
                </span>

            </div>

        `;


    } catch (error) {

        result.textContent =
            error.message ||
            "Booking not found.";

        result.className =
            "status-result error";

    }

}


/*
=========================================================
AUDIO PLAYER
=========================================================
*/

let audioContext = null;
let analyser = null;
let sourceNode = null;
let animationFrame = null;


function setupAudio() {

    const audio =
        $("crzAudio");

    const button =
        $("musicButton");


    if (!audio || !button) return;


    /*
    Put your actual audio URL here.
    Leave empty if you don't want music yet.
    */

    const AUDIO_URL = "";


    if (AUDIO_URL) {

        audio.src = AUDIO_URL;

    }


    button.addEventListener(
        "click",
        async () => {

            if (!audio.src) {

                showToast(
                    "Add your CRZ audio file URL in script.js."
                );

                return;

            }


            try {

                if (!audioContext) {

                    audioContext =
                        new (
                            window.AudioContext ||
                            window.webkitAudioContext
                        )();


                    analyser =
                        audioContext.createAnalyser();

                    analyser.fftSize = 256;


                    sourceNode =
                        audioContext.createMediaElementSource(
                            audio
                        );


                    sourceNode.connect(analyser);

                    analyser.connect(
                        audioContext.destination
                    );

                }


                if (
                    audioContext.state ===
                    "suspended"
                ) {

                    await audioContext.resume();

                }


                if (audio.paused) {

                    await audio.play();

                    button.textContent =
                        "PAUSE";

                    $("trackStatus").textContent =
                        "PLAYING";

                    startVisualizer();

                } else {

                    audio.pause();

                    button.textContent =
                        "PLAY";

                    $("trackStatus").textContent =
                        "PAUSED";

                }

            } catch (error) {

                console.error(
                    "Audio error:",
                    error
                );

                showToast(
                    "Unable to play audio."
                );

            }

        }
    );


    audio.addEventListener(
        "ended",
        () => {

            button.textContent =
                "PLAY";

            $("trackStatus").textContent =
                "READY";

        }
    );

}


/*
=========================================================
DJ VISUALIZER
=========================================================
*/

function startVisualizer() {

    const waveform =
        $("waveform");

    const deck =
        $("djDeck");


    if (!waveform || !analyser) return;


    const data =
        new Uint8Array(
            analyser.frequencyBinCount
        );


    function draw() {

        analyser.getByteFrequencyData(data);


        let total = 0;


        for (
            let i = 0;
            i < data.length;
            i++
        ) {

            total += data[i];

        }


        const average =
            total / data.length;


        const intensity =
            average / 255;


        deck.style.setProperty(
            "--music-intensity",
            intensity
        );


        waveform.innerHTML =
            Array.from(
                { length: 40 },
                (_, i) => {

                    const value =
                        data[
                            Math.min(
                                i * 2,
                                data.length - 1
                            )
                        ] || 0;


                    const height =
                        Math.max(
                            8,
                            value / 3
                        );


                    return `
                        <i
                            style="
                                height:${height}px
                            "
                        ></i>
                    `;

                }
            ).join("");


        animationFrame =
            requestAnimationFrame(draw);

    }


    cancelAnimationFrame(
        animationFrame
    );


    draw();

}


/*
=========================================================
ESCAPE HTML
=========================================================
*/

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/*
=========================================================
INIT
=========================================================
*/

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupDates();

        populateTimeSlots();

        await loadServices();

        await refreshAvailability();

        setupAudio();


        $("bookingForm")
            ?.addEventListener(
                "submit",
                submitBooking
            );

    }
);
