const { analyzeDisruption } = require("../services/disruptionImpactService");
const { analyzeMitigation } = require("../services/mitigationService");

const {
    investigateDisruption,
    investigateOrder
} = require("../services/aiDisruptionService");

const pool = require("../db");

async function getDisruptionImpact(req, res) {
    try {
        const result = await analyzeDisruption(req.params.id);

        res.json(result);
    } catch (error) {
        console.error(error);

        if (error.message === "Disruption not found") {
            return res.status(404).json({
                message: error.message
            });
        }

        res.status(500).json({
            message: "Failed to analyze disruption"
        });
    }
}

    async function getMitigationOptions(req, res) {
        try {
            const result = await analyzeMitigation(req.params.id);
            res.json(result);
        } catch (error) {
            console.error(error);

            if (error.message === "Disruption not found") {
                return res.status(404).json({
                    message: error.message
                });
            }

            res.status(500).json({
                message: "Failed to analyze mitigation options"
            });
        }
    }
    


    async function investigateDisruptionController(req, res) {
        try {
            const disruptionId = Number(req.params.id);

            if (!Number.isInteger(disruptionId) || disruptionId <= 0) {
                return res.status(400).json({
                    error: "Invalid disruption ID"
                });
            }

            const result = await pool.query(
                `SELECT
                    d.id,
                    d.type,
                    d.severity,
                    d.ai_confidence,
                    d.description,
                    d.reason,
                    d.delay_days,
                    d.status,
                    d.expected_resolution_date,
                    s.name AS supplier_name,
                    s.location AS supplier_location,
                    c.name AS component_name,
                    c.criticality AS component_criticality
                FROM disruptions d
                LEFT JOIN suppliers s ON s.id = d.supplier_id
                LEFT JOIN components c ON c.id = d.component_id
                WHERE d.id = $1`,
                [disruptionId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: "Disruption not found"
                });
            }

            
            const disruption = result.rows[0];

            // Calculate the operational impact using our existing service.
            const impact = await analyzeDisruption(disruptionId);

            // Pass both trusted inputs to Gemini.
            const analysis = await investigateDisruption(disruption, impact);


            
            return res.status(200).json({
                success: true,
                data: {
                    ...analysis,
                    trustedFacts: {
                        expectedResolutionDate:
                            disruption.expected_resolution_date,
                        supplierName: disruption.supplier_name,
                        componentName: disruption.component_name
                    }
                }
            });

        } catch (error) {
            console.error("AI disruption investigation failed:", error);

            return res.status(500).json({
                error: "Unable to investigate disruption",
                details: error.message
            });
        }
    }

   
    async function investigateOrderController(req, res) {
        try {
            const disruptionId = Number(req.params.id);
            const orderId = Number(req.params.orderId);

            if (
                !Number.isSafeInteger(disruptionId) ||
                disruptionId <= 0 ||
                !Number.isSafeInteger(orderId) ||
                orderId <= 0
            ) {
                return res.status(400).json({
                    error: "Disruption ID and order ID must be positive integers"
                });
            }

            // Get the impact calculated by our backend.
            const impact = await analyzeDisruption(disruptionId);

            // Find the requested order in this disruption's impact.
            const order = impact.orders.find(
                item => Number(item.id) === orderId
            );

            if (!order) {
                return res.status(404).json({
                    error: "Order not found in this disruption's impact"
                });
            }

            if (!order.affected || Number(order.shortage) <= 0) {
                return res.status(400).json({
                    error: "AI order investigation requires an affected order"
                });
            }

            // Use the disruption record and order facts calculated by the backend.
            const analysis = await investigateOrder(
                impact.disruption,
                order,
                impact
            );

            return res.status(200).json({
                success: true,
                data: analysis
            });
        } catch (error) {
            console.error("Order investigation error:", error);

            if (error.message === "Disruption not found") {
                return res.status(404).json({
                    error: "Disruption not found"
                });
            }

            return res.status(500).json({
                error: "Unable to investigate customer order",
                details: error.message
            });
        }
    }

    module.exports = {
        getDisruptionImpact,
        getMitigationOptions,
        investigateDisruptionController,
        investigateOrderController
    };