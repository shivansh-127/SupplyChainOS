
require("dotenv").config();

const {
    retrieveRelevantChunks,
} = require("./services/retrievalService");

async function testRetrieval() {
    try {
        const question =
            "What should we do when our chip supplier delays delivery?";

        const results = await retrieveRelevantChunks(question, 3);

        console.log("Question:", question);
        console.log("Retrieved chunks:", results.length);

        for (const result of results) {
            console.log("\n--- Retrieved Document ---");
            console.log("Title:", result.title);
            console.log("Source:", result.source);
            console.log("Similarity score:", result.score);
            console.log("Text:", result.text);
        }
    } catch (error) {
        console.error("Retrieval failed:", error.message);
    }
}

testRetrieval();
