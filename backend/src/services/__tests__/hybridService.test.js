jest.mock("@google/genai", () => ({
    GoogleGenAI: jest.fn(),
}));

jest.mock("../disruptionImpactService", () => ({
    analyzeDisruption: jest.fn(),
}));

jest.mock("../retrievalService", () => ({
    retrieveRelevantChunks: jest.fn(),
}));

const { GoogleGenAI } = require("@google/genai");
const { analyzeDisruption } = require("../disruptionImpactService");
const { retrieveRelevantChunks } = require("../retrievalService");
const {
    answerDisruptionQuestion,
} = require("../hybridService");

describe("answerDisruptionQuestion", () => {
    let generateContent;

    beforeEach(() => {
        jest.clearAllMocks();

        process.env.GEMINI_API_KEY = "test-api-key";

        generateContent = jest.fn();

        GoogleGenAI.mockImplementation(() => ({
            models: {
                generateContent,
            },
        }));

        analyzeDisruption.mockResolvedValue({
            disruption: { id: 1, severity: 8.7 },
            inventory: { total: 4000 },
            supplyGapDays: 8.75,
            summary: { totalShortage: 2000 },
            affectedProducts: [],
            affectedFactories: [],
            incomingShipments: [],
            alternativeSuppliers: [],
            orders: [],
        });

        retrieveRelevantChunks.mockResolvedValue([]);
    });

    test("rejects an invalid disruption ID", async () => {
    await expect(
        answerDisruptionQuestion(0, "Why are orders at risk?")
    ).rejects.toThrow("A valid disruption ID is required.");

    expect(analyzeDisruption).not.toHaveBeenCalled();
    expect(retrieveRelevantChunks).not.toHaveBeenCalled();
});

test("answers with operational data when no policy documents are retrieved", async () => {
    generateContent.mockResolvedValue({
        text: "Orders are at risk based on [Operational Data]. No relevant policy evidence was found."
    });

    const result = await answerDisruptionQuestion(
        1,
        "Why are orders at risk?"
    );

    expect(analyzeDisruption).toHaveBeenCalledWith(1);

    expect(retrieveRelevantChunks).toHaveBeenCalledWith(
        "Why are orders at risk?",
        3
    );

    expect(generateContent).toHaveBeenCalledTimes(1);

    expect(result.evidenceStatus.operationalDataAvailable).toBe(true);
    expect(result.evidenceStatus.policyEvidenceFound).toBe(false);
    expect(result.evidenceStatus.policyEvidenceRelevant).toBe(false);

    expect(result.documentSources).toEqual([]);
});


test("rejects irrelevant policy documents", async () => {
    retrieveRelevantChunks.mockResolvedValue([
        {
            title: "Employee Leave Policy",
            source: "demo/employee-leave.txt",
            chunkIndex: 0,
            score: 0.72,
            text: "Employees receive annual leave according to HR policy."
        }
    ]);

    generateContent
        .mockResolvedValueOnce({
            text: JSON.stringify({
                relevant: false,
                reason: "The document concerns employee leave, not supply-chain disruptions."
            })
        })
        .mockResolvedValueOnce({
            text: "No relevant policy evidence was found for this supply-chain question."
        });

    const result = await answerDisruptionQuestion(
        1,
        "Why are orders at risk?"
    );

    expect(generateContent).toHaveBeenCalledTimes(2);

    expect(result.evidenceStatus.policyEvidenceFound).toBe(true);
    expect(result.evidenceStatus.policyEvidenceRelevant).toBe(false);

    expect(result.documentSources).toEqual([]);
});

test("includes relevant policy evidence and its source", async () => {
    retrieveRelevantChunks.mockResolvedValue([
        {
            title: "Demo Supplier Delay Policy",
            source: "demo/supplier-delay-policy.txt",
            chunkIndex: 0,
            score: 0.86,
            text: "Notify the operations manager within 4 business hours when a critical supplier delay exceeds 5 calendar days."
        }
    ]);

    // First Gemini call: evaluate relevance.
    generateContent.mockResolvedValueOnce({
        text: JSON.stringify({
            relevant: true,
            reason: "The policy directly addresses critical supplier delays."
        })
    });

    // Second Gemini call: generate the final answer.
    generateContent.mockResolvedValueOnce({
        text: "Notify the operations manager within 4 business hours. [Document 1]"
    });

    const result = await answerDisruptionQuestion(
        1,
        "What should we do about a critical supplier delay?"
    );

    // Both AI stages should run.
    expect(generateContent).toHaveBeenCalledTimes(2);

    // Relevant evidence should be accepted.
    expect(result.evidenceStatus.policyEvidenceFound).toBe(true);
    expect(result.evidenceStatus.policyEvidenceRelevant).toBe(true);

    // Its source metadata should be returned.
    expect(result.documentSources).toHaveLength(1);
    expect(result.documentSources[0].title)
        .toBe("Demo Supplier Delay Policy");
    expect(result.documentSources[0].source)
        .toBe("demo/supplier-delay-policy.txt");
    expect(result.documentSources[0].citation)
        .toBe("[Document 1]");

    // The final answer should be present.
    expect(result.answer).toContain("[Document 1]");
});

});