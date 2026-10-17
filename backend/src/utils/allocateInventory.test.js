
const { allocateInventory } = require("./allocateInventory");

function test(name, callback) {
    try {
        callback();
        console.log(`PASS: ${name}`);
    } catch (error) {
        console.error(`FAIL: ${name}`);
        console.error(error.message);
        process.exitCode = 1;
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(
            `${message}: expected ${expected}, received ${actual}`
        );
    }
}

// Test 1: Earlier order gets priority when supply is insufficient.
test("allocates limited inventory by delivery date", () => {
    const result = allocateInventory(
        [
            {
                id: 2,
                product: "NovaPhone X",
                quantity: 3500,
                quantity_required: 1,
                delivery_date: "2026-10-13"
            },
            {
                id: 1,
                product: "NovaPhone X",
                quantity: 2500,
                quantity_required: 1,
                delivery_date: "2026-10-10"
            }
        ],
        4000
    );

    assertEqual(result.orders[0].id, 1, "First order ID");
    assertEqual(result.orders[0].allocated, 2500, "First allocation");
    assertEqual(result.orders[1].allocated, 1500, "Second allocation");
    assertEqual(result.orders[1].shortage, 2000, "Second shortage");
    assertEqual(result.totalShortage, 2000, "Total shortage");
});

// Test 2: An eligible shipment increases available supply.
test("counts a shipment arriving before the order deadline", () => {
    const result = allocateInventory(
        [
            {
                id: 1,
                product: "NovaPhone X",
                quantity: 3000,
                quantity_required: 1,
                delivery_date: "2026-10-13"
            }
        ],
        2000,
        [
            {
                quantity: 1000,
                expected_date: "2026-10-12",
                at_risk: false
            }
        ]
    );

    assertEqual(result.orders[0].allocated, 3000, "Allocated quantity");
    assertEqual(result.orders[0].shortage, 0, "Shortage");
});

// Test 3: A shipment arriving after the deadline cannot cover that order.
test("does not count a late shipment for an earlier deadline", () => {
    const result = allocateInventory(
        [
            {
                id: 1,
                product: "NovaPhone X",
                quantity: 3000,
                quantity_required: 1,
                delivery_date: "2026-10-10"
            }
        ],
        2000,
        [
            {
                quantity: 1000,
                expected_date: "2026-10-12",
                at_risk: false
            }
        ]
    );

    assertEqual(result.orders[0].allocated, 2000, "Allocated quantity");
    assertEqual(result.orders[0].shortage, 1000, "Shortage");
});

// Test 4: A shipment from the disrupted supplier is excluded.
test("excludes shipments marked at risk", () => {
    const result = allocateInventory(
        [
            {
                id: 1,
                product: "NovaPhone X",
                quantity: 3000,
                quantity_required: 1,
                delivery_date: "2026-10-13"
            }
        ],
        2000,
        [
            {
                quantity: 5000,
                expected_date: "2026-10-10",
                at_risk: true
            }
        ]
    );

    assertEqual(result.orders[0].allocated, 2000, "Allocated quantity");
    assertEqual(result.orders[0].shortage, 1000, "Shortage");
});


