const SLOT_ORDER = [
  "Morning",
  "After breakfast",
  "After lunch",
  "After dinner",
];

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateString(dateString) {
  if (!dateString) {
    return null;
  }

  const [year, month, day] = String(dateString).split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTodayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isDateInFuture(dateString) {
  const date = parseDateString(dateString);
  if (!date) {
    return false;
  }

  return date > getTodayLocal();
}

function formatDateLabel(dateString) {
  const date = parseDateString(dateString);
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDateRangeForPeriod(dateString, period) {
  const selected = parseDateString(dateString) || getTodayLocal();
  const year = selected.getFullYear();
  const month = selected.getMonth();

  if (period === "daily") {
    return {
      start: new Date(year, month, selected.getDate()),
      end: new Date(year, month, selected.getDate()),
      label: formatDateLabel(dateString),
    };
  }

  if (period === "month-to-date") {
    const start = new Date(year, month, 1);
    const end = new Date(year, month, selected.getDate());
    return {
      start,
      end,
      label: `${formatDateLabel(toLocalDateString(start))} – ${formatDateLabel(dateString)}`,
    };
  }

  const previousMonthStart = new Date(year, month - 1, 1);
  const previousMonthEnd = new Date(year, month, 0);

  return {
    start: previousMonthStart,
    end: previousMonthEnd,
    label: `${formatDateLabel(toLocalDateString(previousMonthStart))} – ${formatDateLabel(toLocalDateString(previousMonthEnd))}`,
  };
}

function buildSummary(readings) {
  if (!readings.length) {
    return {
      highest: null,
      lowest: null,
      average: null,
      count: 0,
      readings: [],
    };
  }

  const values = readings.map((reading) => Number(reading.value));
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const average = Number(
    (values.reduce((total, value) => total + value, 0) / values.length).toFixed(
      1,
    ),
  );

  return {
    highest,
    lowest,
    average,
    count: readings.length,
    readings,
  };
}

module.exports = {
  SLOT_ORDER,
  parseDateString,
  isDateInFuture,
  formatDateLabel,
  getDateRangeForPeriod,
  buildSummary,
  getTodayLocal,
};
