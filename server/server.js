import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

/* =====================================================
   MIDDLEWARE
===================================================== */

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

/* =====================================================
   DATA STORAGE
===================================================== */

const DATA_DIR = path.join(__dirname, "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const BLOCKED_FILE = path.join(DATA_DIR, "blocked.json");

function ensureFile(file, fallback = []) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      JSON.stringify(fallback, null, 2),
      "utf8"
    );
  }
}

ensureFile(BOOKINGS_FILE, []);
ensureFile(BLOCKED_FILE, []);

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(
    file,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

/* =====================================================
   HELPERS
===================================================== */

function generateId(prefix = "crz") {
  return `${prefix}_${Date.now()}_${crypto
    .randomBytes(4)
    .toString("hex")}`;
}

function slotId(date, time) {
  return `${date}_${time}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "_"
  );
}

function adminToken(req) {
  const auth = req.headers.authorization || "";

  if (!auth.startsWith("Bearer ")) {
    return null;
  }

  return auth.slice(7);
}

function checkAdmin(req, res, next) {
  const token = adminToken(req);

  if (
    !token ||
    token !== process.env.ADMIN_TOKEN
  ) {
    return res.status(401).json({
      error: "Unauthorized.",
    });
  }

  next();
}

/* =====================================================
   SERVICES
===================================================== */

const SERVICES = {
  "250": {
    id: 250,
    name: "Practice",
    price: 250,
  },

  "400": {
    id: 400,
    name: "Practice + Audio",
    price: 400,
  },

  "500": {
    id: 500,
    name: "Practice + Audio + Video",
    price: 500,
  },

  "1500": {
    id: 1500,
    name: "Edited Recording",
    price: 1500,
  },
};

app.get("/api/services", (req, res) => {
  res.json({
    services: Object.values(SERVICES),
  });
});

/* =====================================================
   AVAILABILITY
===================================================== */

function getAvailability(date) {
  const bookings = readJSON(BOOKINGS_FILE);
  const blocked = readJSON(BLOCKED_FILE);

  const bookedSlots = bookings
    .filter(
      (booking) =>
        booking.date === date &&
        booking.status !== "cancelled"
    )
    .map((booking) => ({
      time: booking.time,
      bookingId: booking.id,
    }));

  const blockedSlots = blocked
    .filter((slot) => slot.date === date)
    .map((slot) => ({
      time: slot.time,
      id: slot.id,
      reason: slot.reason,
    }));

  return {
    date,
    bookedSlots,
    blockedSlots,

    // Compatibility with older frontend code
    bookings: bookedSlots,
    blocked: blockedSlots,
  };
}

/*
   Supports BOTH:

   GET  /api/availability?date=2026-10-08
   POST /api/availability
*/

app.get("/api/availability", (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        error: "Date is required.",
      });
    }

    res.json(getAvailability(date));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to load availability.",
    });
  }
});

app.post("/api/availability", (req, res) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        error: "Date is required.",
      });
    }

    res.json(getAvailability(date));
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Unable to load availability.",
    });
  }
});

/* =====================================================
   CREATE BOOKING
===================================================== */

app.post("/api/bookings", (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      date,
      time,
      service,
      serviceId,
      serviceName,
      notes,
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !date ||
      !time
    ) {
      return res.status(400).json({
        error:
          "Name, email, phone, date and time are required.",
      });
    }

    const selectedService =
      serviceId ||
      service ||
      "250";

    const serviceInfo =
      SERVICES[String(selectedService)];

    if (!serviceInfo) {
      return res.status(400).json({
        error: "Invalid service.",
      });
    }

    const bookings = readJSON(BOOKINGS_FILE);
    const blocked = readJSON(BLOCKED_FILE);

    const alreadyBooked = bookings.some(
      (booking) =>
        booking.date === date &&
        booking.time === time &&
        booking.status !== "cancelled"
    );

    if (alreadyBooked) {
      return res.status(409).json({
        error:
          "That time slot is already booked.",
      });
    }

    const isBlocked = blocked.some(
      (slot) =>
        slot.date === date &&
        slot.time === time
    );

    if (isBlocked) {
      return res.status(409).json({
        error:
          "That time slot is blocked.",
      });
    }

    const booking = {
      id: generateId("booking"),

      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),

      date,
      time,

      service: serviceInfo.id,

      serviceName:
        serviceName || serviceInfo.name,

      total: serviceInfo.price,

      notes:
        notes
          ? String(notes).trim()
          : "",

      status: "confirmed",

      createdAt:
        new Date().toISOString(),
    };

    bookings.push(booking);

    writeJSON(
      BOOKINGS_FILE,
      bookings
    );

    return res.status(201).json({
      success: true,
      booking,
      bookingId: booking.id,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Unable to create booking.",
    });
  }
});

/* =====================================================
   GET BOOKING
===================================================== */

app.get("/api/bookings/:id", (req, res) => {
  try {
    const bookings = readJSON(BOOKINGS_FILE);

    const booking = bookings.find(
      (item) => item.id === req.params.id
    );

    if (!booking) {
      return res.status(404).json({
        error: "Booking not found.",
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error:
        "Unable to find booking.",
    });
  }
});

/* =====================================================
   CANCEL BOOKING
===================================================== */

app.post(
  "/api/bookings/:id/cancel",
  (req, res) => {
    try {
      const bookings = readJSON(
        BOOKINGS_FILE
      );

      const index = bookings.findIndex(
        (booking) =>
          booking.id === req.params.id
      );

      if (index === -1) {
        return res.status(404).json({
          error:
            "Booking not found.",
        });
      }

      bookings[index].status =
        "cancelled";

      bookings[index].cancelledAt =
        new Date().toISOString();

      writeJSON(
        BOOKINGS_FILE,
        bookings
      );

      res.json({
        success: true,
        booking: bookings[index],
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Unable to cancel booking.",
      });
    }
  }
);

/* =====================================================
   ADMIN LOGIN
===================================================== */

app.post(
  "/api/admin/login",
  (req, res) => {
    const {
      email,
      password,
    } = req.body;

    if (
      email !==
        process.env.ADMIN_EMAIL ||
      password !==
        process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        error:
          "Invalid email or password.",
      });
    }

    res.json({
      success: true,
      token:
        process.env.ADMIN_TOKEN,
    });
  }
);

/* =====================================================
   ADMIN DASHBOARD
===================================================== */

app.get(
  "/api/admin/dashboard",
  checkAdmin,
  (req, res) => {
    try {
      const bookings =
        readJSON(BOOKINGS_FILE);

      const blockedSlots =
        readJSON(BLOCKED_FILE);

      const today =
        new Date()
          .toISOString()
          .slice(0, 10);

      const confirmed =
        bookings.filter(
          (booking) =>
            booking.status ===
            "confirmed"
        );

      const todayCount =
        confirmed.filter(
          (booking) =>
            booking.date === today
        ).length;

      const futureCount =
        confirmed.filter(
          (booking) =>
            booking.date > today
        ).length;

      const completedCount =
        confirmed.filter(
          (booking) =>
            booking.date < today
        ).length;

      const revenue =
        confirmed.reduce(
          (sum, booking) =>
            sum +
            Number(
              booking.total || 0
            ),
          0
        );

      res.json({
        bookings:
          [...bookings].reverse(),

        blockedSlots,

        stats: {
          today: todayCount,
          future: futureCount,
          completed:
            completedCount,
          revenue,
        },
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Dashboard failed.",
      });
    }
  }
);

/* =====================================================
   ADMIN UPDATE BOOKING STATUS
===================================================== */

app.patch(
  "/api/admin/bookings/:id",
  checkAdmin,
  (req, res) => {
    try {
      const {
        status,
      } = req.body;

      const allowedStatuses = [
        "confirmed",
        "cancelled",
        "completed",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          error:
            "Invalid booking status.",
        });
      }

      const bookings =
        readJSON(BOOKINGS_FILE);

      const index =
        bookings.findIndex(
          (booking) =>
            booking.id ===
            req.params.id
        );

      if (index === -1) {
        return res.status(404).json({
          error:
            "Booking not found.",
        });
      }

      bookings[index].status =
        status;

      bookings[index].updatedAt =
        new Date().toISOString();

      writeJSON(
        BOOKINGS_FILE,
        bookings
      );

      res.json({
        success: true,
        booking:
          bookings[index],
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Unable to update booking.",
      });
    }
  }
);

/* =====================================================
   BLOCK SLOT
===================================================== */

app.post(
  "/api/admin/block-slot",
  checkAdmin,
  (req, res) => {
    try {
      const {
        date,
        time,
        reason,
      } = req.body;

      if (!date || !time) {
        return res.status(400).json({
          error:
            "Date and time required.",
        });
      }

      const bookings =
        readJSON(BOOKINGS_FILE);

      const blocked =
        readJSON(BLOCKED_FILE);

      const alreadyBooked =
        bookings.some(
          (booking) =>
            booking.date === date &&
            booking.time === time &&
            booking.status !==
              "cancelled"
        );

      if (alreadyBooked) {
        return res.status(409).json({
          error:
            "This slot already has a booking.",
        });
      }

      const alreadyBlocked =
        blocked.some(
          (slot) =>
            slot.date === date &&
            slot.time === time
        );

      if (alreadyBlocked) {
        return res.status(409).json({
          error:
            "This slot is already blocked.",
        });
      }

      const slot = {
        id: slotId(date, time),

        date,
        time,

        reason:
          reason ||
          "Blocked by admin",

        createdAt:
          new Date().toISOString(),
      };

      blocked.push(slot);

      writeJSON(
        BLOCKED_FILE,
        blocked
      );

      res.json({
        success: true,
        slot,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Unable to block slot.",
      });
    }
  }
);

/* =====================================================
   UNBLOCK SLOT
===================================================== */

app.post(
  "/api/admin/unblock-slot",
  checkAdmin,
  (req, res) => {
    try {
      const { id } =
        req.body;

      if (!id) {
        return res.status(400).json({
          error:
            "Slot ID required.",
        });
      }

      const blocked =
        readJSON(BLOCKED_FILE);

      const filtered =
        blocked.filter(
          (slot) =>
            slot.id !== id
        );

      if (
        filtered.length ===
        blocked.length
      ) {
        return res.status(404).json({
          error:
            "Blocked slot not found.",
        });
      }

      writeJSON(
        BLOCKED_FILE,
        filtered
      );

      res.json({
        success: true,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Unable to unblock slot.",
      });
    }
  }
);

/* =====================================================
   TEST ADMIN AUTH
===================================================== */

app.get(
  "/api/admin/check",
  checkAdmin,
  (req, res) => {
    res.json({
      success: true,
      message:
        "Admin authentication working.",
    });
  }
);

/* =====================================================
   HEALTH
===================================================== */

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message:
      "CRZ backend is working 🚀",
    paymentSystem: false,
    firebase: false,
  });
});

/* =====================================================
   404
===================================================== */

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found.",
  });
});

/* =====================================================
   START
===================================================== */

app.listen(PORT, () => {
  console.log(
    `CRZ backend running on http://localhost:${PORT}`
  );
});
