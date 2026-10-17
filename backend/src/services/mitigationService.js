
const pool = require("../db");

async function analyzeMitigation(id) {
    const disruptionResult = await pool.query(
        `SELECT
            d.id,
            d.supplier_id,
            d.component_id,
            d.delay_days,
            d.expected_resolution_date,
            s.name AS supplier,
            c.name AS component
         FROM disruptions d
         JOIN suppliers s ON s.id = d.supplier_id
         JOIN components c ON c.id = d.component_id
         WHERE d.id = $1`,
        [id]
    );

    if (disruptionResult.rows.length === 0) {
        throw new Error("Disruption not found");
    }

    const disruption = disruptionResult.rows[0];

    const inventoryResult = await pool.query(
        `SELECT COALESCE(SUM(quantity), 0) AS total_inventory
         FROM inventory
         WHERE component_id = $1`,
        [disruption.component_id]
    );

    const demandResult = await pool.query(
        `SELECT COALESCE(
            SUM(fp.daily_capacity * pc.quantity_required), 0
         ) AS daily_requirement
         FROM product_components pc
         JOIN factory_products fp
            ON fp.product_id = pc.product_id
         WHERE pc.component_id = $1`,
        [disruption.component_id]
    );

    const originalCostResult = await pool.query(
        `SELECT unit_cost
         FROM supplier_components
         WHERE supplier_id = $1
           AND component_id = $2`,
        [disruption.supplier_id, disruption.component_id]
    );

    const alternativesResult = await pool.query(
        `SELECT
            s.id AS supplier_id,
            s.name AS supplier,
            s.location,
            s.risk_score,
            sc.lead_time_days,
            sc.unit_cost,
            sc.minimum_order_quantity
         FROM supplier_components sc
         JOIN suppliers s ON s.id = sc.supplier_id
         WHERE sc.component_id = $1
           AND sc.supplier_id <> $2
           AND s.status = 'ACTIVE'
         ORDER BY sc.lead_time_days, sc.unit_cost`,
        [disruption.component_id, disruption.supplier_id]
    );

    const totalInventory = Number(
        inventoryResult.rows[0].total_inventory
    );

    const dailyRequirement = Number(
        demandResult.rows[0].daily_requirement
    );

    const originalUnitCost =
        originalCostResult.rows[0]?.unit_cost == null
            ? null
            : Number(originalCostResult.rows[0].unit_cost);

    const delayDays = Number(disruption.delay_days);

    const coverageDays =
        dailyRequirement > 0
            ? totalInventory / dailyRequirement
            : null;

    const supplyGapDays =
        coverageDays !== null
            ? Math.max(delayDays - coverageDays, 0)
            : null;

    const alternatives = alternativesResult.rows.map(item => {
    const leadTime = Number(item.lead_time_days);
    const unitCost = Number(item.unit_cost);
    const minimumOrder = Number(item.minimum_order_quantity);

    const arrivesBeforeStockout =
        coverageDays !== null && leadTime <= coverageDays;

    const arrivesBeforeRecovery = leadTime < delayDays;

    const demandAfterArrival =
        dailyRequirement > 0 && arrivesBeforeRecovery
            ? Math.ceil(
                dailyRequirement * (delayDays - leadTime)
            )
            : 0;

    const orderQuantity =
        demandAfterArrival > 0
            ? Math.max(demandAfterArrival, minimumOrder)
            : 0;

    const estimatedCost = orderQuantity * unitCost;

    const costPremium =
        originalUnitCost === null
            ? null
            : orderQuantity * (unitCost - originalUnitCost);

    let timingAssessment;

    if (coverageDays === null) {
        timingAssessment = "UNKNOWN_INVENTORY_COVERAGE";
    } else if (arrivesBeforeStockout && arrivesBeforeRecovery) {
        timingAssessment = "ARRIVES_BEFORE_STOCKOUT";
    } else if (arrivesBeforeRecovery) {
        timingAssessment = "ARRIVES_AFTER_STOCKOUT";
    } else {
        timingAssessment = "ARRIVES_AFTER_EXPECTED_RECOVERY";
    }

    return {
        supplierId: item.supplier_id,
        supplier: item.supplier,
        location: item.location,
        riskScore: Number(item.risk_score),
        leadTimeDays: leadTime,
        unitCost,
        minimumOrderQuantity: minimumOrder,

        canArriveBeforeInventoryRunsOut: arrivesBeforeStockout,
        canArriveBeforeRecovery: arrivesBeforeRecovery,

        timingAssessment,

        estimatedOrderQuantity: orderQuantity,
        estimatedProcurementCost: estimatedCost,
        estimatedCostPremium: costPremium,

        availability: "UNKNOWN",
        capacity: "UNKNOWN"
    };
});

    return {
        disruption: {
            id: disruption.id,
            supplier: disruption.supplier,
            component: disruption.component,
            delayDays,
            expectedResolutionDate: disruption.expected_resolution_date
        },
        baseline: {
            totalInventory,
            dailyRequirement,
            coverageDays,
            supplyGapDays,
            originalUnitCost
        },
        options: {
            waitForOriginalSupplier: {
                estimatedSupplyGapDays: supplyGapDays
            },
            emergencyProcurement: alternatives,
            adjustProduction: {
                requiresProductionScheduleAnalysis: true,
                estimatedImpact: "NOT_CALCULATED"
            }
        },
        assumptions: [
            "Inventory is aggregated across warehouses.",
            "Daily demand is estimated from configured factory capacities.",
            "Alternative supplier capacity and availability are unknown.",
            "Lead times and costs are estimates from stored supplier data.",
            "Cost premium compares the same estimated order quantity."
        ]
    };
}

module.exports = { analyzeMitigation };
