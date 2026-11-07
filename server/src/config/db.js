const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const { Pool, types } = require("pg");

// Keep PostgreSQL DATE values as YYYY-MM-DD strings.

const fs = require("fs");

const databaseUrl = process.env.DATABASE_URL;
types.setTypeParser(1082, (value) => value);
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Check the .env file in your server folder.",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: false,
});

const schemaSql = fs.readFileSync(
  path.join(__dirname, "..", "db", "schema.sql"),
  "utf8",
);

async function query(text, params) {
  return pool.query(text, params);
}

async function initializeDatabase() {
  await pool.query(schemaSql);
}

async function close() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  initializeDatabase,
  close,
};
