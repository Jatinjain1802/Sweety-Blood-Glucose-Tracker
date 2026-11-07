const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getDateRangeForPeriod,
  buildSummary,
  toLocalDateString,
} = require("./dateUtils");

test("daily range uses the selected date", () => {
  const range = getDateRangeForPeriod("2026-10-15", "daily");
  assert.equal(toLocalDateString(range.start), "2026-10-15");
  assert.equal(toLocalDateString(range.end), "2026-10-15");
});

test("month-to-date range starts on the first day of the month", () => {
  const range = getDateRangeForPeriod("2026-10-15", "month-to-date");
  assert.equal(toLocalDateString(range.start), "2026-10-01");
  assert.equal(toLocalDateString(range.end), "2026-10-15");
});

test("monthly range uses the previous calendar month", () => {
  const range = getDateRangeForPeriod("2026-10-15", "monthly");
  assert.equal(toLocalDateString(range.start), "2026-09-01");
  assert.equal(toLocalDateString(range.end), "2026-09-30");
});

test("january and leap year boundaries are handled correctly", () => {
  const january = getDateRangeForPeriod("2026-01-15", "monthly");
  assert.equal(toLocalDateString(january.start), "2025-12-01");
  assert.equal(toLocalDateString(january.end), "2025-12-31");

  const leap = getDateRangeForPeriod("2024-03-15", "monthly");
  assert.equal(toLocalDateString(leap.start), "2024-02-01");
  assert.equal(toLocalDateString(leap.end), "2024-02-29");
});

test("buildSummary calculates minimum maximum average and count", () => {
  const summary = buildSummary([{ value: 90 }, { value: 100 }, { value: 110 }]);

  assert.equal(summary.highest, 110);
  assert.equal(summary.lowest, 90);
  assert.equal(summary.average, 100);
  assert.equal(summary.count, 3);
});
test("invalid calendar dates are rejected", () => {
  const { parseDateString } = require("./dateUtils");

  assert.equal(parseDateString("2026-02-30"), null);
  assert.equal(parseDateString("2026-13-10"), null);
  assert.equal(parseDateString("invalid"), null);
});

test("average is rounded to one decimal place", () => {
  const summary = buildSummary([{ value: 90 }, { value: 100 }, { value: 111 }]);

  assert.equal(summary.average, 100.3);
});
