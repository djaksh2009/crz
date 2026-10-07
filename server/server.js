import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "CRZ backend is working 🚀"
    });
});

app.listen(PORT, () => {
    console.log(`CRZ backend running on port ${PORT}`);
});
