const app = require("./app");
const { query, initializeDatabase } = require("./config/db");
const { insertSampleData } = require("./db/sampleData");

/**
 * ============================================================================
 * 🌸 SWEETY — SERVER BOOTSTRAP & AUTO-SEED INITIALIZATION
 * ============================================================================
 *
 * 🎓 Learning Concepts Explained:
 *
 * 1. Lifecycle Orchestration on Server Boot:
 *    - Before accepting incoming client traffic via `app.listen()`, we ensure:
 *      a) PostgreSQL connection is verified (`SELECT 1`).
 *      b) Schema and migrations are up to date (`initializeDatabase()`).
 *      c) Essential seed/dummy data exists (`ensureSeedData()`).
 *
 * 2. Non-Destructive Auto-Seeding:
 *    - Instead of blindly wiping data on every server restart (which would delete
 *      real readings or user tests), we query for the demo user:
 *      `SELECT COUNT(*) FROM users WHERE email = 'demo@sweety.com'`.
 *    - If missing, we populate the demo patient, historical readings, and dummy
 *      doctors automatically.
 *    - If already present, server starts immediately without unnecessary I/O!
 * ============================================================================
 */

async function ensureSeedData() {
  try {
    const res = await query(
      "SELECT COUNT(*) AS count FROM users WHERE email = 'demo@sweety.com'",
    );
    const demoExists = Number(res.rows[0]?.count || 0) > 0;

    if (!demoExists) {
      console.log("ℹ️  Demo dataset not detected. Auto-seeding initial patient and doctors...");
      // IMPORTANT: Pass closePool: false so the active connection pool stays open for Express!
      await insertSampleData({ closePool: false });
    }
  } catch (err) {
    console.warn("⚠️  Auto-seed check encountered an issue (continuing startup):", err.message);
  }
}

async function startServer() {
  try {
    await query("SELECT 1");
    await initializeDatabase();
    await ensureSeedData();

    const port = Number(process.env.PORT || 5000);
    app.listen(port, () => {
      console.log(`🌸 Sweety API running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ Unable to start the server:", error);
    process.exit(1);
  }
}

startServer();
