/* ==============================
   CRZ BOOKING SYSTEM — DEMO
   ============================== */

let selectedPackage = "Practice";
let selectedPrice = 349;


/* ==============================
   PACKAGE SELECTION
   ============================== */

function selectPackage(name, price) {

    selectedPackage = name;
    selectedPrice = price;

    document.getElementById("packageSelect").value =
        `${name}|${price}`;

    updatePrice();

    document.getElementById("book").scrollIntoView({
        behavior: "smooth"
    });
}


/* ==============================
   UPDATE PRICE
   ============================== */

function updatePrice() {

    const value =
        document.getElementById("packageSelect").value;

    const parts = value.split("|");

    selectedPackage = parts[0];
    selectedPrice = Number(parts[1]);

    document.getElementById("totalPrice").textContent =
        `₹${selectedPrice.toLocaleString("en-IN")}`;
}


/* ==============================
   CONFIRM BOOKING
   ============================== */

function confirmBooking() {

    const date =
        document.getElementById("bookingDate").value;

    const time =
        document.getElementById("bookingTime").value;

    if (!date) {

        alert("Please select a date.");

        return;
    }

    const formattedDate =
        new Date(date + "T00:00:00")
            .toLocaleDateString(
                "en-IN",
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );

    document.getElementById("bookingSummary").innerHTML = `

        <strong style="color:white;">
            ${selectedPackage}
        </strong>

        <br>

        📅 ${formattedDate}

        <br>

        ⏰ ${time}

        <br>

        💰 ₹${selectedPrice.toLocaleString("en-IN")}

    `;

    document
        .getElementById("paymentModal")
        .classList
        .add("active");
}


/* ==============================
   DEMO PAYMENT
   ============================== */

function fakePayment() {

    const bookingID =
        "CRZ-" +
        Math.floor(
            1000 + Math.random() * 9000
        );

    document.getElementById("bookingSummary").innerHTML = `

        <div style="
            text-align:center;
            padding:20px 0;
        ">

            <div style="
                font-size:55px;
                margin-bottom:20px;
            ">
                ✓
            </div>

            <strong style="
                color:white;
                font-size:20px;
            ">
                BOOKING CONFIRMED
            </strong>

            <br><br>

            Booking ID:
            <strong style="color:#00e5ff;">
                ${bookingID}
            </strong>

            <br><br>

            ${selectedPackage}
            <br>

            ₹${selectedPrice.toLocaleString("en-IN")}

            <br><br>

            <span style="
                color:#666;
                font-size:11px;
            ">
                DEMO PAYMENT ONLY
            </span>

        </div>
    `;

    document.querySelector(
        ".modal-content .confirm-btn"
    ).style.display = "none";
}


/* ==============================
   CLOSE MODAL
   ============================== */

function closeModal() {

    document
        .getElementById("paymentModal")
        .classList
        .remove("active");

    document.querySelector(
        ".modal-content .confirm-btn"
    ).style.display = "block";
}


/* ==============================
   SET MINIMUM DATE
   ============================== */

const dateInput =
    document.getElementById("bookingDate");

if (dateInput) {

    const today =
        new Date().toISOString().split("T")[0];

    dateInput.min = today;
}


/* ==============================
   CLOSE MODAL ON BACKDROP
   ============================== */

document
    .getElementById("paymentModal")
    .addEventListener(
        "click",
        function(event) {

            if (event.target === this) {
                closeModal();
            }

        }
    );
