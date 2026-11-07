const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

const DEMO_EMAIL = "demo@sweety.com";
const DEMO_PASSWORD = "Demo@123";

const slots = [
  "Morning fasting",
  "After breakfast",
  "After lunch",
  "After dinner",
];

function generateValue(day, slotIndex) {
  // Generate realistic, repeatable sample values.
  const base = 85 + ((day * 7 + slotIndex * 19) % 65);
  const variation = ((day + slotIndex * 11) % 17) - 8;

  return Math.min(600, Math.max(40, base + variation));
}

function generateDates() {
  const dates = [];
  const start = new Date("2026-06-01T00:00:00Z");
  const end = new Date("2026-11-07T00:00:00Z");

  for (
    const current = new Date(start);
    current <= end;
    current.setUTCDate(current.getUTCDate() + 1)
  ) {
    dates.push(current.toISOString().slice(0, 10));
  }

  return dates;
}

async function insertSampleData() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Remove only the previous demo account and its readings.
    await client.query("DELETE FROM users WHERE email = $1", [DEMO_EMAIL]);

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      ["Demo User", DEMO_EMAIL, passwordHash],
    );

    const userId = userResult.rows[0].id;
    const dates = generateDates();

    let insertedCount = 0;

    for (let day = 0; day < dates.length; day++) {
      for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
        const value = generateValue(day, slotIndex);

        await client.query(
          `INSERT INTO readings (user_id, date, slot, value)
           VALUES ($1, $2, $3, $4)`,
          [userId, dates[day], slots[slotIndex], value],
        );

        insertedCount++;
      }
    }

    await client.query("COMMIT");

    console.log("Sample data inserted successfully!");
    console.log("Demo email:", DEMO_EMAIL);
    console.log("Demo password:", DEMO_PASSWORD);
    console.log("Date range: June 1 - November 7, 2026");
    console.log("Total readings:", insertedCount);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Sample data insertion failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

insertSampleData();
