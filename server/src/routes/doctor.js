const express = require("express");
const { query } = require("../config/db");
const { requireRole } = require("../middleware/auth");
const {
  buildSummary,
  getDateRangeForPeriod,
  formatDateLabel,
  toLocalDateString,
} = require("../utils/dateUtils");

const router = express.Router();

// All routes in this file require role = 'doctor'
// The authMiddleware is already applied in app.js before mounting this router.
// requireRole adds the ROLE check on top.
router.use(requireRole("doctor"));

// ---------------------------------------------------------------------------
// Helper: build a "limited summary" of a patient's glucose history
// This is what a doctor sees BEFORE accepting a request (pending state)
// ---------------------------------------------------------------------------
async function buildPatientSummary(patientId) {
  const result = await query(
    `SELECT
       COUNT(*)                        AS total_readings,
       ROUND(AVG(value)::numeric, 1)   AS average_glucose,
       MAX(value)                      AS highest_glucose,
       MIN(value)                      AS lowest_glucose,
       MIN(date)                       AS first_reading_date,
       MAX(date)                       AS latest_reading_date
     FROM readings
     WHERE user_id = $1`,
    [patientId],
  );
  return result.rows[0];
}

// ---------------------------------------------------------------------------
// Helper: fetch range report for a specific patient (used by doctor)
// ---------------------------------------------------------------------------
async function fetchRangeReportForPatient(patientId, dateString, period) {
  const range = getDateRangeForPeriod(dateString, period);
  const start = toLocalDateString(range.start);
  const end = toLocalDateString(range.end);

  const result = await query(
    "SELECT * FROM readings WHERE user_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC, created_at ASC",
    [patientId, start, end],
  );

  const readings = result.rows.map((r) => ({ ...r, value: Number(r.value) }));
  const summary = buildSummary(readings);

  return {
    period,
    selectedDate: dateString,
    displayLabel: range.label || formatDateLabel(dateString),
    range: { start, end },
    summary,
    readings,
  };
}

// ---------------------------------------------------------------------------
// Helper: verify that this doctor has an ACCEPTED relationship with patient
// Returns the request row on success, or null if no accepted relationship.
// ---------------------------------------------------------------------------
async function getAcceptedRelationship(doctorId, patientId) {
  const result = await query(
    `SELECT id FROM doctor_patient_requests
     WHERE doctor_id = $1 AND patient_id = $2 AND status = 'accepted'`,
    [doctorId, patientId],
  );
  return result.rows[0] || null;
}

// ===========================================================================
// GET /api/doctor/patients/requests
// Returns all PENDING requests sent to this doctor, with limited patient info
// ===========================================================================
router.get("/patients/requests", async (req, res) => {
  try {
    const result = await query(
      `SELECT
         r.id,
         r.patient_id,
         r.status,
         r.requested_at,
         u.name   AS patient_name,
         u.email  AS patient_email
       FROM doctor_patient_requests r
       JOIN users u ON u.id = r.patient_id
       WHERE r.doctor_id = $1 AND r.status = 'pending'
       ORDER BY r.requested_at DESC`,
      [req.user.id],
    );

    // Attach limited glucose summary to each pending request
    const requests = await Promise.all(
      result.rows.map(async (row) => {
        const summary = await buildPatientSummary(row.patient_id);
        return {
          id: row.id,
          patientId: row.patient_id,
          patientName: row.patient_name,
          patientEmail: row.patient_email,
          requestedAt: row.requested_at,
          status: row.status,
          // Limited summary only — no individual readings exposed
          patientSummary: {
            totalReadings: Number(summary.total_readings),
            averageGlucose: summary.average_glucose
              ? Number(summary.average_glucose)
              : null,
            highestGlucose: summary.highest_glucose
              ? Number(summary.highest_glucose)
              : null,
            lowestGlucose: summary.lowest_glucose
              ? Number(summary.lowest_glucose)
              : null,
            firstReadingDate: summary.first_reading_date,
            latestReadingDate: summary.latest_reading_date,
          },
        };
      }),
    );

    return res.json({ requests });
  } catch (err) {
    console.error("Error fetching doctor requests:", err);
    return res.status(500).json({ error: "Unable to load patient requests." });
  }
});

