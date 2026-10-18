
require("dotenv").config();

const { ingestDocument } = require("./services/documentIngestionService");

const documents = [
    {
        title: "Demo Supplier Delay Policy",
        source: "demo/supplier-delay-policy.txt",
        text: `Supplier Delay Response Policy

When a critical component supplier reports a delivery delay, the procurement team should assess available inventory and identify customer orders that may be affected.

Approved alternative suppliers may be evaluated as a recovery option. Procurement staff must verify supplier availability, capacity, cost, and lead time before committing to an order.

Managers should prioritize customer orders according to delivery commitments and documented business priorities. Proposed production changes should be reviewed by the responsible operations team.`,
    },
    {
        title: "Demo Inventory Management Policy",
        source: "demo/inventory-management-policy.txt",
        text: `Inventory Management Policy

Inventory teams should monitor available stock for critical components and compare it with expected demand.

When available inventory may not cover expected demand during a supply interruption, the team should identify potentially affected orders and escalate the risk to the responsible operations manager.

Stock records should be checked before making replenishment or production decisions.`,
    },
    {
        title: "Demo Alternative Supplier Procedure",
        source: "demo/alternative-supplier-procedure.txt",
        text: `Alternative Supplier Approval Procedure

Procurement may evaluate approved alternative suppliers when the primary supplier cannot meet delivery requirements.

Before committing to an alternative supplier, procurement staff must verify availability, production capacity, cost, and lead time.

Supplier qualification and purchasing decisions must follow the applicable approval process.`,
    },
];

async function testMultiIngestion() {
    try {
        for (const document of documents) {
            const result = await ingestDocument(document);
            console.log("\nIngestion result:");
            console.log(result);
        }

        console.log("\nAll demo documents processed successfully.");
    } catch (error) {
        console.error("Multi-document ingestion failed:", error.message);
    }
}

testMultiIngestion();
