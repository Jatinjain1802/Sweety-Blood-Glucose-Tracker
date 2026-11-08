const express = require("express");
const { query } = require("../config/db");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// All routes in this file require role = 'patient'
router.use(requireRole("patient"));

// ===========================================================================
// GET /api/patient/doctors?search=
// List all registered doctors; optionally filter by name or email
// ===========================================================================
router.get("/doctors", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

    let result;
    if (search) {
      // 🎓 $1 || '%' creates a LIKE pattern dynamically
      //    ILIKE = case-insensitive LIKE in PostgreSQL
      result = await query(
        `SELECT id, name, email
         FROM users
         WHERE role = 'doctor'
           AND (name ILIKE $1 OR email ILIKE $1)
         ORDER BY name ASC`,
        [`%${search}%`],
      );
    } else {
      result = await query(
        `SELECT id, name, email
         FROM users
         WHERE role = 'doctor'
         ORDER BY name ASC`,
      );
    }

    // For each doctor, also fetch the current patient's request status (if any)
    const doctors = await Promise.all(
      result.rows.map(async (doctor) => {
        const requestResult = await query(
          `SELECT id, status, requested_at
           FROM doctor_patient_requests
           WHERE doctor_id = $1 AND patient_id = $2
           ORDER BY requested_at DESC
           LIMIT 1`,
          [doctor.id, req.user.id],
        );
        const existingRequest = requestResult.rows[0] || null;

        return {
          id: doctor.id,
          name: doctor.name,
          email: doctor.email,
          existingRequest: existingRequest
            ? {
                id: existingRequest.id,
                status: existingRequest.status,
                requestedAt: existingRequest.requested_at,
              }
            : null,
        };
      }),
    );

    return res.json({ doctors });
  } catch (err) {
    console.error("Error fetching doctors:", err);
    return res.status(500).json({ error: "Unable to load doctors." });
  }
});

