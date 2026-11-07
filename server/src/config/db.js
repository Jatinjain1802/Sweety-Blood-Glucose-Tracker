const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const { Pool } = require("pg");
const fs = require("fs");

const databaseUrl = process.env.DATABASE_URL;

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
