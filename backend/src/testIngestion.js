
require("dotenv").config();

const { ingestDocument } = require("./services/documentIngestionService");

async function testIngestion() {
    try {
        const result = await ingestDocument({
            title: "Demo Supplier Delay Policy",
            source: "demo/supplier-delay-policy.txt",
            text: `Supplier Delay Response Policy

When a critical component supplier reports a delivery delay, the procurement team should assess available inventory and identify customer orders that may be affected.

Approved alternative suppliers may be evaluated as a recovery option. Procurement staff must verify supplier availability, capacity, cost, and lead time before committing to an order.

Managers should prioritize customer orders according to delivery commitments and documented business priorities. Any proposed production changes should be reviewed by the responsible operations team.`,
        });

        console.log("Document ingestion successful.");
        console.log(result);
    } catch (error) {
        console.error("Document ingestion failed:", error.message);
    }
}

testIngestion();
