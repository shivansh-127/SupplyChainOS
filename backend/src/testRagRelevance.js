
require("dotenv").config();

const { answerQuestion } = require("./services/ragService");

async function testRagRelevance() {
    const questions = [
        "What should we do when our chip supplier delays delivery?",
        "What is the company's annual leave policy?",
    ];

    for (const question of questions) {
        try {
            const result = await answerQuestion(question);

            console.log("\nQUESTION:", question);
            console.log("\nANSWER:", result.answer);
            console.log("\nSOURCES:", result.sources.length);

            if (result.relevanceReason) {
                console.log("Relevance reason:", result.relevanceReason);
            }

            for (const source of result.sources) {
                console.log("Source:", source.title, "-", source.source);
            }
        } catch (error) {
            console.error("\nTest failed:", error.message);
        }
    }
}

testRagRelevance();
