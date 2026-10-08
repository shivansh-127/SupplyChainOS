const pool = require("../db");

async function seed() {
    try {
        console.log("Starting database seed...");

        await pool.query(`
            TRUNCATE TABLE
                supplier_components,
                product_components,
                factory_products,
                inventory,
                shipments,
                customer_orders,
                disruptions,
                suppliers,
                components,
                products,
                factories,
                warehouses
            RESTART IDENTITY CASCADE;
        `);

        console.log("Old data cleared.");

        const suppliers = [
            ["GlobalChip Systems", "Taiwan", 7.4],
            ["Apex Components", "India", 4.2],
            ["TechCore Industries", "South Korea", 6.1],
            ["Nova Battery Works", "Japan", 5.3],
            ["Pacific Semiconductors", "Singapore", 8.2]
        ];

       const supplierIds = {};

        for(const supplier of suppliers) {
            const result = await pool.query(
                `INSERT INTO suppliers (name, location, risk_score)
                VALUES ($1, $2, $3)
                RETURNING id`,
                supplier
            );

            const supplierId = result.rows[0].id;
            supplierIds[supplier[0]] = supplierId;
        }

        console.log("Suppliers inserted successfully.");

        
        const components = [
            ["A16 Processor", "Processor", 9.5],
            ["Snapdragon Processor", "Processor", 9.2],
            ["8GB RAM", "Memory", 7.0],
            ["16GB RAM", "Memory", 7.5],
            ["OLED Display", "Display", 8.5],
            ["LCD Display", "Display", 6.5],
            ["Lithium Battery", "Battery", 9.0],
            ["Camera Module", "Camera", 7.5],
            ["Main PCB", "PCB", 9.3],
            ["USB-C Connector", "Connector", 4.0]
        ];
        const componentIds = {};
        
        for (const component of components) {
            const result = await pool.query(
                `INSERT INTO components (name, category, criticality)
                 VALUES ($1, $2, $3)
                 RETURNING id`,
                component
            );
          
            const componentId = result.rows[0].id;
            componentIds[component[0]] = componentId;

            console.log(
                `Inserted component with ID: ${result.rows[0].id}`
            );
        }

        console.log("Components inserted successfully.");

        const productIds = {};

        const products = [
            ["NovaPhone X", "Smartphone"],
            ["NovaPhone Pro", "Smartphone"],
            ["NovaTab 10", "Tablet"],
            ["NovaLaptop Air", "Laptop"],
            ["NovaWatch S", "Smartwatch"]
        ];

        for (const product of products) {
            const result = await pool.query(
                `INSERT INTO products (name, category)
                VALUES ($1, $2)
                RETURNING id`,
                product
            );
            const productId = result.rows[0].id;

            productIds[product[0]] = productId;
            console.log(
                `Inserted product with ID: ${result.rows[0].id}`
            );
    }

    console.log("Products inserted successfully.");

            const productComponents = [
            ["NovaPhone X", "A16 Processor", 1],
            ["NovaPhone X", "8GB RAM", 2],
            ["NovaPhone X", "OLED Display", 1],
            ["NovaPhone X", "Lithium Battery", 1],
            ["NovaPhone X", "Camera Module", 2],

            ["NovaPhone Pro", "Snapdragon Processor", 1],
            ["NovaPhone Pro", "16GB RAM", 2],
            ["NovaPhone Pro", "OLED Display", 1],
            ["NovaPhone Pro", "Lithium Battery", 1],
            ["NovaPhone Pro", "Camera Module", 3],

            ["NovaTab 10", "Snapdragon Processor", 1],
            ["NovaTab 10", "8GB RAM", 2],
            ["NovaTab 10", "LCD Display", 1],
            ["NovaTab 10", "Lithium Battery", 1],

            ["NovaLaptop Air", "Snapdragon Processor", 1],
            ["NovaLaptop Air", "16GB RAM", 2],
            ["NovaLaptop Air", "LCD Display", 1],
            ["NovaLaptop Air", "Lithium Battery", 1],
            ["NovaLaptop Air", "USB-C Connector", 2],

            ["NovaWatch S", "8GB RAM", 1],
            ["NovaWatch S", "OLED Display", 1],
            ["NovaWatch S", "Lithium Battery", 1],
            ["NovaWatch S", "Main PCB", 1]
        ];

        for (const relation of productComponents) {

            const productId = productIds[relation[0]];
            const componentId = componentIds[relation[1]];
            const quantityRequired = relation[2];

            await pool.query(
                `INSERT INTO product_components
                (product_id, component_id, quantity_required)
                VALUES ($1, $2, $3)`,
                [productId, componentId, quantityRequired]
            );
        }

        const supplierComponents = [
            ["GlobalChip Systems", "A16 Processor", 12, 180, 500],
            ["Apex Components", "A16 Processor", 8, 195, 300],

            ["TechCore Industries", "Snapdragon Processor", 10, 160, 400],
            ["Apex Components", "Snapdragon Processor", 7, 170, 300],

            ["GlobalChip Systems", "8GB RAM", 9, 35, 1000],
            ["TechCore Industries", "8GB RAM", 8, 37, 800],

            ["GlobalChip Systems", "16GB RAM", 10, 60, 800],
            ["TechCore Industries", "16GB RAM", 9, 62, 600],

            ["TechCore Industries", "OLED Display", 14, 95, 500],
            ["Nova Battery Works", "OLED Display", 16, 100, 400],

            ["Nova Battery Works", "LCD Display", 10, 45, 600],
            ["Apex Components", "LCD Display", 8, 48, 500],

            ["Nova Battery Works", "Lithium Battery", 12, 30, 1000],
            ["Pacific Semiconductors", "Lithium Battery", 15, 32, 800],

            ["Pacific Semiconductors", "Camera Module", 13, 55, 500],
            ["TechCore Industries", "Camera Module", 11, 58, 400],

            ["Apex Components", "Main PCB", 9, 70, 500],
            ["TechCore Industries", "Main PCB", 11, 72, 400],

            ["Apex Components", "USB-C Connector", 6, 5, 2000],
            ["GlobalChip Systems", "USB-C Connector", 8, 5.5, 1500]
        ];

        for (const relation of supplierComponents) {
            const supplierId = supplierIds[relation[0]];
            const componentId = componentIds[relation[1]];

            await pool.query(
                `INSERT INTO supplier_components
                (supplier_id, component_id, lead_time_days, unit_cost, minimum_order_quantity)
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    supplierId,
                    componentId,
                    relation[2],
                    relation[3],
                    relation[4]
                ]
            );
        }

        console.log("Supplier-component relationships inserted successfully.");
        const factories = [
            ["Noida Electronics Plant", "Noida, India", 5000],
            ["Pune Manufacturing Hub", "Pune, India", 4000],
            ["Bangalore Tech Factory", "Bangalore, India", 3000],
            ["Chennai Assembly Plant", "Chennai, India", 3500]
        ];

        const factoryIds = {};

        for (const factory of factories) {
            const result = await pool.query(
                `INSERT INTO factories
                (name, location, production_capacity)
                VALUES ($1, $2, $3)
                RETURNING id`,
                factory
            );

            const factoryId = result.rows[0].id;
            factoryIds[factory[0]] = factoryId;
        }

        console.log("Factories inserted successfully.");

        const factoryProducts = [
            ["Noida Electronics Plant", "NovaPhone X", 2000],
            ["Noida Electronics Plant", "NovaPhone Pro", 1500],

            ["Pune Manufacturing Hub", "NovaPhone X", 1200],
            ["Pune Manufacturing Hub", "NovaTab 10", 1000],

            ["Bangalore Tech Factory", "NovaLaptop Air", 800],
            ["Bangalore Tech Factory", "NovaWatch S", 1200],

            ["Chennai Assembly Plant", "NovaPhone Pro", 1000],
            ["Chennai Assembly Plant", "NovaTab 10", 900],
            ["Chennai Assembly Plant", "NovaLaptop Air", 700]
        ];

        for (const relation of factoryProducts) {
            const factoryId = factoryIds[relation[0]];
            const productId = productIds[relation[1]];

            await pool.query(
                `INSERT INTO factory_products
                (factory_id, product_id, daily_capacity)
                VALUES ($1, $2, $3)`,
                [
                    factoryId,
                    productId,
                    relation[2]
                ]
            );
        }

        console.log("Factory-product relationships inserted successfully.");

        const warehouses = [
            ["Delhi Central Warehouse", "Delhi, India", 20000],
            ["Mumbai Distribution Warehouse", "Mumbai, India", 15000],
            ["Bangalore Regional Warehouse", "Bangalore, India", 12000]
        ];

        const warehouseIds = {};

        for(const warehouse of warehouses) {
            const result = await pool.query(
                `INSERT INTO warehouses
                (name, location, capacity)
                VALUES ($1, $2, $3)
                RETURNING id`,
                warehouse
            );

            const warehouseId = result.rows[0].id;
            warehouseIds[warehouse[0]] = warehouseId;
        }

        console.log("Warehouses inserted successfully.");
        const inventory = [
            ["Delhi Central Warehouse", "A16 Processor", 8000, 3000],
            ["Delhi Central Warehouse", "Snapdragon Processor", 7000, 2500],
            ["Delhi Central Warehouse", "8GB RAM", 15000, 5000],
            ["Delhi Central Warehouse", "16GB RAM", 10000, 4000],
            ["Delhi Central Warehouse", "OLED Display", 9000, 3000],
            ["Delhi Central Warehouse", "LCD Display", 7000, 2500],

            ["Mumbai Distribution Warehouse", "Lithium Battery", 12000, 4000],
            ["Mumbai Distribution Warehouse", "Camera Module", 8000, 3000],
            ["Mumbai Distribution Warehouse", "Main PCB", 6000, 2000],
            ["Mumbai Distribution Warehouse", "USB-C Connector", 20000, 7000],

            ["Bangalore Regional Warehouse", "A16 Processor", 5000, 2000],
            ["Bangalore Regional Warehouse", "Snapdragon Processor", 4500, 1500],
            ["Bangalore Regional Warehouse", "8GB RAM", 9000, 3000],
            ["Bangalore Regional Warehouse", "16GB RAM", 7000, 2500],
            ["Bangalore Regional Warehouse", "OLED Display", 5000, 1800],
            ["Bangalore Regional Warehouse", "LCD Display", 4000, 1500],
            ["Bangalore Regional Warehouse", "Lithium Battery", 8000, 2500]
        ];

        for (const item of inventory) {
            const warehouseId = warehouseIds[item[0]];
            const componentId = componentIds[item[1]];

            await pool.query(
                `INSERT INTO inventory
                (warehouse_id, component_id, quantity, reorder_level)
                VALUES ($1, $2, $3, $4)`,
                [
                    warehouseId,
                    componentId,
                    item[2],
                    item[3]
                ]
            );
        }

       console.log("Inventory inserted successfully.");

        const shipments = [
            ["GlobalChip Systems", "Delhi Central Warehouse", "A16 Processor", 5000, "2026-10-12", "IN_TRANSIT"],
            ["Apex Components", "Delhi Central Warehouse", "Snapdragon Processor", 4000, "2026-10-10", "IN_TRANSIT"],
            ["GlobalChip Systems", "Bangalore Regional Warehouse", "8GB RAM", 8000, "2026-10-11", "IN_TRANSIT"],
            ["Nova Battery Works", "Mumbai Distribution Warehouse", "Lithium Battery", 6000, "2026-10-13", "IN_TRANSIT"],
            ["Pacific Semiconductors", "Mumbai Distribution Warehouse", "Camera Module", 3000, "2026-10-09", "IN_TRANSIT"],
            ["Apex Components", "Bangalore Regional Warehouse", "USB-C Connector", 10000, "2026-10-08", "DELIVERED"]
        ];

        for (const shipment of shipments) {
            const supplierId = supplierIds[shipment[0]];
            const warehouseId = warehouseIds[shipment[1]];
            const componentId = componentIds[shipment[2]];

            await pool.query(
                `INSERT INTO shipments
                (supplier_id, destination_warehouse_id, component_id,
                quantity, expected_date, status)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    supplierId,
                    warehouseId,
                    componentId,
                    shipment[3],
                    shipment[4],
                    shipment[5]
                ]
            );
        }

        console.log("Shipments inserted successfully.");

        const customerOrders = [
            ["NovaPhone X", 2500, "2026-10-10", "PENDING"],
            ["NovaPhone X", 3500, "2026-10-13", "PENDING"],

            ["NovaPhone Pro", 1800, "2026-10-11", "PENDING"],
            ["NovaPhone Pro", 2200, "2026-10-15", "PENDING"],

            ["NovaTab 10", 1500, "2026-10-12", "PENDING"],
            ["NovaTab 10", 2000, "2026-10-16", "PENDING"],

            ["NovaLaptop Air", 1000, "2026-10-14", "PENDING"],
            ["NovaLaptop Air", 1200, "2026-10-18", "PENDING"],

            ["NovaWatch S", 800, "2026-10-11", "PENDING"],
            ["NovaWatch S", 1200, "2026-10-17", "PENDING"]
        ];

        for (const order of customerOrders) {
            const productId = productIds[order[0]];

            await pool.query(
                `INSERT INTO customer_orders
                (product_id, quantity, delivery_date, status)
                VALUES ($1, $2, $3, $4)`,
                [
                    productId,
                    order[1],
                    order[2],
                    order[3]
                ]
            );
        }

        console.log("Customer orders inserted successfully.");

        const disruptions = [
    [
        "GlobalChip Systems",
        "A16 Processor",
        "SUPPLY_DELAY",
        8.7,
        0.94,
        "Supplier has announced a major delay in A16 Processor deliveries.",
        "Semiconductor manufacturing disruption",
        10,
        "ACTIVE",
        "2026-10-17"
    ],
    [
        "Nova Battery Works",
        "Lithium Battery",
        "TRANSPORT_DISRUPTION",
        6.4,
        0.91,
        "Battery shipment is facing transportation delays.",
        "Port congestion",
        5,
        "ACTIVE",
        "2026-10-12"
    ]
];

        for (const disruption of disruptions) {
            const supplierId = supplierIds[disruption[0]];
            const componentId = componentIds[disruption[1]];

            await pool.query(
                `INSERT INTO disruptions
                (supplier_id, component_id, type, severity, ai_confidence,
                description, reason, delay_days, status, expected_resolution_date)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                [
                    supplierId,
                    componentId,
                    disruption[2],
                    disruption[3],
                    disruption[4],
                    disruption[5],
                    disruption[6],
                    disruption[7],
                    disruption[8],
                    disruption[9]
                ]
            );
        }

        console.log("Disruptions inserted successfully.");

    } catch (error) {
        console.error("Seeding failed:", error);
    } finally {
        await pool.end();
    }
}

seed();