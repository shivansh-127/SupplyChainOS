
const { createHash } = require("crypto");
const qdrant = require("../config/qdrant");
const { embedText } = require("./embeddingService");

const COLLECTION_NAME = "supplychain_knowledge";
const MAX_CHUNK_LENGTH = 800;

function createStablePointId(value) {
    const hash = createHash("sha256").update(value).digest();

    // Set UUID version and variant bits.
    hash[6] = (hash[6] & 0x0f) | 0x50;
    hash[8] = (hash[8] & 0x3f) | 0x80;

    const hex = hash.subarray(0, 16).toString("hex");

    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32),
    ].join("-");
}

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
            if (currentChunk) {
                chunks.push(currentChunk);
            }

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
    if (
        typeof title !== "string" ||
        !title.trim() ||
        typeof source !== "string" ||
        !source.trim()
    ) {
        throw new Error("Document title and source are required.");
    }

    const chunks = chunkDocument(text);
    const points = [];

    // Generate every embedding before changing the stored document.
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const vector = await embedText(chunk);

        points.push({
            id: createStablePointId(`${source}:${i}`),
            vector,
            payload: {
                text: chunk,
                title: title.trim(),
                source: source.trim(),
                chunkIndex: i,
                totalChunks: chunks.length,
                ingestedAt: new Date().toISOString(),
            },
        });
    }

    // Remove the previous version of this source, including obsolete chunks.
    await qdrant.delete(COLLECTION_NAME, {
        wait: true,
        filter: {
            must: [
                {
                    key: "source",
                    match: { value: source.trim() },
                },
            ],
        },
    });

    // Store the newly prepared version.
    await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points,
    });

    return {
        title: title.trim(),
        source: source.trim(),
        chunksCreated: chunks.length,
        pointsStored: points.length,
    };
}

module.exports = {
    chunkDocument,
    ingestDocument,
};
