
function allocateInventory(orders, totalInventory, shipments = []) {
    const incomingSupply = shipments
        .filter(
            shipment =>
                !shipment.at_risk &&
                shipment.expected_date != null
        )
        .map(shipment => ({
            quantity: Number(shipment.quantity),
            expectedDate: new Date(shipment.expected_date),
            added: false
        }))
        .sort((a, b) => a.expectedDate - b.expectedDate);

    let remainingSupply = Number(totalInventory);

    const sortedOrders = [...orders].sort(
        (a, b) =>
            new Date(a.delivery_date) - new Date(b.delivery_date) ||
            Number(a.id) - Number(b.id)
    );

    const orderImpact = [];

    for (const order of sortedOrders) {
        const deliveryDate = new Date(order.delivery_date);

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