// ===========================================================================
// POST /api/patient/doctors/:doctorId/request
// Send an access request to a doctor
// ===========================================================================
router.post("/doctors/:doctorId/request", async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId);
    if (!Number.isInteger(doctorId) || doctorId < 1) {
      return res.status(400).json({ error: "Invalid doctor ID." });
    }

    // Verify target is actually a doctor
    const doctorResult = await query(
      "SELECT id, name FROM users WHERE id = $1 AND role = 'doctor'",
      [doctorId],
    );
    if (!doctorResult.rows[0]) {
      return res.status(404).json({ error: "Doctor not found." });
    }

    // A patient cannot send a request to themselves (edge case safety)
    if (doctorId === req.user.id) {
      return res
        .status(400)
        .json({ error: "You cannot send a request to yourself." });
    }

    // Check for existing active/pending request
    const existingResult = await query(
      `SELECT id, status FROM doctor_patient_requests
       WHERE doctor_id = $1 AND patient_id = $2 AND status IN ('pending', 'accepted')`,
      [doctorId, req.user.id],
    );

    if (existingResult.rows[0]) {
      const existing = existingResult.rows[0];
      return res.status(400).json({
        error:
          existing.status === "pending"
            ? "You already have a pending request with this doctor."
            : "This doctor already has access to your records.",
      });
    }

    const result = await query(
      `INSERT INTO doctor_patient_requests (doctor_id, patient_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [doctorId, req.user.id],
    );

    return res.status(201).json({
      message: `Access request sent to Dr. ${doctorResult.rows[0].name}.`,
      request: result.rows[0],
    });
  } catch (err) {
    console.error("Error sending request:", err);
    return res.status(500).json({ error: "Unable to send request." });
  }
});

// ===========================================================================
// GET /api/patient/requests
// List all outgoing requests from this patient
// ===========================================================================
router.get("/requests", async (req, res) => {
  try {
    const result = await query(
      `SELECT
         r.id,
         r.doctor_id,
         r.status,
         r.requested_at,
         r.responded_at,
         u.name   AS doctor_name,
         u.email  AS doctor_email
       FROM doctor_patient_requests r
       JOIN users u ON u.id = r.doctor_id
       WHERE r.patient_id = $1
       ORDER BY r.requested_at DESC`,
      [req.user.id],
    );

    const requests = result.rows.map((row) => ({
      id: row.id,
      doctorId: row.doctor_id,
      doctorName: row.doctor_name,
      doctorEmail: row.doctor_email,
      status: row.status,
      requestedAt: row.requested_at,
      respondedAt: row.responded_at,
    }));

    return res.json({ requests });
  } catch (err) {
    console.error("Error fetching patient requests:", err);
    return res.status(500).json({ error: "Unable to load your requests." });
  }
});

// ===========================================================================
// DELETE /api/patient/requests/:id
// Cancel a PENDING request
// ===========================================================================
router.delete("/requests/:id", async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isInteger(requestId) || requestId < 1) {
      return res.status(400).json({ error: "Invalid request ID." });
    }

    // Verify this request belongs to this patient
    const existing = await query(
      `SELECT id, status FROM doctor_patient_requests
       WHERE id = $1 AND patient_id = $2`,
      [requestId, req.user.id],
    );

    if (!existing.rows[0]) {
      return res.status(404).json({ error: "Request not found." });
    }

    if (existing.rows[0].status !== "pending") {
      return res.status(400).json({
        error: "Only pending requests can be cancelled.",
      });
    }

    await query(
      "DELETE FROM doctor_patient_requests WHERE id = $1 AND patient_id = $2",
      [requestId, req.user.id],
    );

    return res.json({ message: "Request cancelled." });
  } catch (err) {
    console.error("Error cancelling request:", err);
    return res.status(500).json({ error: "Unable to cancel request." });
  }
});

// ===========================================================================
// GET /api/patient/authorized-doctors
// Doctors who currently have accepted access to this patient's data
// ===========================================================================
router.get("/authorized-doctors", async (req, res) => {
  try {
    const result = await query(
      `SELECT
         r.id          AS request_id,
         r.doctor_id,
         r.responded_at,
         u.name   AS doctor_name,
         u.email  AS doctor_email
       FROM doctor_patient_requests r
       JOIN users u ON u.id = r.doctor_id
       WHERE r.patient_id = $1 AND r.status = 'accepted'
       ORDER BY r.responded_at DESC`,
      [req.user.id],
    );

    const doctors = result.rows.map((row) => ({
      requestId: row.request_id,
      doctorId: row.doctor_id,
      doctorName: row.doctor_name,
      doctorEmail: row.doctor_email,
      accessGrantedAt: row.responded_at,
    }));

    return res.json({ doctors });
  } catch (err) {
    console.error("Error fetching authorized doctors:", err);
    return res.status(500).json({ error: "Unable to load authorized doctors." });
  }
});

// ===========================================================================
// DELETE /api/patient/authorized-doctors/:requestId
// Revoke an accepted doctor's access immediately
// ===========================================================================
router.delete("/authorized-doctors/:requestId", async (req, res) => {
  try {
    const requestId = Number(req.params.requestId);
    if (!Number.isInteger(requestId) || requestId < 1) {
      return res.status(400).json({ error: "Invalid request ID." });
    }

    // Verify this request belongs to this patient and is accepted
    const existing = await query(
      `SELECT id, doctor_id, status FROM doctor_patient_requests
       WHERE id = $1 AND patient_id = $2`,
      [requestId, req.user.id],
    );

    if (!existing.rows[0]) {
      return res.status(404).json({ error: "Authorization record not found." });
    }

    if (existing.rows[0].status !== "accepted") {
      return res.status(400).json({
        error: "Only accepted access records can be revoked.",
      });
    }

    // 🎓 We update status to 'revoked' instead of deleting the row.
    //    This keeps an audit trail of past access relationships,
    //    and the doctor's next API call will fail the authorization check.
    await query(
      `UPDATE doctor_patient_requests
       SET status = 'revoked', updated_at = NOW()
       WHERE id = $1 AND patient_id = $2`,
      [requestId, req.user.id],
    );

    return res.json({
      message: "Doctor's access has been revoked. They can no longer view your records.",
    });
  } catch (err) {
    console.error("Error revoking access:", err);
    return res.status(500).json({ error: "Unable to revoke access." });
  }
});

module.exports = router;