// ===========================================================================
// POST /api/doctor/patients/requests/:id/accept
// Doctor accepts a pending request
// ===========================================================================
router.post("/patients/requests/:id/accept", async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isInteger(requestId) || requestId < 1) {
      return res.status(400).json({ error: "Invalid request ID." });
    }

    // Verify this request belongs to this doctor and is still pending
    const existing = await query(
      `SELECT id, patient_id, status FROM doctor_patient_requests
       WHERE id = $1 AND doctor_id = $2`,
      [requestId, req.user.id],
    );

    if (!existing.rows[0]) {
      return res.status(404).json({ error: "Request not found." });
    }

    if (existing.rows[0].status !== "pending") {
      return res
        .status(400)
        .json({ error: `Request is already ${existing.rows[0].status}.` });
    }

    const updated = await query(
      `UPDATE doctor_patient_requests
       SET status = 'accepted', responded_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [requestId],
    );

    return res.json({
      message: "Request accepted. You now have access to this patient's records.",
      request: updated.rows[0],
    });
  } catch (err) {
    console.error("Error accepting request:", err);
    return res.status(500).json({ error: "Unable to accept request." });
  }
});

// ===========================================================================
// POST /api/doctor/patients/requests/:id/reject
// Doctor rejects a pending request
// ===========================================================================
router.post("/patients/requests/:id/reject", async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    if (!Number.isInteger(requestId) || requestId < 1) {
      return res.status(400).json({ error: "Invalid request ID." });
    }

    const existing = await query(
      `SELECT id, status FROM doctor_patient_requests
       WHERE id = $1 AND doctor_id = $2`,
      [requestId, req.user.id],
    );

    if (!existing.rows[0]) {
      return res.status(404).json({ error: "Request not found." });
    }

    if (existing.rows[0].status !== "pending") {
      return res
        .status(400)
        .json({ error: `Request is already ${existing.rows[0].status}.` });
    }

    const updated = await query(
      `UPDATE doctor_patient_requests
       SET status = 'rejected', responded_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [requestId],
    );

    return res.json({
      message: "Request rejected.",
      request: updated.rows[0],
    });
  } catch (err) {
    console.error("Error rejecting request:", err);
    return res.status(500).json({ error: "Unable to reject request." });
  }
});

// ===========================================================================
// GET /api/doctor/patients
// Returns all patients who have an ACCEPTED relationship with this doctor
// ===========================================================================
router.get("/patients", async (req, res) => {
  try {
    const result = await query(
      `SELECT
         r.id          AS request_id,
         r.patient_id,
         r.responded_at,
         u.name        AS patient_name,
         u.email       AS patient_email
       FROM doctor_patient_requests r
       JOIN users u ON u.id = r.patient_id
       WHERE r.doctor_id = $1 AND r.status = 'accepted'
       ORDER BY r.responded_at DESC`,
      [req.user.id],
    );

    const patients = await Promise.all(
      result.rows.map(async (row) => {
        const summary = await buildPatientSummary(row.patient_id);
        return {
          requestId: row.request_id,
          patientId: row.patient_id,
          patientName: row.patient_name,
          patientEmail: row.patient_email,
          accessGrantedAt: row.responded_at,
          summary: {
            totalReadings: Number(summary.total_readings),
            averageGlucose: summary.average_glucose
              ? Number(summary.average_glucose)
              : null,
            highestGlucose: summary.highest_glucose
              ? Number(summary.highest_glucose)
              : null,
            lowestGlucose: summary.lowest_glucose
              ? Number(summary.lowest_glucose)
              : null,
            latestReadingDate: summary.latest_reading_date,
          },
        };
      }),
    );

    return res.json({ patients });
  } catch (err) {
    console.error("Error fetching patients:", err);
    return res.status(500).json({ error: "Unable to load patients." });
  }
});

