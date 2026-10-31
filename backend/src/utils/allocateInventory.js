
function allocateInventory(orders, totalInventory, shipments = []) {
    const inventory = Number(totalInventory);

    if (!Number.isFinite(inventory) || inventory < 0) {
        throw new Error("Invalid total inventory");
    }

    if (!Array.isArray(orders) || !Array.isArray(shipments)) {
        throw new Error("Orders and shipments must be arrays");
    }

    const incomingSupply = shipments
        .map((shipment, index) => {
            const quantity = Number(shipment.quantity);

            if (!Number.isFinite(quantity) || quantity < 0) {
                throw new Error(
                    `Invalid quantity for shipment at index ${index}`
                );
            }

            let expectedDate = null;

            if (shipment.expected_date != null) {
                expectedDate = new Date(shipment.expected_date);

                if (Number.isNaN(expectedDate.getTime())) {
                    throw new Error(
                        `Invalid expected date for shipment at index ${index}`
                    );
                }
            }

            return {
                quantity,
                expectedDate,
                atRisk: Boolean(shipment.at_risk),
                added: false
            };
        })
        .filter(
            shipment =>
                !shipment.atRisk &&
                shipment.expectedDate !== null
        )
        .sort((a, b) => a.expectedDate - b.expectedDate);

    let remainingSupply = inventory;

    const sortedOrders = [...orders].sort(
        (a, b) =>
            new Date(a.delivery_date) - new Date(b.delivery_date) ||
            Number(a.id) - Number(b.id)
    );

    const orderImpact = [];

    for (const order of sortedOrders) {
        const deliveryDate = new Date(order.delivery_date);

        if (Number.isNaN(deliveryDate.getTime())) {
            throw new Error(`Invalid delivery date for order ${order.id}`);
        }

        for (const shipment of incomingSupply) {
            if (
                !shipment.added &&
                shipment.expectedDate <= deliveryDate
            ) {
                remainingSupply += shipment.quantity;
                shipment.added = true;
            }
        }

        const orderedQuantity = Number(order.quantity);
        const quantityRequired = Number(order.quantity_required);

        if (
            !Number.isFinite(orderedQuantity) ||
            orderedQuantity < 0 ||
            !Number.isFinite(quantityRequired) ||
            quantityRequired <= 0
        ) {
            throw new Error(`Invalid quantities for order ${order.id}`);
        }

        const allocated = Math.min(
            orderedQuantity,
            Math.floor(remainingSupply / quantityRequired)
        );

        remainingSupply -= allocated * quantityRequired;

        const shortage = orderedQuantity - allocated;

        orderImpact.push({
            id: order.id,
            product: order.product,
            quantity: orderedQuantity,
            delivery_date: order.delivery_date,
            allocated,
            shortage,
            affected: shortage > 0
        });
    }

    return {
        orders: orderImpact,
        totalShortage: orderImpact.reduce(
            (sum, order) => sum + order.shortage,
            0
        ),
        affectedOrders: orderImpact.filter(
            order => order.affected
        ).length,
        remainingSupply
    };
}

module.exports = { allocateInventory };
