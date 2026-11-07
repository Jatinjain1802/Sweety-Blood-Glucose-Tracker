const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { newDb } = require("pg-mem");

function createPool() {
  if (process.env.NODE_ENV === "test" || process.env.USE_PG_MEM === "true") {
    const memDb = newDb();
    const { Pool: MemPool } = memDb.adapters.createPg();
    return new MemPool();
  }

  return new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "sweety",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });
}

const pool = createPool();
const schemaSql = fs.readFileSync(
  path.join(__dirname, "..", "db", "schema.sql"),
  "utf8",
);

async function query(text, params) {
  return pool.query(text, params);
}

async function initializeDatabase() {
  await query(schemaSql);
}

async function close() {
  if (pool && typeof pool.end === "function") {
    await pool.end();
  }
}

module.exports = { pool, query, close, initializeDatabase };
