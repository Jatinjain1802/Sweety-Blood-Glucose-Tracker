const express = require("express");
const { query } = require("../config/db");
const {
  buildSummary,
  getDateRangeForPeriod,
  formatDateLabel,
  toLocalDateString,
} = require("../utils/dateUtils");

const router = express.Router();

function getDateString(value) {
  const selected = value || new Date();
  return typeof selected === "string" ? selected : toLocalDateString(selected);
}

async function fetchRangeReport(userId, dateString, period) {
  const range = getDateRangeForPeriod(dateString, period);
  const start = toLocalDateString(range.start);
  const end = toLocalDateString(range.end);

  const result = await query(
    "SELECT * FROM readings WHERE user_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC, created_at ASC",
    [userId, start, end],
  );

  const readings = result.rows.map((reading) => ({
    ...reading,
    value: Number(reading.value),
  }));

  const summary = buildSummary(readings);

  return {
    period,
    selectedDate: dateString,
    displayLabel: range.label || formatDateLabel(dateString),
    range: {
      start,
      end,
    },
    summary,
    readings,
  };
}

router.get("/daily", async (req, res) => {
  const dateString = getDateString(req.query.date);
  const report = await fetchRangeReport(req.user.id, dateString, "daily");
  return res.json(report);
});

router.get("/month-to-date", async (req, res) => {
  const dateString = getDateString(req.query.date);
  const report = await fetchRangeReport(
    req.user.id,
    dateString,
    "month-to-date",
  );
  return res.json(report);
});

router.get("/monthly", async (req, res) => {
  const dateString = getDateString(req.query.date);
  const report = await fetchRangeReport(req.user.id, dateString, "monthly");
  return res.json(report);
});

module.exports = router;
