const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../config/db");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET || "dev-secret",
    {
      expiresIn: "7d",
    },
  );
}

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ error: "Please enter a valid name." });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res
      .status(400)
      .json({ error: "Please enter a valid email address." });
  }

  if (!password || String(password).length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = await query("SELECT id FROM users WHERE email = $1", [
    normalizedEmail,
  ]);

  if (existingUser.rows[0]) {
    return res
      .status(400)
      .json({ error: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
    [String(name).trim(), normalizedEmail, passwordHash],
  );

  const user = result.rows[0];
  const token = signToken(user);

  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email },
    token,
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const userResult = await query(
    "SELECT id, name, email, password_hash FROM users WHERE email = $1",
    [normalizedEmail],
  );
  const user = userResult.rows[0];

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const passwordMatches = await bcrypt.compare(
    String(password),
    user.password_hash,
  );

  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signToken(user);

  return res.json({
    user: { id: user.id, name: user.name, email: user.email },
    token,
  });
});

module.exports = router;
