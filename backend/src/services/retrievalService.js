
const qdrant = require("../config/qdrant");
const { embedText } = require("./embeddingService");

const COLLECTION_NAME = "supplychain_knowledge";
const MIN_SIMILARITY_SCORE = 0.55;

async function retrieveRelevantChunks(question, limit = 3) {
    if (typeof question !== "string" || !question.trim()) {
        throw new Error("Question must be a non-empty string.");
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
        throw new Error("Limit must be an integer between 1 and 10.");
    }

    const queryVector = await embedText(question);

    const response = await qdrant.query(COLLECTION_NAME, {
        query: queryVector,
        limit,
        with_payload: true,
    });

    return response.points
        .filter((point) => point.score >= MIN_SIMILARITY_SCORE)
        .filter((point) => point.payload?.text)
        .map((point) => ({
            id: point.id,
            score: point.score,
            text: point.payload.text,
            title: point.payload.title,
            source: point.payload.source,
            chunkIndex: point.payload.chunkIndex,
        }));
}

module.exports = { retrieveRelevantChunks };
