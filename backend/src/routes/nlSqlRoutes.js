
const express = require("express");
const { answerWithSql } = require("../services/nlSqlService");

const router = express.Router();

router.post("/ask", async (req, res) => {
    try {
        const { question } = req.body || {};

        if (typeof question !== "string" || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a question.",
            });
        }

        const result = await answerWithSql(question);

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        const clientErrors = [
            "A non-empty question is required.",
            "Question must be 1000 characters or fewer.",
            "Only one SQL statement is allowed.",
            "Only read-only SELECT queries are allowed.",
            "The query contains a prohibited SQL operation.",
            "SQL comments are not allowed.",
            "Generated SQL is empty.",
        ];

        const status = clientErrors.includes(error.message) ? 400 : 500;

        return res.status(status).json({
            success: false,
            message: error.message || "NL-to-SQL request failed.",
        });
    }
});

module.exports = router;
