
const { Pool } = require("pg");
require("dotenv").config();

const nlSqlPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.NL_SQL_DB_USER,
    password: process.env.NL_SQL_DB_PASSWORD,
    connectionTimeoutMillis: 5000,
    query_timeout: 6000,
    application_name: "SupplyChainOS_NL_SQL",
});

nlSqlPool.on("error", (err) => {
    console.error("NL-to-SQL database pool error:", err.message);
});

module.exports = nlSqlPool;
