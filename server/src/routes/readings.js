const express = require("express");
const { query } = require("../config/db");
const {
  SLOT_ORDER,
  isDateInFuture,
  parseDateString,
} = require("../utils/dateUtils");

const router = express.Router();

function buildErrorMessage(errorCode, message) {
  return { error: message, code: errorCode };
}

function validateReadingInput(payload) {
  const errors = [];
  const valueInput = payload.value;
  const date = payload.date;
  const slot = payload.slot;

  if (date === undefined || date === null || String(date).trim() === "") {
    errors.push("Please select a date.");
  }

  if (!slot || !SLOT_ORDER.includes(slot)) {
    errors.push("Please select a valid time slot.");
  }

  if (
    valueInput === undefined ||
    valueInput === null ||
    String(valueInput).trim() === ""
  ) {
    errors.push("Please enter a glucose value.");
  } else {
    const numericValue = Number(valueInput);

    if (!Number.isInteger(numericValue)) {
      errors.push("Please enter a glucose value.");
    } else if (numericValue < 40 || numericValue > 600) {
      errors.push("Value must be between 40 and 600 mg/dl.");
    }
  }

  if (date && isDateInFuture(date)) {
    errors.push("Date cannot be in the future.");
  }

  return errors;
}

async function getReadingById(userId, readingId) {
  const result = await query(
    "SELECT * FROM readings WHERE id = $1 AND user_id = $2",
    [readingId, userId],
  );
  return result.rows[0] || null;
}

router.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const offset = (page - 1) * limit;

  const result = await query(
    "SELECT * FROM readings WHERE user_id = $1 ORDER BY date DESC, created_at DESC",
    [req.user.id],
  );

  const total = result.rows.length;
  const paginatedRows = result.rows.slice(offset, offset + limit);

  const readings = paginatedRows.map((reading) => ({
    ...reading,
    value: Number(reading.value),
  }));

  return res.json({
    readings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

router.post("/", async (req, res) => {
  const validationErrors = validateReadingInput(req.body || {});

  if (validationErrors.length > 0) {
    return res
      .status(400)
      .json(buildErrorMessage("VALIDATION_ERROR", validationErrors[0]));
  }

  const { date, slot, value } = req.body;
  const parsedDate = parseDateString(date);

  if (!parsedDate) {
    return res
      .status(400)
      .json(
        buildErrorMessage("VALIDATION_ERROR", "Please select a valid date."),
      );
  }

  const existingRows = await query(
    "SELECT slot FROM readings WHERE user_id = $1 AND date = $2",
    [req.user.id, date],
  );

  if (existingRows.rows.some((reading) => reading.slot === slot)) {
    return res
      .status(400)
      .json(
        buildErrorMessage(
          "VALIDATION_ERROR",
          `You already have an ${slot} reading for this date.`,
        ),
      );
  }

  if (existingRows.rows.length >= 4) {
    return res
      .status(400)
      .json(
        buildErrorMessage(
          "VALIDATION_ERROR",
          "You can add only 4 readings per day.",
        ),
      );
  }

  const result = await query(
    "INSERT INTO readings (user_id, date, slot, value) VALUES ($1, $2, $3, $4) RETURNING *",
    [req.user.id, date, slot, Number(value)],
  );

  return res.status(201).json({ reading: result.rows[0] });
});

router.put("/:id", async (req, res) => {
  const reading = await getReadingById(req.user.id, req.params.id);

  if (!reading) {
    return res.status(404).json({ error: "Reading not found." });
  }

  const validationErrors = validateReadingInput(req.body || {});

  if (validationErrors.length > 0) {
    return res
      .status(400)
      .json(buildErrorMessage("VALIDATION_ERROR", validationErrors[0]));
  }

  const { date, slot, value } = req.body;
  const parsedDate = parseDateString(date);

  if (!parsedDate) {
    return res
      .status(400)
      .json(
        buildErrorMessage("VALIDATION_ERROR", "Please select a valid date."),
      );
  }

  const duplicateCheck = await query(
    "SELECT id, slot FROM readings WHERE user_id = $1 AND date = $2 AND id != $3",
    [req.user.id, date, req.params.id],
  );

  if (duplicateCheck.rows.some((row) => row.slot === slot)) {
    return res
      .status(400)
      .json(
        buildErrorMessage(
          "VALIDATION_ERROR",
          `You already have an ${slot} reading for this date.`,
        ),
      );
  }

  const countCheck = await query(
    "SELECT id FROM readings WHERE user_id = $1 AND date = $2",
    [req.user.id, date],
  );
  const currentSlotSameDate = Number(reading.date) === Number(new Date(date));

  if (countCheck.rows.length >= 4 && !currentSlotSameDate) {
    return res
      .status(400)
      .json(
        buildErrorMessage(
          "VALIDATION_ERROR",
          "You can add only 4 readings per day.",
        ),
      );
  }

  const result = await query(
    "UPDATE readings SET date = $1, slot = $2, value = $3 WHERE id = $4 AND user_id = $5 RETURNING *",
    [date, slot, Number(value), req.params.id, req.user.id],
  );

  return res.json({ reading: result.rows[0] });
});

router.delete("/:id", async (req, res) => {
  const reading = await getReadingById(req.user.id, req.params.id);

  if (!reading) {
    return res.status(404).json({ error: "Reading not found." });
  }

  await query("DELETE FROM readings WHERE id = $1 AND user_id = $2", [
    req.params.id,
    req.user.id,
  ]);
  return res.json({ message: "Reading deleted successfully." });
});

module.exports = router;
