const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/auth");
const readingsRoutes = require("./routes/readings");
const reportsRoutes = require("./routes/reports");
const doctorRoutes = require("./routes/doctor");
const patientRoutes = require("./routes/patient");
const { authMiddleware } = require("./middleware/auth");
const { initializeDatabase } = require("./config/db");

const app = express();

initializeDatabase().catch((error) => {
  console.error("Database initialization failed:", error);
});

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

// Protected routes — authMiddleware verifies JWT and attaches req.user (with role)
app.use("/api/readings", authMiddleware, readingsRoutes);
app.use("/api/reports", authMiddleware, reportsRoutes);

// Role-restricted routes — requireRole check is applied inside each router
app.use("/api/doctor", authMiddleware, doctorRoutes);
app.use("/api/patient", authMiddleware, patientRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

module.exports = app;
