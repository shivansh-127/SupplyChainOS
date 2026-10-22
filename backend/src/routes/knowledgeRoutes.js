
const express = require("express");
const router = express.Router();

const { answerQuestion } = require("../services/ragService");
const { answerDisruptionQuestion } = require("../services/hybridService");
const {
    listIndexedDocuments,
    deleteIndexedDocument,
} = require("../services/documentIngestionService");

// List documents currently indexed in Qdrant.
router.get("/documents", async (req, res) => {
    try {
        const documents = await listIndexedDocuments();

        return res.status(200).json({
            success: true,
            data: documents,
            count: documents.length,
        });
    } catch (error) {
        console.error("Document listing failed:", error);

        return res.status(500).json({
            success: false,
            error: "Unable to list indexed documents.",
        });
    }
});

router.delete("/documents", async (req, res) => {
    try {
        const { source } = req.body;

        if (typeof source !== "string" || !source.trim()) {
            return res.status(400).json({
                success: false,
                error: "A valid document source is required.",
            });
        }

        const result = await deleteIndexedDocument(source);

        if (!result.deleted) {
            return res.status(404).json({
                success: false,
                error: "Document not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
            message: `Document deleted. ${result.chunksDeleted} chunk(s) removed.`,
        });
    } catch (error) {
        console.error("Document deletion failed:", error);

        return res.status(500).json({
            success: false,
            error: "Unable to delete the document.",
        });
    }
});


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
