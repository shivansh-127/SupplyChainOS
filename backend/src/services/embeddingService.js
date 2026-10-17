
async function embedText(text) {
    if (typeof text !== "string" || !text.trim()) {
        throw new Error("Text must be a non-empty string.");
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing from the environment.");
    }

    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.embedContent({
        model: "gemini-embedding-2",
        contents: text,
        config: {
            outputDimensionality: 768,
        },
    });

    const vector = response.embeddings?.[0]?.values;

    if (!Array.isArray(vector) || vector.length !== 768) {
        throw new Error("Gemini returned an invalid embedding vector.");
    }

    return vector;
}

module.exports = { embedText };
