
const qdrant = require("./config/qdrant");

const COLLECTION_NAME = "supplychain_knowledge";

async function createKnowledgeCollection() {
    try {
        const collectionsResponse = await qdrant.getCollections();

        const collectionExists = collectionsResponse.collections.some(
            (collection) => collection.name === COLLECTION_NAME
        );

        if (collectionExists) {
            console.log(`Collection "${COLLECTION_NAME}" already exists.`);
            return;
        }

        await qdrant.createCollection(COLLECTION_NAME, {
            vectors: {
                size: 768,
                distance: "Cosine",
            },
        });

        console.log(`Collection "${COLLECTION_NAME}" created successfully.`);
    } catch (error) {
        console.error("Collection setup failed:", error.message);
    }
}

createKnowledgeCollection();
