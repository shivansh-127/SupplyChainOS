
const { randomUUID } = require("crypto");
const qdrant = require("../config/qdrant");
const { embedText } = require("./embeddingService");

const COLLECTION_NAME = "supplychain_knowledge";
const MAX_CHUNK_LENGTH = 800;

function chunkDocument(text) {
    if (typeof text !== "string" || !text.trim()) {
        throw new Error("Document text must be a non-empty string.");
    }

    const paragraphs = text
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    const chunks = [];
    let currentChunk = "";

    for (const paragraph of paragraphs) {
        if (paragraph.length > MAX_CHUNK_LENGTH) {
            if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = "";
            }

            for (let i = 0; i < paragraph.length; i += MAX_CHUNK_LENGTH) {
                chunks.push(paragraph.slice(i, i + MAX_CHUNK_LENGTH));
            }

            continue;
        }

        const candidate = currentChunk
            ? `${currentChunk}\n\n${paragraph}`
            : paragraph;

        if (candidate.length > MAX_CHUNK_LENGTH) {
            chunks.push(currentChunk);
            currentChunk = paragraph;
        } else {
            currentChunk = candidate;
        }
    }

    if (currentChunk) {
        chunks.push(currentChunk);
    }

    return chunks;
}

async function ingestDocument({ title, source, text }) {
    if (!title?.trim() || !source?.trim()) {
        throw new Error("Document title and source are required.");
    }

    const chunks = chunkDocument(text);

    const points = [];

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const vector = await embedText(chunk);

        points.push({
            id: randomUUID(),
            vector,
            payload: {
                text: chunk,
                title,
                source,
                chunkIndex: i,
                totalChunks: chunks.length,
                ingestedAt: new Date().toISOString(),
            },
        });
    }

    await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points,
    });

    return {
        title,
        source,
        chunksCreated: chunks.length,
        pointsStored: points.length,
    };
}

module.exports = {
    chunkDocument,
    ingestDocument,
};
