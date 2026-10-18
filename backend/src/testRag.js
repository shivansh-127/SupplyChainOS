
require("dotenv").config();

const { answerQuestion } = require("./services/ragService");

async function testRag() {
    try {
        const question =
            "What should we do when our chip supplier delays delivery?";

        const result = await answerQuestion(question);

        console.log("\nQUESTION:");
        console.log(question);

        console.log("\nANSWER:");
        console.log(result.answer);

        console.log("\nSOURCES:");
        console.log(JSON.stringify(result.sources, null, 2));
    } catch (error) {
        console.error("RAG test failed:", error.message);
    }
}

testRag();
