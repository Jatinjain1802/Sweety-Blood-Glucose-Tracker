const test = require("node:test");
const assert = require("node:assert/strict");

const { getDateRangeForPeriod, buildSummary } = require("./dateUtils");

test("daily range uses the selected date", () => {
  const range = getDateRangeForPeriod("2026-10-15", "daily");
  assert.equal(range.start.toISOString().slice(0, 10), "2026-10-15");
  assert.equal(range.end.toISOString().slice(0, 10), "2026-10-15");
});

test("month-to-date range starts on the first day of the month", () => {
  const range = getDateRangeForPeriod("2026-10-15", "month-to-date");
  assert.equal(range.start.toISOString().slice(0, 10), "2026-10-01");
  assert.equal(range.end.toISOString().slice(0, 10), "2026-10-15");
});

test("monthly range uses the previous calendar month", () => {
  const range = getDateRangeForPeriod("2026-10-15", "monthly");
  assert.equal(range.start.toISOString().slice(0, 10), "2026-09-01");
  assert.equal(range.end.toISOString().slice(0, 10), "2026-09-30");
});

test("january and leap year boundaries are handled correctly", () => {
  const january = getDateRangeForPeriod("2026-01-15", "monthly");
  assert.equal(january.start.toISOString().slice(0, 10), "2025-12-01");
  assert.equal(january.end.toISOString().slice(0, 10), "2025-12-31");

  const leap = getDateRangeForPeriod("2024-03-15", "monthly");
  assert.equal(leap.start.toISOString().slice(0, 10), "2024-02-01");
  assert.equal(leap.end.toISOString().slice(0, 10), "2024-02-29");
});

test("buildSummary calculates minimum maximum average and count", () => {
  const summary = buildSummary([{ value: 90 }, { value: 100 }, { value: 110 }]);

  assert.equal(summary.highest, 110);
  assert.equal(summary.lowest, 90);
  assert.equal(summary.average, 100);
  assert.equal(summary.count, 3);
});