// ===========================================================================
// GET /api/doctor/patients/:patientId
// Full patient profile overview — only if accepted relationship exists
// ===========================================================================
router.get("/patients/:patientId", async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId) || patientId < 1) {
      return res.status(400).json({ error: "Invalid patient ID." });
    }

    // Authorization: must have accepted relationship
    const relationship = await getAcceptedRelationship(req.user.id, patientId);
    if (!relationship) {
      return res.status(403).json({
        error: "Access denied. No accepted relationship with this patient.",
      });
    }

    const userResult = await query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1 AND role = 'patient'",
      [patientId],
    );
    const patient = userResult.rows[0];
    if (!patient) {
      return res.status(404).json({ error: "Patient not found." });
    }

    const summary = await buildPatientSummary(patientId);

    return res.json({
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        createdAt: patient.created_at,
      },
      summary: {
        totalReadings: Number(summary.total_readings),
        averageGlucose: summary.average_glucose
          ? Number(summary.average_glucose)
          : null,
        highestGlucose: summary.highest_glucose
          ? Number(summary.highest_glucose)
          : null,
        lowestGlucose: summary.lowest_glucose
          ? Number(summary.lowest_glucose)
          : null,
        firstReadingDate: summary.first_reading_date,
        latestReadingDate: summary.latest_reading_date,
      },
    });
  } catch (err) {
    console.error("Error fetching patient profile:", err);
    return res.status(500).json({ error: "Unable to load patient profile." });
  }
});

// ===========================================================================
// GET /api/doctor/patients/:patientId/readings
// Paginated readings — only if accepted relationship
// ===========================================================================
router.get("/patients/:patientId/readings", async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId) || patientId < 1) {
      return res.status(400).json({ error: "Invalid patient ID." });
    }

    const relationship = await getAcceptedRelationship(req.user.id, patientId);
    if (!relationship) {
      return res.status(403).json({
        error: "Access denied. No accepted relationship with this patient.",
      });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countResult = await query(
      "SELECT COUNT(*) FROM readings WHERE user_id = $1",
      [patientId],
    );
    const total = Number(countResult.rows[0].count);

    const result = await query(
      `SELECT * FROM readings
       WHERE user_id = $1
       ORDER BY date DESC, created_at DESC
       LIMIT $2 OFFSET $3`,
      [patientId, limit, offset],
    );

    const readings = result.rows.map((r) => ({ ...r, value: Number(r.value) }));

    return res.json({
      readings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error("Error fetching patient readings:", err);
    return res.status(500).json({ error: "Unable to load patient readings." });
  }
});

// ===========================================================================
// GET /api/doctor/patients/:patientId/reports/daily
// GET /api/doctor/patients/:patientId/reports/month-to-date
// GET /api/doctor/patients/:patientId/reports/monthly
// ===========================================================================

// Factory: creates a route handler for a specific report period
// 🎓 This is a plain (non-async) function that returns an async handler.
//    It is NOT async itself because we don't await anything at factory-creation time.
function makeReportHandler(period) {
  return async (req, res) => {
    try {
      const patientId = Number(req.params.patientId);
      if (!Number.isInteger(patientId) || patientId < 1) {
        return res.status(400).json({ error: "Invalid patient ID." });
      }

      const relationship = await getAcceptedRelationship(
        req.user.id,
        patientId,
      );
      if (!relationship) {
        return res.status(403).json({
          error: "Access denied. No accepted relationship with this patient.",
        });
      }

      const dateString = req.query.date || toLocalDateString(new Date());
      const report = await fetchRangeReportForPatient(
        patientId,
        dateString,
        period,
      );
      return res.json(report);
    } catch (err) {
      console.error(`Error fetching patient ${period} report:`, err);
      return res.status(500).json({ error: "Unable to load report." });
    }
  };
}

router.get("/patients/:patientId/reports/daily", makeReportHandler("daily"));
router.get(
  "/patients/:patientId/reports/month-to-date",
  makeReportHandler("month-to-date"),
);
router.get(
  "/patients/:patientId/reports/monthly",
  makeReportHandler("monthly"),
);

module.exports = router;
