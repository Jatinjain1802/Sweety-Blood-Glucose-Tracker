const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../config/db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

/**
 * signToken
 * ---------
 * Creates a signed JWT for the given user.
 *
 * 🎓 JWT (JSON Web Token) is a compact, URL-safe way to represent claims.
 *    Structure: header.payload.signature
 *    - `sub` (subject) is the standard claim for the user's ID.
 *    - We also store `email` and `role` for quick front-end reads,
 *      but ALWAYS re-verify roles from the DB in middleware (never trust the JWT alone).
 */
function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" },
  );
}

/**
 * POST /api/auth/signup
 * Creates a new PATIENT account.
 * Role is always forced to 'patient' — users cannot self-assign doctor role.
 */
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

  // Role is ALWAYS 'patient' — no matter what the client sends
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'patient')
     RETURNING id, name, email, role`,
    [String(name).trim(), normalizedEmail, passwordHash],
  );

  const user = result.rows[0];
  const token = signToken(user);

  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  });
});

/**
 * POST /api/auth/doctor-signup
 * Creates a new DOCTOR account.
 *
 * 🎓 Security Pattern — Server-Side Secret Gate:
 *    Instead of allowing any user to pick "doctor" on signup, this endpoint
 *    requires a secret passphrase set in the server environment (.env).
 *    This secret should be shared only with verified healthcare professionals
 *    via a secure out-of-band channel (not stored in the client app).
 *
 *    DOCTOR_SIGNUP_SECRET must be set in server/.env
 */
router.post("/doctor-signup", async (req, res) => {
  const { name, email, password, doctorSecret } = req.body || {};

  const serverSecret = process.env.DOCTOR_SIGNUP_SECRET;

  // If no secret is configured, doctor signup is disabled entirely
  if (!serverSecret) {
    return res.status(403).json({
      error:
        "Doctor registration is not available. Contact the system administrator.",
    });
  }

  if (!doctorSecret || doctorSecret !== serverSecret) {
    return res.status(403).json({
      error:
        "Invalid doctor registration code. Contact the system administrator.",
    });
  }

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
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'doctor')
     RETURNING id, name, email, role`,
    [String(name).trim(), normalizedEmail, passwordHash],
  );

  const user = result.rows[0];
  const token = signToken(user);

  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  });
});

/**
 * POST /api/auth/login
 * Works for both patients and doctors — role is returned in the response.
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const userResult = await query(
    "SELECT id, name, email, password_hash, role FROM users WHERE email = $1",
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
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  });
});

/**
 * GET /api/auth/profile
 * Returns authenticated user details and summary stats.
 */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userResult = await query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
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
        role: user.role,
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
 * Updates display name and optionally password.
 * Role cannot be changed through this endpoint.
 */
router.put("/profile", authMiddleware, async (req, res) => {
  // Destructure — intentionally exclude `role` to prevent self-promotion
  const { name, currentPassword, newPassword } = req.body || {};

  try {
    const userResult = await query(
      "SELECT id, name, email, password_hash, role, created_at FROM users WHERE id = $1",
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
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ error: "Unable to update profile." });
  }
});

module.exports = router;
