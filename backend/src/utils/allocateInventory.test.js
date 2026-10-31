
const { allocateInventory } = require("./allocateInventory");


function assertEqual(actual, expected) {
    expect(actual).toBe(expected);
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


// Test 5: A shipment arriving on the delivery date is eligible.
test("counts a shipment arriving on the delivery date", () => {
    const result = allocateInventory(
        [
            {
                id: 1,
                product: "NovaPhone X",
                quantity: 3000,
                quantity_required: 1,
                delivery_date: "2026-10-12"
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

    expect(result.orders[0].allocated).toBe(3000);
    expect(result.orders[0].shortage).toBe(0);
});

// Test 6: Invalid order quantities must be rejected.
test("rejects negative order quantities", () => {
    expect(() =>
        allocateInventory(
            [
                {
                    id: 1,
                    product: "NovaPhone X",
                    quantity: -100,
                    quantity_required: 1,
                    delivery_date: "2026-10-12"
                }
            ],
            2000
        )
    ).toThrow("Invalid quantities for order 1");
});

// Test 7: Zero component requirement must be rejected.
test("rejects a zero component requirement", () => {
    expect(() =>
        allocateInventory(
            [
                {
                    id: 1,
                    product: "NovaPhone X",
                    quantity: 100,
                    quantity_required: 0,
                    delivery_date: "2026-10-12"
                }
            ],
            2000
        )
    ).toThrow("Invalid quantities for order 1");
});


test("rejects negative total inventory", () => {
    expect(() =>
        allocateInventory([], -100)
    ).toThrow("Invalid total inventory");
});

test("rejects invalid shipment quantity", () => {
    expect(() =>
        allocateInventory(
            [],
            2000,
            [
                {
                    quantity: -500,
                    expected_date: "2026-10-12",
                    at_risk: false
                }
            ]
        )
    ).toThrow("Invalid quantity for shipment at index 0");
});

test("rejects invalid shipment date", () => {
    expect(() =>
        allocateInventory(
            [],
            2000,
            [
                {
                    quantity: 500,
                    expected_date: "not-a-date",
                    at_risk: false
                }
            ]
        )
    ).toThrow("Invalid expected date for shipment at index 0");
});
