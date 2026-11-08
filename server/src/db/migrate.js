const fs = require("fs");
const path = require("path");
const { query, close } = require("../config/db");

async function runMigrations() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await query(schema);
  const doctorPatientMigration = fs.readFileSync(
    path.join(__dirname, "migration_doctor_patient.sql"),
    "utf8",
  );
  await query(doctorPatientMigration);
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
