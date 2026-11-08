const bcrypt = require("bcryptjs");
const { pool, initializeDatabase } = require("../config/db");

/**
 * ============================================================================
 * 🌸 SWEETY — COMPREHENSIVE SAMPLE DATA & DOCTORS GENERATOR
 * ============================================================================
 *
 * 🎓 Node.js, PostgreSQL & Database Concepts Explained:
 *
 * 1. CLI vs. Module Import Detection (`require.main === module`):
 *    - In Node.js, `require.main` points to the entry-point file that was executed.
 *    - If `require.main === module`, it means this file was run directly from the
 *      command line: `node src/db/sampleData.js`. In that case, we should close
 *      the database connection pool (`pool.end()`) when finished.
 *    - If imported via `const { insertSampleData } = require(...)`, it was called
 *      by the server on startup. In that case, closing the pool would crash the
 *      running server! The `{ closePool = true }` option controls this behavior.
 *
 * 2. ACID Transactions (`BEGIN`, `COMMIT`, `ROLLBACK`):
 *    - Seeding inserts users, hundreds of readings, and doctor-patient requests.
 *    - Wrapping everything in a transaction guarantees that if any step fails,
 *      the database is cleanly rolled back with no partial or corrupted records.
 *
 * 3. Idempotent Seeding:
 *    - Removes previous demo accounts before re-inserting, allowing this script
 *      to be run repeatedly without primary-key or unique-constraint collisions.
 * ============================================================================
 */

const DEMO_PATIENT = {
  name: "Demo Patient",
  email: "demo@sweety.com",
  password: "Demo@123",
  role: "patient",
};

const DEMO_DOCTORS = [
  {
    name: "Dr. Ananya Roy",
    email: "doctor@sweety.com",
    password: "Doctor@123",
    role: "doctor",
    specialty: "Endocrinology",
  },
  {
    name: "Dr. Arjun Mehta",
    email: "dr.arjun@sweety.com",
    password: "Doctor@123",
    role: "doctor",
    specialty: "Diabetology",
  },
  {
    name: "Dr. Priya Sharma",
    email: "dr.priya@sweety.com",
    password: "Doctor@123",
    role: "doctor",
    specialty: "Internal Medicine",
  },
  {
    name: "Dr. Rajesh Gupta",
    email: "dr.rajesh@sweety.com",
    password: "Doctor@123",
    role: "doctor",
    specialty: "General Physician",
  },
];

const slots = [
  "Morning fasting",
  "After breakfast",
  "After lunch",
  "After dinner",
];

function generateValue(day, slotIndex) {
  // Realistic clinical variations between 75 and 185 mg/dL
  const base = 85 + ((day * 7 + slotIndex * 19) % 65);
  const variation = ((day + slotIndex * 11) % 17) - 8;
  return Math.min(600, Math.max(40, base + variation));
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateDates() {
  const dates = [];
  const now = new Date();

  // Generate 60 days of continuous historical readings up to today
  const start = new Date(now);
  start.setDate(start.getDate() - 60);

  for (
    const current = new Date(start);
    current <= now;
    current.setDate(current.getDate() + 1)
  ) {
    dates.push(formatDate(current));
  }

  return dates;
}

async function insertSampleData({ closePool = true } = {}) {
  // Ensure tables and migrations exist before seeding
  await initializeDatabase();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const allEmails = [
      DEMO_PATIENT.email,
      ...DEMO_DOCTORS.map((d) => d.email),
    ];

    // 1. Remove previous demo accounts so seeding is idempotent
    await client.query(
      "DELETE FROM users WHERE email = ANY($1::text[])",
      [allEmails],
    );

    // 2. Insert Demo Patient
    const patientHash = await bcrypt.hash(DEMO_PATIENT.password, 10);
    const patientResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        DEMO_PATIENT.name,
        DEMO_PATIENT.email,
        patientHash,
        DEMO_PATIENT.role,
      ],
    );
    const patientId = patientResult.rows[0].id;

    // 3. Insert Demo Doctors
    const doctorIds = {};
    for (const doc of DEMO_DOCTORS) {
      const docHash = await bcrypt.hash(doc.password, 10);
      const docResult = await client.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [doc.name, doc.email, docHash, doc.role],
      );
      doctorIds[doc.email] = docResult.rows[0].id;
    }

    // 4. Insert Comprehensive Blood Glucose Readings for Patient
    const dates = generateDates();
    let readingsCount = 0;

    for (let day = 0; day < dates.length; day++) {
      for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
        const value = generateValue(day, slotIndex);

        await client.query(
          `INSERT INTO readings (user_id, date, slot, value)
           VALUES ($1, $2, $3, $4)`,
          [patientId, dates[day], slots[slotIndex], value],
        );
        readingsCount++;
      }
    }

    // 5. Establish Sample Relationships to demonstrate all feature workflows:
    //    a) Dr. Ananya Roy -> ACCEPTED relationship (immediate full report access)
    //    b) Dr. Arjun Mehta -> PENDING relationship (incoming request with summary)
    //    c) Dr. Priya Sharma & Dr. Rajesh Gupta -> AVAILABLE (for testing search & request)

    const ananyaId = doctorIds["doctor@sweety.com"];
    if (ananyaId) {
      await client.query(
        `INSERT INTO doctor_patient_requests (doctor_id, patient_id, status, requested_at, responded_at)
         VALUES ($1, $2, 'accepted', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days')`,
        [ananyaId, patientId],
      );
    }

    const arjunId = doctorIds["dr.arjun@sweety.com"];
    if (arjunId) {
      await client.query(
        `INSERT INTO doctor_patient_requests (doctor_id, patient_id, status, requested_at)
         VALUES ($1, $2, 'pending', NOW() - INTERVAL '4 hours')`,
        [arjunId, patientId],
      );
    }

    await client.query("COMMIT");

    console.log("==================================================");
    console.log("🌸 Sweety Demo Dataset Seeded Successfully!");
    console.log("==================================================");
    console.log("👤 Demo Patient Account:");
    console.log(`   Email:    ${DEMO_PATIENT.email}`);
    console.log(`   Password: ${DEMO_PATIENT.password}`);
    console.log(`   Readings: ${readingsCount} historical records`);
    console.log("--------------------------------------------------");
    console.log("🩺 Demo Doctor Accounts (Password: Doctor@123):");
    console.log("   1. Dr. Ananya Roy    (doctor@sweety.com)   -> Status: ACCEPTED");
    console.log("   2. Dr. Arjun Mehta   (dr.arjun@sweety.com)  -> Status: PENDING REQUEST");
    console.log("   3. Dr. Priya Sharma  (dr.priya@sweety.com)  -> Status: AVAILABLE");
    console.log("   4. Dr. Rajesh Gupta  (dr.rajesh@sweety.com) -> Status: AVAILABLE");
    console.log("==================================================");

    return { patientId, doctorIds, readingsCount };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Sample data insertion failed:", error);
    throw error;
  } finally {
    client.release();
    if (closePool) {
      await pool.end();
    }
  }
}

// If run directly from the command line: node src/db/sampleData.js
if (require.main === module) {
  insertSampleData({ closePool: true })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  insertSampleData,
  DEMO_PATIENT,
  DEMO_DOCTORS,
};
