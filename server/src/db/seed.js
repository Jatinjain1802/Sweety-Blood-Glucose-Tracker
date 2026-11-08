const bcrypt = require("bcryptjs");
const { pool, initializeDatabase } = require("../config/db");

const DEMO_EMAIL = "demo@sweety.com";
const DEMO_PASSWORD = "Demo@123";
const DEMO_DOCTOR_EMAIL = "doctor@sweety.com";
const DEMO_DOCTOR_PASSWORD = "Doctor@123";

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function seedDatabase() {
  await initializeDatabase();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Remove the previous demo accounts so the script can be rerun.
    await client.query("DELETE FROM users WHERE email IN ($1, $2)", [
      DEMO_EMAIL,
      DEMO_DOCTOR_EMAIL,
    ]);

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const doctorPasswordHash = await bcrypt.hash(DEMO_DOCTOR_PASSWORD, 10);

    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'patient')
       RETURNING id`,
      ["Demo Patient", DEMO_EMAIL, passwordHash],
    );

    const doctorResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'doctor')
       RETURNING id`,
      ["Dr. Ananya Roy", DEMO_DOCTOR_EMAIL, doctorPasswordHash],
    );

    const userId = userResult.rows[0].id;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const readings = [
      [formatDate(yesterday), "Morning fasting", 95],
      [formatDate(yesterday), "After breakfast", 135],
      [formatDate(yesterday), "After lunch", 145],
      [formatDate(yesterday), "After dinner", 125],

      [formatDate(today), "Morning fasting", 90],
      [formatDate(today), "After breakfast", 130],
      [formatDate(today), "After lunch", 140],
      [formatDate(today), "After dinner", 120],
    ];

    for (const [date, slot, value] of readings) {
      await client.query(
        `INSERT INTO readings (user_id, date, slot, value)
         VALUES ($1, $2, $3, $4)`,
        [userId, date, slot, value],
      );
    }

    await client.query("COMMIT");

    console.log("Database seeded successfully!");
    console.log("Demo Patient email:", DEMO_EMAIL);
    console.log("Demo Patient password:", DEMO_PASSWORD);
    console.log("Demo Doctor email:", DEMO_DOCTOR_EMAIL);
    console.log("Demo Doctor password:", DEMO_DOCTOR_PASSWORD);
    console.log("Sample readings created:", readings.length);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
