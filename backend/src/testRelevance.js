
require("dotenv").config();

const {
    retrieveRelevantChunks,
} = require("./services/retrievalService");

async function testRelevance() {
    const questions = [
        "What should we do when our chip supplier delays delivery?",
        "What is the company's annual leave policy?",
    ];

    for (const question of questions) {
        try {
            const results = await retrieveRelevantChunks(question);

            console.log("\nQuestion:", question);
            console.log("Relevant chunks found:", results.length);

            for (const result of results) {
                console.log("Title:", result.title);
                console.log("Score:", result.score);
                console.log("Text:", result.text);
            }

            if (results.length === 0) {
                console.log("No sufficiently relevant evidence found.");
            }
        } catch (error) {
            console.error("Retrieval failed:", error.message);
        }
    }
}

testRelevance();
