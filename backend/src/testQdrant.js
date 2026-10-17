
const qdrant = require("./config/qdrant");

async function testConnection() {
    try {
        const response = await qdrant.getCollections();

        console.log("Qdrant connected successfully!");
        console.log("Collections:", response.collections);
    } catch (error) {
        console.error("Qdrant connection failed:", error.message);
    }
}

testConnection();
