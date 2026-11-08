const jwt = require("jsonwebtoken");
const { query } = require("../config/db");

/**
 * authMiddleware
 * --------------
 * Validates the Bearer JWT from the Authorization header.
 * Attaches the full user object (including `role`) to `req.user`.
 *
 * 🎓 Why do we fetch the role from the DB on every request?
 *    If we only stored the role inside the JWT, an admin could
 *    change a user's role but the JWT would still grant old access
 *    until it expires (up to 7 days). Fetching from the DB ensures
 *    role changes take effect immediately on the next request.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    // Always fetch role from DB — not from token — for immediate role revocation
    const userResult = await query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [decoded.sub],
    );

    if (!userResult.rows[0]) {
      return res.status(401).json({ error: "User not found." });
    }

    req.user = userResult.rows[0];
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

/**
 * requireRole
 * -----------
 * Middleware factory that restricts an endpoint to specific user roles.
 *
 * Usage:
 *   router.get("/doctor-only", authMiddleware, requireRole("doctor"), handler)
 *
 * 🎓 This is a "higher-order function" — a function that returns another function.
 *    The returned function is itself middleware (takes req, res, next).
 *    The `...roles` syntax collects multiple arguments into an array,
 *    so you can do requireRole("doctor", "admin") in the future.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. This endpoint requires role: ${roles.join(" or ")}.`,
      });
    }
    return next();
  };
}

module.exports = { authMiddleware, requireRole };
