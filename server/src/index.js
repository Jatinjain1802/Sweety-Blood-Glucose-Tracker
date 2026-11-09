// const app = require("./app");
// const { query, initializeDatabase } = require("./config/db");
// const { insertSampleData } = require("./db/sampleData");

// async function ensureSeedData() {
//   try {
//     const res = await query(
//       "SELECT COUNT(*) AS count FROM users WHERE email = 'demo@sweety.com'",
//     );
//     const demoExists = Number(res.rows[0]?.count || 0) > 0;

//     if (!demoExists) {
//       console.log(
//         "ℹ️  Demo dataset not detected. Auto-seeding initial patient and doctors...",
//       );
//       // IMPORTANT: Pass closePool: false so the active connection pool stays open for Express!
//       await insertSampleData({ closePool: false });
//     }
//   } catch (err) {
//     console.warn(
//       "⚠️  Auto-seed check encountered an issue (continuing startup):",
//       err.message,
//     );
//   }
// }

// async function startServer() {
//   try {
//     await query("SELECT 1");
//     await initializeDatabase();
//     await ensureSeedData();

//     const port = Number(process.env.PORT || 5000);
//     app.listen(port, () => {
//       console.log(`🌸 Sweety API running at http://localhost:${port}`);
//     });
//   } catch (error) {
//     console.error("❌ Unable to start the server:", error);
//     process.exit(1);
//   }
// }

// startServer();
const app = require("./app");
const { query, initializeDatabase } = require("./config/db");
const { insertSampleData } = require("./db/sampleData");

async function ensureSeedData() {
  try {
    // Seed ONLY when the users table is completely empty (first ever boot).
    // If any account exists - demo or real - we touch nothing, so seeding
    // can never invalidate existing sessions again.
    const res = await query("SELECT COUNT(*) AS count FROM users");
    const isEmpty = Number(res.rows[0]?.count || 0) === 0;

    if (isEmpty) {
      console.log(
        "ℹ️  Empty database detected. Seeding initial demo patient and doctors...",
      );
      // IMPORTANT: Pass closePool: false so the active connection pool stays open for Express!
      await insertSampleData({ closePool: false });
    }
  } catch (err) {
    console.warn(
      "⚠️  Auto-seed check encountered an issue (continuing startup):",
      err.message,
    );
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
