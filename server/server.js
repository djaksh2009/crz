import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

async function sendEmail(to, subject, html) {
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: "onboarding@resend.dev",
            to: [to],
            subject: subject,
            html: html
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || JSON.stringify(data));
    }

    return data;
}

app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "CRZ backend is working 🚀"
    });
});

app.post("/api/test-email", async (req, res) => {

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            error: "Email is required"
        });
    }

    try {

        const result = await sendEmail(
            email,
            "CRZ — Test Notification",
            `
            <div style="
                background:#050505;
                color:white;
                padding:40px;
                font-family:Arial,sans-serif;
            ">

                <h1 style="font-size:42px;">
                    CRZ<span style="color:#00e5ff;">.</span>
                </h1>

                <h2>TEST NOTIFICATION</h2>

                <p>
                    Your CRZ notification system is working.
                </p>

                <p style="color:#888;">
                    This is a test email from the CRZ backend.
                </p>

            </div>
            `
        );

        res.json({
            success: true,
            message: "Email sent successfully",
            result
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`CRZ backend running on port ${PORT}`);
});
