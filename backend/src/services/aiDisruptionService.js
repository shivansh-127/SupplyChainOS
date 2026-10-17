
    const VALID_CATEGORIES = [
        "SUPPLY_DELAY",
        "TRANSPORT_DISRUPTION",
        "QUALITY_ISSUE",
        "GEOPOLITICAL_RISK",
        "NATURAL_DISASTER",
        "OTHER"
    ];

  async function investigateDisruption(disruption, impact) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is missing from backend environment");
    }

    if (!disruption || !disruption.id) {
        throw new Error("A valid disruption record is required");
    }

    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    
    const prompt = `
        You are a supply-chain risk analyst.

        Analyze this disruption using the supplied disruption record
        and the calculated operational impact.

        Rules:
        - Treat the disruption record and operational impact as the
        supplied evidence.
        - Do not invent inventory quantities, shortage values, supplier
        capacity, dates, or delivery outcomes.
        - Explain the operational significance of the supplied calculations.
        - Distinguish calculated facts from possible consequences.
        - Do not claim that a recommended action has been performed.
        - Mention uncertainties and assumptions where appropriate.
        - Your assessed severity is an AI judgment, not a verified measurement.
        - Do not treat model-reported confidence as a calibrated probability.

        Disruption record:
        ${JSON.stringify(disruption, null, 2)}

        Calculated operational impact:
        ${JSON.stringify(impact, null, 2)}
        `;


    const responseSchema = {
        type: "OBJECT",
        properties: {
            eventCategory: {
                type: "STRING",
                enum: VALID_CATEGORIES
            },
            assessedSeverity: {
                type: "INTEGER",
                minimum: 1,
                maximum: 10
            },
            summary: {
                type: "STRING"
            },
            reasoning: {
                type: "STRING"
            },
            keyRisks: {
                type: "ARRAY",
                items: { type: "STRING" }
            },
            recommendedNextSteps: {
                type: "ARRAY",
                items: { type: "STRING" }
            },
            uncertainties: {
                type: "ARRAY",
                items: { type: "STRING" }
            },
            confidence: {
                type: "NUMBER",
                minimum: 0,
                maximum: 1
            }
        },
        required: [
            "eventCategory",
            "assessedSeverity",
            "summary",
            "reasoning",
            "keyRisks",
            "recommendedNextSteps",
            "uncertainties",
            "confidence"
        ],
        propertyOrdering: [
            "eventCategory",
            "assessedSeverity",
            "summary",
            "reasoning",
            "keyRisks",
            "recommendedNextSteps",
            "uncertainties",
            "confidence"
        ]
    };

    const response = await ai.models.generateContent({
       model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.2
        }
    });

    if (!response.text) {
        throw new Error("Gemini returned an empty response");
    }

    let analysis;

    try {
        analysis = JSON.parse(response.text);
    } catch {
        throw new Error("Gemini returned invalid JSON");
    }

    if (
        !VALID_CATEGORIES.includes(analysis.eventCategory) ||
        !Number.isInteger(analysis.assessedSeverity) ||
        analysis.assessedSeverity < 1 ||
        analysis.assessedSeverity > 10 ||
        typeof analysis.summary !== "string" ||
        typeof analysis.reasoning !== "string" ||
        !Array.isArray(analysis.keyRisks) ||
        !Array.isArray(analysis.recommendedNextSteps) ||
        !Array.isArray(analysis.uncertainties) ||
        typeof analysis.confidence !== "number" ||
        analysis.confidence < 0 ||
        analysis.confidence > 1
    ) {
        throw new Error("Gemini returned data that failed validation");
    }

    return {
        disruptionId: disruption.id,
        model: "gemini-3.5-flash-lite",
        analysisType: "AI-generated assessment",
        ...analysis
    };
}


        async function investigateOrder(disruption, order, impact) {
            if (!process.env.GEMINI_API_KEY) {
                throw new Error("GEMINI_API_KEY is missing from backend environment");
            }

            if (!disruption?.id || !order?.id || !impact) {
                throw new Error(
                    "Disruption, affected order, and impact data are required"
                );
            }

            const { GoogleGenAI } = await import("@google/genai");

            const ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY
            });

            // Send only the relevant evidence for this order.
            const evidence = {
                disruption: {
                    id: disruption.id,
                    type: disruption.type,
                    description: disruption.description,
                    delayDays: disruption.delay_days,
                    supplier: disruption.supplier,
                    component: disruption.component
                },
                order: {
                    id: order.id,
                    product: order.product,
                    quantity: order.quantity,
                    deliveryDate: order.delivery_date,
                    allocated: order.allocated,
                    shortage: order.shortage,
                    affected: order.affected
                },
                inventory: {
                    total: impact.inventory.total,
                    dailyRequirement: impact.inventory.dailyRequirement,
                    coverageDays: impact.inventory.coverageDays
                },
                summary: {
                    affectedOrders: impact.summary.affectedOrders,
                    totalShortage: impact.summary.totalShortage
                }
            };

            const prompt = `
        You are a supply-chain decision-support analyst.

        Explain why the selected customer order is affected, using only
        the supplied evidence.

        Rules:
        - Use the supplied shortage and allocation values as calculated facts.
        - Do not recalculate or invent quantities, dates, or outcomes.
        - Explain the difference between ordered quantity, allocated quantity,
        and shortage.
        - If the order is not marked affected, do not claim it has a shortage.
        - Separate known facts from possible consequences.
        - Recommend investigation steps, not actions claimed to be completed.
        - Mention relevant uncertainties.
        - Do not claim that a recommendation guarantees delivery.

        Evidence:
        ${JSON.stringify(evidence, null, 2)}
        `;

            const responseSchema = {
                type: "OBJECT",
                properties: {
                    explanation: {
                        type: "STRING"
                    },
                    evidence: {
                        type: "ARRAY",
                        items: {
                            type: "STRING"
                        }
                    },
                    recommendedActions: {
                        type: "ARRAY",
                        items: {
                            type: "STRING"
                        }
                    },
                    uncertainties: {
                        type: "ARRAY",
                        items: {
                            type: "STRING"
                        }
                    }
                },
                required: [
                    "explanation",
                    "evidence",
                    "recommendedActions",
                    "uncertainties"
                ],
                propertyOrdering: [
                    "explanation",
                    "evidence",
                    "recommendedActions",
                    "uncertainties"
                ]
            };

            const response = await ai.models.generateContent({
                model: "gemini-3.5-flash-lite",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema,
                    temperature: 0.2
                }
            });

            if (!response.text) {
                throw new Error("Gemini returned an empty response");
            }

            let analysis;

            try {
                analysis = JSON.parse(response.text);
            } catch {
                throw new Error("Gemini returned invalid JSON");
            }

            if (
                typeof analysis.explanation !== "string" ||
                !Array.isArray(analysis.evidence) ||
                !analysis.evidence.every(item => typeof item === "string") ||
                !Array.isArray(analysis.recommendedActions) ||
                !analysis.recommendedActions.every(item => typeof item === "string") ||
                !Array.isArray(analysis.uncertainties) ||
                !analysis.uncertainties.every(item => typeof item === "string")
            ) {
                throw new Error("Gemini returned data that failed validation");
            }

            return {
                disruptionId: disruption.id,
                orderId: order.id,
                model: "gemini-3.5-flash-lite",
                analysisType: "AI-generated order assessment",
                ...analysis
            };
        }

module.exports = {
    investigateDisruption,
    investigateOrder
};