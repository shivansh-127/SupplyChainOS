const { validateSql } = require("../nlSqlService");

describe("validateSql", () => {
    test("accepts a basic SELECT query", () => {
        expect(validateSql("SELECT id FROM suppliers"))
            .toBe("SELECT id FROM suppliers");
    });

    test("accepts a read-only CTE", () => {
        expect(
            validateSql("WITH active AS (SELECT id FROM suppliers) SELECT id FROM active")
        ).toContain("WITH");
    });

    test.each([
        "DELETE FROM inventory",
        "UPDATE inventory SET quantity = 0",
        "DROP TABLE suppliers",
        "SELECT * FROM suppliers; SELECT * FROM components",
        "SELECT * FROM suppliers FOR UPDATE",
    ])("rejects unsafe SQL: %s", (sql) => {
        expect(() => validateSql(sql)).toThrow();
    });
});