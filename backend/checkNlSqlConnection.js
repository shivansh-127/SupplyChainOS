const pool = require("./src/nlSqlDb");

async function main() {
    const result = await pool.query(`
        SELECT current_user AS database_user,
               current_database() AS database_name
    `);

    console.log(result.rows[0]);
    await pool.end();
}

main().catch(console.error);