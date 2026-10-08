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
         JOIN suppliers s
            ON d.supplier_id = s.id
         JOIN components c
            ON d.component_id = c.id
         WHERE d.id = $1`,
        [id]
    );

    if (disruptionResult.rows.length === 0) {
        throw new Error("Disruption not found");
    }

    const disruption = disruptionResult.rows[0];

    const productsResult = await pool.query(
        `SELECT
            p.id,
            p.name,
            pc.quantity_required
         FROM product_components pc
         JOIN products p
            ON pc.product_id = p.id
         WHERE pc.component_id = $1`,
        [disruption.component_id]
    );

    const factoriesResult = await pool.query(
        `SELECT
            f.id,
            f.name,
            f.location,
            fp.product_id,
            p.name AS product,
            fp.daily_capacity,
            fp.daily_capacity * $1 AS potential_production_loss
         FROM product_components pc
         JOIN factory_products fp
            ON pc.product_id = fp.product_id
         JOIN factories f
            ON fp.factory_id = f.id
         JOIN products p
            ON fp.product_id = p.id
         WHERE pc.component_id = $2`,
        [disruption.delay_days, disruption.component_id]
    );

    const inventoryResult = await pool.query(
        `SELECT
            w.id,
            w.name AS warehouse,
            i.quantity,
            i.reorder_level
         FROM inventory i
         JOIN warehouses w
            ON i.warehouse_id = w.id
         WHERE i.component_id = $1`,
        [disruption.component_id]
    );

    const totalInventory = inventoryResult.rows.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const dailyRequirement = factoriesResult.rows.reduce(
        (sum, factory) => {
            const product = productsResult.rows.find(
                p => p.id === factory.product_id
            );

            return sum + (
                factory.daily_capacity *
                product.quantity_required
            );
        },
        0
    );

    const inventoryCoverage =
        dailyRequirement > 0
            ? totalInventory / dailyRequirement
            : null;

    const supplyGapDays =
        inventoryCoverage !== null
            ? Math.max(
                disruption.delay_days - inventoryCoverage,
                0
            )
            : 0;

    const shipmentsResult = await pool.query(
        `SELECT
            sh.id,
            s.name AS supplier,
            w.name AS warehouse,
            sh.quantity,
            sh.expected_date,
            sh.status,
            CASE
                WHEN sh.supplier_id = $1
                THEN true
                ELSE false
            END AS at_risk
         FROM shipments sh
         JOIN suppliers s
            ON sh.supplier_id = s.id
         JOIN warehouses w
            ON sh.destination_warehouse_id = w.id
         WHERE sh.component_id = $2
           AND sh.status = 'IN_TRANSIT'`,
        [disruption.supplier_id, disruption.component_id]
    );

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
         JOIN products p
            ON co.product_id = p.id
         JOIN product_components pc
            ON co.product_id = pc.product_id
         WHERE pc.component_id = $1
         ORDER BY co.delivery_date`,
        [disruption.component_id]
    );

    const orders = ordersResult.rows;

    orders.sort(
        (a, b) =>
            new Date(a.delivery_date) -
            new Date(b.delivery_date)
    );

    let remainingSupply = totalInventory;

    const orderImpact = [];

    for (const order of orders) {
        const componentDemand =
            order.quantity * order.quantity_required;

        const allocatedComponents = Math.min(
            remainingSupply,
            componentDemand
        );

        const allocatedProducts = Math.floor(
            allocatedComponents / order.quantity_required
        );

        const consumedComponents =
            allocatedProducts * order.quantity_required;

        remainingSupply -= consumedComponents;

        const shortage =
            order.quantity - allocatedProducts;

        orderImpact.push({
            id: order.id,
            product: order.product,
            quantity: order.quantity,
            delivery_date: order.delivery_date,
            allocated: allocatedProducts,
            shortage,
            affected: shortage > 0
        });
    }

    const totalShortage = orderImpact.reduce(
        (sum, order) => sum + order.shortage,
        0
    );

    const affectedOrders = orderImpact.filter(
        order => order.affected
    ).length;

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

        orders: orderImpact,

        summary: {
            potentialProductionLoss: factoriesResult.rows.reduce(
                (sum, factory) =>
                    sum + factory.potential_production_loss,
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