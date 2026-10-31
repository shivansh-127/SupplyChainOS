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

    
async function createDisruptionController(req, res) {
    try {
        const {
            supplier_id,
            component_id,
            type,
            severity,
            description,
            reason,
            delay_days,
            status = "ACTIVE",
            expected_resolution_date
        } = req.body;

        const supplierId = Number(supplier_id);
        const componentId = Number(component_id);
        const severityValue = Number(severity);
        const delayDays = Number(delay_days);

        if (
            !Number.isSafeInteger(supplierId) ||
            supplierId <= 0 ||
            !Number.isSafeInteger(componentId) ||
            componentId <= 0
        ) {
            return res.status(400).json({
                error: "Valid supplier_id and component_id are required"
            });
        }

        if (
            typeof type !== "string" ||
            !type.trim() ||
            typeof description !== "string" ||
            !description.trim()
        ) {
            return res.status(400).json({
                error: "Disruption type and description are required"
            });
        }

        if (
            !Number.isFinite(severityValue) ||
            severityValue < 1 ||
            severityValue > 10 ||
            !Number.isInteger(delayDays) ||
            delayDays < 0
        ) {
            return res.status(400).json({
                error: "Severity must be between 1 and 10 and delay_days must be a non-negative integer"
            });
        }

        const allowedStatuses = ["ACTIVE", "RESOLVED", "MONITORING"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: "Invalid disruption status"
            });
        }

        if (
            expected_resolution_date != null &&
            (
                typeof expected_resolution_date !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(expected_resolution_date) ||
                Number.isNaN(Date.parse(expected_resolution_date)) ||
                new Date(`${expected_resolution_date}T00:00:00.000Z`)
                    .toISOString()
                    .slice(0, 10) !== expected_resolution_date
            )
        ) {
            return res.status(400).json({
                error: "expected_resolution_date must be a valid YYYY-MM-DD date"
            });
        }

        const references = await pool.query(
            `SELECT
                EXISTS(SELECT 1 FROM suppliers WHERE id = $1) AS supplier_exists,
                EXISTS(SELECT 1 FROM components WHERE id = $2) AS component_exists`,
            [supplierId, componentId]
        );

        if (!references.rows[0].supplier_exists) {
            return res.status(400).json({
                error: "Supplier not found"
            });
        }

        if (!references.rows[0].component_exists) {
            return res.status(400).json({
                error: "Component not found"
            });
        }

        const result = await pool.query(
            `INSERT INTO disruptions (
                supplier_id,
                component_id,
                type,
                severity,
                description,
                reason,
                delay_days,
                status,
                expected_resolution_date
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                supplierId,
                componentId,
                type.trim(),
                severityValue,
                description.trim(),
                typeof reason === "string" ? reason.trim() : null,
                delayDays,
                status,
                expected_resolution_date ?? null
            ]
        );

        return res.status(201).json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Create disruption failed:", error);

        return res.status(500).json({
            error: "Unable to create disruption"
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

    async function deleteDisruptionController(req, res) {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid disruption ID"
        });
    }

    try {
        const result = await pool.query(
            `DELETE FROM disruptions
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Disruption not found"
            });
        }

        return res.json({
            success: true,
            message: `Disruption #${id} deleted successfully`,
            deletedId: id
        });
    } catch (error) {
        console.error("Delete disruption error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete disruption"
        });
    }
}

    module.exports = {
    getDisruptionImpact,
    getMitigationOptions,
    investigateDisruptionController,
    investigateOrderController,
    createDisruptionController,
    deleteDisruptionController
};