const { allocateInventory } = require("../utils/allocateInventory");
const pool = require("../db");

async function analyzeDisruption(id) {
    const disruptionResult = await pool.query(
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
            s.id AS supplier_id,
            s.name AS supplier,
            c.id AS component_id,
            c.name AS component
         FROM disruptions d
         JOIN suppliers s ON d.supplier_id = s.id
         JOIN components c ON d.component_id = c.id
         WHERE d.id = $1`,
        [id]
    );

    if (disruptionResult.rows.length === 0) {
        throw new Error("Disruption not found");
    }

    const disruption = disruptionResult.rows[0];
    const delayDays = Number(disruption.delay_days);

    // Products that require the disrupted component.
    const productsResult = await pool.query(
        `SELECT
            p.id,
            p.name,
            pc.quantity_required
         FROM product_components pc
         JOIN products p ON pc.product_id = p.id
         WHERE pc.component_id = $1`,
        [disruption.component_id]
    );

    // Factories producing affected products.
    const factoriesResult = await pool.query(
        `SELECT
            f.id,
            f.name,
            f.location,
            fp.product_id,
            p.name AS product,
            fp.daily_capacity,
            fp.daily_capacity * $1 AS potential_production_loss,
            pc.quantity_required
         FROM product_components pc
         JOIN factory_products fp ON pc.product_id = fp.product_id
         JOIN factories f ON fp.factory_id = f.id
         JOIN products p ON fp.product_id = p.id
         WHERE pc.component_id = $2`,
        [delayDays, disruption.component_id]
    );

    // Current inventory across warehouses.
    const inventoryResult = await pool.query(
        `SELECT
            w.id,
            w.name AS warehouse,
            i.quantity,
            i.reorder_level
         FROM inventory i
         JOIN warehouses w ON i.warehouse_id = w.id
         WHERE i.component_id = $1`,
        [disruption.component_id]
    );

    const totalInventory = inventoryResult.rows.reduce(
        (sum, item) => sum + Number(item.quantity),
        0
    );

    // Estimated component demand per day at configured factory capacity.
    const dailyRequirement = factoriesResult.rows.reduce(
        (sum, factory) =>
            sum +
            Number(factory.daily_capacity) *
            Number(factory.quantity_required),
        0
    );

    const inventoryCoverage =
        dailyRequirement > 0
            ? totalInventory / dailyRequirement
            : null;

    const supplyGapDays =
        inventoryCoverage !== null
            ? Math.max(delayDays - inventoryCoverage, 0)
            : null;

    // Incoming shipments for the disrupted component.
    const shipmentsResult = await pool.query(
        `SELECT
            sh.id,
            sh.supplier_id,
            s.name AS supplier,
            w.name AS warehouse,
            sh.quantity,
            sh.expected_date,
            sh.status,
            CASE
                WHEN sh.supplier_id = $1 THEN true
                ELSE false
            END AS at_risk
         FROM shipments sh
         JOIN suppliers s ON sh.supplier_id = s.id
         JOIN warehouses w ON sh.destination_warehouse_id = w.id
         WHERE sh.component_id = $2
           AND sh.status = 'IN_TRANSIT'`,
        [disruption.supplier_id, disruption.component_id]
    );

    // Configured alternative suppliers.
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
         JOIN suppliers s ON sc.supplier_id = s.id
         WHERE sc.component_id = $1
           AND sc.supplier_id <> $2
           AND s.status = 'ACTIVE'
         ORDER BY sc.lead_time_days ASC, sc.unit_cost ASC`,
        [disruption.component_id, disruption.supplier_id]
    );

    // Customer orders requiring the disrupted component.
    const ordersResult = await pool.query(
        `SELECT
            co.id,
            co.product_id,
            p.name AS product,
            co.quantity,
            co.delivery_date,
            co.status,
            pc.quantity_required
         FROM customer_orders co
         JOIN products p ON co.product_id = p.id
         JOIN product_components pc ON co.product_id = pc.product_id
         WHERE pc.component_id = $1
           AND co.status = 'PENDING'
         ORDER BY co.delivery_date ASC, co.id ASC`,
        [disruption.component_id]
    );

    const allocationResult = allocateInventory(
    ordersResult.rows,
    totalInventory,
    shipmentsResult.rows
    );

    const orderImpact = allocationResult.orders;
    const totalShortage = allocationResult.totalShortage;
    const affectedOrders = allocationResult.affectedOrders;
   

    return {
        disruption,

        affectedProducts: productsResult.rows,

        affectedFactories: factoriesResult.rows,

        inventory: {
            warehouses: inventoryResult.rows,
            total: totalInventory,
            dailyRequirement,
            coverageDays: inventoryCoverage
        },

        supplyGapDays,

        incomingShipments: shipmentsResult.rows,
        alternativeSuppliers: alternativesResult.rows,
        orders: orderImpact,

        summary: {
            potentialProductionLoss: factoriesResult.rows.reduce(
                (sum, factory) =>
                    sum + Number(factory.potential_production_loss),
                0
            ),
            affectedOrders,
            totalShortage
        }
    };
}

module.exports = {
    analyzeDisruption
};
