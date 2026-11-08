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
  // const nextIdResult = await query(
  //   "SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM users",
  // );
  // const userId = Number(nextIdResult.rows[0].next_id);

  const result = await query(
    `INSERT INTO users (name, email, password_hash)
   VALUES ($1, $2, $3)
   RETURNING id, name, email`,
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

const { authMiddleware } = require("../middleware/auth");

/**
 * GET /api/auth/profile
 * Returns authenticated user details and summary stats
 */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userResult = await query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [req.user.id],
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const readingsCountResult = await query(
      "SELECT COUNT(*) AS count FROM readings WHERE user_id = $1",
      [req.user.id],
    );
    const totalReadings = Number(readingsCountResult.rows[0]?.count || 0);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        totalReadings,
      },
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return res.status(500).json({ error: "Unable to load profile." });
  }
});

/**
 * PUT /api/auth/profile
 * Updates display name and optionally password
 */
router.put("/profile", authMiddleware, async (req, res) => {
  const { name, currentPassword, newPassword } = req.body || {};

  try {
    const userResult = await query(
      "SELECT id, name, email, password_hash, created_at FROM users WHERE id = $1",
      [req.user.id],
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    let updatedName = user.name;
    if (name && String(name).trim().length >= 2) {
      updatedName = String(name).trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ error: "Current password is required to change password." });
      }
      const matches = await bcrypt.compare(
        String(currentPassword),
        user.password_hash,
      );
      if (!matches) {
        return res
          .status(400)
          .json({ error: "Current password is incorrect." });
      }
      if (String(newPassword).length < 6) {
        return res
          .status(400)
          .json({ error: "New password must be at least 6 characters long." });
      }
      const newHash = await bcrypt.hash(String(newPassword), 10);
      await query(
        "UPDATE users SET name = $1, password_hash = $2 WHERE id = $3",
        [updatedName, newHash, user.id],
      );
    } else {
      await query("UPDATE users SET name = $1 WHERE id = $2", [
        updatedName,
        user.id,
      ]);
    }

    return res.json({
      message: "Profile updated successfully.",
      user: {
        id: user.id,
        name: updatedName,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ error: "Unable to update profile." });
  }
});

module.exports = router;
