const express = require("express");
const multer = require("multer");
const path = require("path");
const pdfParse = require("pdf-parse");
const { ingestDocument } = require("../services/documentIngestionService");
const { createHash } = require("crypto");

const router = express.Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedExtensions = new Set([".pdf", ".txt"]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
    },
    fileFilter: (_req, file, callback) => {
        const extension = path.extname(file.originalname || "").toLowerCase();
        if (!allowedExtensions.has(extension)) {
            return callback(new Error("Only PDF and TXT documents are supported."));
        }
        callback(null, true);
    },
});

function cleanTitle(value) {
    if (typeof value !== "string") return "";
    return value
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160);
}

function safeOriginalName(value) {
    return path.basename(String(value || "document"))
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 120) || "document";
}

function createStableSource(originalName) {
    const normalizedName = path
        .basename(String(originalName || "document"))
        .trim()
        .toLowerCase();

    const hash = createHash("sha256")
        .update(normalizedName)
        .digest("hex")
        .slice(0, 16);

    return `uploads/${hash}-${safeOriginalName(originalName)}`;
}

async function extractText(file) {
    const extension = path.extname(file.originalname || "").toLowerCase();

    if (extension === ".pdf") {
        // Verify the PDF signature rather than trusting the browser-provided MIME type.
        if (file.buffer.length < 5 || file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
            const error = new Error("The uploaded file does not appear to be a valid PDF.");
            error.statusCode = 400;
            throw error;
        }

        const parsed = await pdfParse(file.buffer);
        return String(parsed.text || "").replace(/\u0000/g, "").trim();
    }

    // TXT is interpreted as UTF-8. Reject empty/binary-looking content.
    const text = file.buffer.toString("utf8").replace(/\u0000/g, "").trim();
    if (!text) {
        const error = new Error("The text file is empty or could not be decoded.");
        error.statusCode = 400;
        throw error;
    }
    return text;
}

router.post("/upload", (req, res) => {
    upload.single("document")(req, res, async (uploadError) => {
        if (uploadError) {
            const status = uploadError instanceof multer.MulterError
                ? (uploadError.code === "LIMIT_FILE_SIZE" ? 413 : 400)
                : 400;
            return res.status(status).json({
                success: false,
                error: uploadError.message || "Document upload failed.",
            });
        }

        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'Attach one file using the "document" field.',
                });
            }

            const text = await extractText(req.file);
            if (text.length < 20) {
                return res.status(400).json({
                    success: false,
                    error: "No usable text was extracted. Scanned PDFs need OCR and are not supported yet.",
                });
            }

            const title = cleanTitle(req.body?.title) ||
                path.basename(req.file.originalname, path.extname(req.file.originalname)).slice(0, 160) ||
                "Untitled document";

            // Every upload gets a unique source for now. Replacement/version management
            // will need a separate stable document ID and explicit update workflow.
            const source = createStableSource(req.file.originalname);

            const ingestion = await ingestDocument({ title, source, text });

            // The ingestion service returns chunksCreated and pointsStored.
            // Use those real fields so the UI doesn't incorrectly show zero.
            const chunksIndexed = Number.isFinite(ingestion?.pointsStored)
                ? ingestion.pointsStored
                : Number.isFinite(ingestion?.chunksCreated)
                    ? ingestion.chunksCreated
                    : null;

            if (chunksIndexed === null) {
                throw new Error("Ingestion completed without returning a valid chunk count.");
            }

            return res.status(201).json({
                success: true,
                data: {
                    title,
                    source,
                    charactersExtracted: text.length,
                    chunksCreated: ingestion.chunksCreated,
                    chunksIndexed,
                    pointsStored: ingestion.pointsStored,
                    replaced: ingestion.replaced,
                    message: ingestion.replaced
                        ? `Document replaced successfully: ${ingestion.chunksIndexed} chunk(s) indexed.`
                        : `Document indexed successfully: ${ingestion.chunksIndexed} chunk(s) indexed.`,
                },
            });
        } catch (error) {
            console.error("Knowledge document upload failed:", error);
            const status = error.statusCode || 500;
            return res.status(status).json({
                success: false,
                error: status === 500
                    ? "Unable to extract or index this document. Check backend logs for details."
                    : error.message,
            });
        }
    });
});

module.exports = router;
