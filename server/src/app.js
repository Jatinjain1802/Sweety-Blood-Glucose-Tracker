const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const authRoutes = require("./routes/auth");
const readingsRoutes = require("./routes/readings");
const reportsRoutes = require("./routes/reports");
const { authMiddleware } = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/readings", authMiddleware, readingsRoutes);
app.use("/api/reports", authMiddleware, reportsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

module.exports = app;
