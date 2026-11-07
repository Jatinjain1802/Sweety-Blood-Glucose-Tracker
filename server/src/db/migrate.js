const fs = require("fs");
const path = require("path");
const { query, close } = require("../config/db");

async function runMigrations() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await query(schema);
  console.log("Database migrated successfully.");
}

runMigrations()
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await close();
  });
