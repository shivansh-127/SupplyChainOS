const express = require("express");
const cors = require("cors");

const pool = require("./db");
const supplierRoutes = require("./routes/supplierRoutes");
const disruptionRoutes = require("./routes/disruptionRoutes");
const knowledgeRoutes = require("./routes/knowledgeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/suppliers", supplierRoutes);
app.use("/api/disruptions", disruptionRoutes);

app.use("/api/knowledge", knowledgeRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "SupplyChainOS backend is running"
    });
});

app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "Database connected successfully",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});