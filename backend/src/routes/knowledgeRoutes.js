
const express = require("express");
const router = express.Router();

const { answerQuestion } = require("../services/ragService");
const {
    answerDisruptionQuestion,
} = require("../services/hybridService");

router.post("/ask", async (req, res) => {
    try {
        const { question } = req.body;

        if (typeof question !== "string" || !question.trim()) {
            return res.status(400).json({
                success: false,
                error: "A non-empty question is required.",
            });
        }

        const result = await answerQuestion(question.trim());

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Knowledge query failed:", error.message);

        return res.status(500).json({
            success: false,
            error: "Unable to answer the question right now.",
        });
    }
});

// Hybrid endpoint: PostgreSQL operational facts + Qdrant policy evidence.
router.post("/ask-disruption", async (req, res) => {
    try {
        const { question, disruptionId } = req.body;

        if (typeof question !== "string" || !question.trim()) {
            return res.status(400).json({
                success: false,
                error: "A non-empty question is required.",
            });
        }

        const id = Number(disruptionId);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                error: "A valid disruptionId is required.",
            });
        }

        const result = await answerDisruptionQuestion(
            id,
            question.trim()
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("Hybrid knowledge query failed:", error.message);

        if (error.message === "Disruption not found") {
            return res.status(404).json({
                success: false,
                error: "The requested disruption was not found.",
            });
        }

        return res.status(500).json({
            success: false,
            error: "Unable to answer the hybrid question right now.",
        });
    }
});

module.exports = router;
