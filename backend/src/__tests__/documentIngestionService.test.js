const { chunkDocument } = require("../services/documentIngestionService");

describe("chunkDocument", () => {
    test("splits paragraphs into chunks within the size limit", () => {
        const text = "A".repeat(500) + "\n\n" + "B".repeat(500);

        const chunks = chunkDocument(text);

        expect(chunks.length).toBe(2);
        expect(chunks[0].length).toBeLessThanOrEqual(800);
        expect(chunks[1].length).toBeLessThanOrEqual(800);
    });

    test("returns one chunk for short text", () => {
        const chunks = chunkDocument("Supplier delivery policy");

        expect(chunks).toHaveLength(1);
        expect(chunks[0]).toBe("Supplier delivery policy");
    });

    test("splits a long paragraph into smaller chunks", () => {
        const text = "A".repeat(1700);

        const chunks = chunkDocument(text);

        expect(chunks).toHaveLength(3);
        expect(chunks.every((chunk) => chunk.length <= 800)).toBe(true);
    });

    test("rejects empty input", () => {
        expect(() => chunkDocument("")).toThrow(
            "Document text must be a non-empty string."
        );
    });
});