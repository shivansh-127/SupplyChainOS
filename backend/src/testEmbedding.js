
require("dotenv").config();

const { embedText } = require("./services/embeddingService");

async function testEmbedding() {
    try {
        const text = "Our semiconductor supplier is experiencing delays.";

        const vector = await embedText(text);

        console.log("Embedding generated successfully.");
        console.log("Vector dimensions:", vector.length);
        console.log("First five values:", vector.slice(0, 5));
    } catch (error) {
        console.error("Embedding test failed:", error.message);
    }
}

testEmbedding();
