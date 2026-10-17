
const { QdrantClient } = require("@qdrant/js-client-rest");

const qdrant = new QdrantClient({
    url: "http://127.0.0.1:6333",
});

module.exports = qdrant;
