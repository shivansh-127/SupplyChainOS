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

    const normalizedTitle = title.trim();
    const normalizedSource = source.trim();
    const chunks = chunkDocument(text);

    if (chunks.length === 0) {
        throw new Error("No chunks were created from the supplied document text.");
    }

    const points = [];

    // Generate all embeddings before changing stored data.
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const vector = await embedText(chunk);

        points.push({
            id: createStablePointId(`${normalizedSource}:${i}`),
            vector,
            payload: {
                text: chunk,
                title: normalizedTitle,
                source: normalizedSource,
                chunkIndex: i,
                totalChunks: chunks.length,
                ingestedAt: new Date().toISOString(),
            },
        });
    }

    // This deletes only points with this exact source. The upload route currently
    // generates a unique source for each upload, so this is not yet a replacement
    // workflow across separate uploads.
   // Check whether this source already exists.
    const existingDocuments = await listIndexedDocuments();

    const existingDocument = existingDocuments.find(
        (document) => document.source === normalizedSource
    );

    // Upsert first. Stable point IDs overwrite matching chunk IDs.
    await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points,
    });

    // Remove obsolete chunks if the replacement is shorter.
    await qdrant.delete(COLLECTION_NAME, {
        wait: true,
        filter: {
            must: [
                {
                    key: "source",
                    match: { value: normalizedSource },
                },
                {
                    key: "chunkIndex",
                    range: { gte: chunks.length },
                },
            ],
        },
    });

    return {
    title: normalizedTitle,
    source: normalizedSource,
    chunksCreated: chunks.length,
    pointsStored: points.length,
    chunksIndexed: points.length,
    replaced: Boolean(existingDocument),
};
}

async function listIndexedDocuments() {
    const documents = new Map();
    let offset = undefined;

    do {
        const result = await qdrant.scroll(COLLECTION_NAME, {
            limit: 100,
            offset,
            with_payload: true,
            with_vector: false,
        });

        for (const point of result.points) {
            const payload = point.payload || {};
            const source = payload.source;

            if (!source) continue;

            if (!documents.has(source)) {
                documents.set(source, {
                    title: payload.title || "Untitled document",
                    source,
                    chunkCount: 0,
                    ingestedAt: payload.ingestedAt || null,
                });
            }

            const document = documents.get(source);
            document.chunkCount += 1;

            if (
                payload.ingestedAt &&
                (!document.ingestedAt ||
                    payload.ingestedAt > document.ingestedAt)
            ) {
                document.ingestedAt = payload.ingestedAt;
            }
        }

        offset = result.next_page_offset;
    } while (offset !== null && offset !== undefined);

    return Array.from(documents.values());
}

async function deleteIndexedDocument(source) {
    if (typeof source !== "string" || !source.trim()) {
        throw new Error("A valid document source is required.");
    }

    const normalizedSource = source.trim();

    // Confirm that this source exists before deleting.
    const documents = await listIndexedDocuments();

    const documentExists = documents.some(
        (document) => document.source === normalizedSource
    );

    if (!documentExists) {
        return {
            deleted: false,
            source: normalizedSource,
            chunksDeleted: 0,
        };
    }

    // Delete only chunks belonging to this exact source.
    const result = await qdrant.delete(COLLECTION_NAME, {
        wait: true,
        filter: {
            must: [
                {
                    key: "source",
                    match: { value: normalizedSource },
                },
            ],
        },
    });

    return {
        deleted: true,
        source: normalizedSource,
        chunksDeleted: documents.find(
            (document) => document.source === normalizedSource
        ).chunkCount,
        result,
    };
}

module.exports = {
    chunkDocument,
    ingestDocument,
    listIndexedDocuments,
    deleteIndexedDocument,
};
