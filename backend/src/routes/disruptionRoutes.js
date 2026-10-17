
const express = require("express");
const pool = require("../db");

const {
    getDisruptionImpact,
    getMitigationOptions,
    investigateDisruptionController,
    investigateOrderController
} = require("../controllers/disruptionController");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                d.id,
                d.type,
                d.severity,
                d.ai_confidence,
                d.description,
                d.delay_days,
                d.status,
                d.expected_resolution_date,
                s.name AS supplier,
                c.name AS component
             FROM disruptions d
             JOIN suppliers s
                ON d.supplier_id = s.id
             JOIN components c
                ON d.component_id = c.id
             ORDER BY
                CASE
                    WHEN d.status = 'ACTIVE' THEN 0
                    ELSE 1
                END,
                d.severity DESC,
                d.id`
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch disruptions"
        });
    }
});

router.get("/:id/impact", getDisruptionImpact);
router.get("/:id/mitigation", getMitigationOptions);
router.post("/:id/investigate", investigateDisruptionController);
router.post(
    "/:id/orders/:orderId/investigate",
    investigateOrderController
);

module.exports = router;

