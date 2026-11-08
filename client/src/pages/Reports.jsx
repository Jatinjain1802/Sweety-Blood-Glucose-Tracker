import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import GlucoseChart from "../components/GlucoseChart";

/**
 * ============================================================================
 * 🌸 SWEETY — ENHANCED REPORTS PAGE
 * ============================================================================
 *
 * 🎓 React, JavaScript & Browser API Concepts Explained:
 *
 * 1. CSV Generation in the Browser without External Libraries:
 *    - Modern browsers support the `Blob` (Binary Large Object) Web API.
 *    - We convert reading records into standard Comma-Separated Values (CSV).
 *    - By prepending `\uFEFF` (Byte Order Mark), Excel and Google Sheets automatically
 *      recognize UTF-8 encoding without garbled characters!
 *    - `URL.createObjectURL(blob)` turns memory into a temporary downloadable URL.
 *
 * 2. Printable Medical-Grade PDF via Browser Engine (`window.print()`):
 *    - Instead of loading heavy PDF canvas libraries that slow down mobile devices,
 *      we format the page with dedicated `@media print` CSS rules.
 *    - When `window.print()` is invoked, the browser natively converts the DOM into
 *      a crisp, vector-sharp PDF with page headers, summary tables, and charts!
 *
 * 3. Client-Side Multi-Facet Filtering (`useMemo`):
 *    - Users can slice their data by meal slot (e.g. only "Morning fasting") or
 *      clinical status (e.g. only "Elevated" readings).
 *    - All calculations (Average, Min, Max, Time-in-Range) recompute reactively.
 * ============================================================================
 */

const REPORT_TYPES = [
    { value: "daily", label: "Daily Report" },
    { value: "month-to-date", label: "Month-to-Date Report" },
    { value: "monthly", label: "Previous Month Report" },
];

const SLOT_OPTIONS = [
    { value: "all", label: "All Time Slots" },
    { value: "Morning fasting", label: "Morning fasting" },
    { value: "After breakfast", label: "After breakfast" },
    { value: "After lunch", label: "After lunch" },
    { value: "After dinner", label: "After dinner" },
];

const STATUS_OPTIONS = [
    { value: "all", label: "All Status Levels" },
    { value: "normal", label: "Normal (70 – 140 mg/dL)" },
    { value: "elevated", label: "Elevated (141 – 199 mg/dL)" },
    { value: "high", label: "High (200+ mg/dL)" },
    { value: "low", label: "Low (< 70 mg/dL)" },
];

const SORT_OPTIONS = [
    { value: "date-desc", label: "Date (Newest First)" },
    { value: "date-asc", label: "Date (Oldest First)" },
    { value: "val-desc", label: "Glucose (Highest First)" },
    { value: "val-asc", label: "Glucose (Lowest First)" },
];

function getLocalDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 10);
}

function Reports() {
    const [reportType, setReportType] = useState("daily");
    const [selectedDate, setSelectedDate] = useState(getLocalDate());
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Secondary Filter States
    const [slotFilter, setSlotFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("date-desc");

    const fetchReport = async () => {
        setLoading(true);
        setError("");
        setReport(null);

        try {
            const response = await api.get(
                `/reports/${reportType}?date=${selectedDate}`
            );
            setReport(response.data);
        } catch (err) {
            setError(
                err.response?.data?.error || "Unable to load the selected report."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [reportType, selectedDate]);

    const rawReadings = Array.isArray(report?.readings) ? report.readings : [];
    const range = report?.range;

    // Helper: Categorize glucose value
    const getGlucoseStatus = (val) => {
        const num = Number(val);
        if (num < 70) return { key: "low", label: "Low", badgeClass: "badge-warning", desc: "< 70 mg/dL" };
        if (num <= 140) return { key: "normal", label: "Normal", badgeClass: "badge-success", desc: "70 - 140 mg/dL" };
        if (num <= 199) return { key: "elevated", label: "Elevated", badgeClass: "badge-caution", desc: "141 - 199 mg/dL" };
        return { key: "high", label: "High", badgeClass: "badge-danger", desc: "200+ mg/dL" };
    };

    // Filtered & Sorted Readings
    const filteredReadings = useMemo(() => {
        let list = [...rawReadings];

        // 1. Slot Filter
        if (slotFilter !== "all") {
            list = list.filter((r) => r.slot === slotFilter);
        }

        // 2. Status Filter
        if (statusFilter !== "all") {
            list = list.filter((r) => {
                const status = getGlucoseStatus(r.value);
                return status.key === statusFilter;
            });
        }

        // 3. Sorting
        list.sort((a, b) => {
            if (sortOrder === "date-desc") {
                const diff = new Date(b.date) - new Date(a.date);
                return diff !== 0 ? diff : (b.id || 0) - (a.id || 0);
            }
            if (sortOrder === "date-asc") {
                const diff = new Date(a.date) - new Date(b.date);
                return diff !== 0 ? diff : (a.id || 0) - (b.id || 0);
            }
            if (sortOrder === "val-desc") {
                return Number(b.value) - Number(a.value);
            }
            if (sortOrder === "val-asc") {
                return Number(a.value) - Number(b.value);
            }
            return 0;
        });

        return list;
    }, [rawReadings, slotFilter, statusFilter, sortOrder]);

    // Computed Summary from filtered readings
    const summary = useMemo(() => {
        if (filteredReadings.length === 0) {
            return { highest: "--", lowest: "--", average: "--", count: 0, timeInRange: 0 };
        }
        const values = filteredReadings.map((r) => Number(r.value));
        const highest = Math.max(...values);
        const lowest = Math.min(...values);
        const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        const normalCount = filteredReadings.filter((r) => {
            const v = Number(r.value);
            return v >= 70 && v <= 140;
        }).length;
        const timeInRange = Math.round((normalCount / filteredReadings.length) * 100);

        return { highest, lowest, average, count: filteredReadings.length, timeInRange };
    }, [filteredReadings]);

    // Export to CSV Function
    const handleExportCSV = () => {
        if (filteredReadings.length === 0) {
            alert("No readings available to export.");
            return;
        }

        const headers = ["Reading ID", "Date", "Meal Slot", "Glucose (mg/dL)", "Clinical Status", "Reference Target"];
        const rows = filteredReadings.map((r) => {
            const status = getGlucoseStatus(r.value);
            return [
                r.id,
                `"${String(r.date).slice(0, 10)}"`,
                `"${r.slot}"`,
                r.value,
                `"${status.label}"`,
                `"${status.desc}"`,
            ].join(",");
        });

        const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `sweety_glucose_report_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Print / Save to PDF Function
    const handlePrintPDF = () => {
        window.print();
    };

    return (
        <div className="reports-page">
            <Navbar />

            <main className="reports-content">
                {/* Header with Title and Actions */}
                <div className="page-header print-header">
                    <div>
                        <div className="breadcrumbs no-print">
                            <Link to="/dashboard">Dashboard</Link>
                            <span>/</span>
                            <span className="current">Reports & Analytics</span>
                        </div>
                        <h1 className="page-title">Blood Glucose Reports</h1>
                        <p className="page-subtitle">
                            Analyze trends, calculate averages, and inspect glucose fluctuations.
                        </p>
                    </div>

                    {/* Export Action Buttons */}
                    <div className="export-actions no-print">
                        <button
                            type="button"
                            className="btn-export btn-export-csv"
                            onClick={handleExportCSV}
                            title="Export filtered records to CSV"
                        >
                            📥 Export CSV
                        </button>
                        <button
                            type="button"
                            className="btn-export btn-export-pdf"
                            onClick={handlePrintPDF}
                            title="Print or Save PDF report for your doctor"
                        >
                            🖨️ Print / Save PDF
                        </button>
                    </div>
                </div>

                {/* Filters & Control Card */}
                <section className="card filter-card no-print">
                    <div className="filter-header">
                        <span className="filter-icon">🔍</span>
                        <h3>Report Parameters & Interactive Slicers</h3>
                    </div>

                    <div className="filter-grid-four">
                        <div className="form-group">
                            <label htmlFor="reportType">Report Duration</label>
                            <select
                                id="reportType"
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value)}
                                className="form-control"
                            >
                                {REPORT_TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            <span className="field-hint">Timeframe window</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="reportDate">Reference Date</label>
                            <input
                                id="reportDate"
                                type="date"
                                max={getLocalDate()}
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="form-control"
                            />
                            <span className="field-hint">Base calculation date</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="slotFilter">Filter by Meal Slot</label>
                            <select
                                id="slotFilter"
                                value={slotFilter}
                                onChange={(e) => setSlotFilter(e.target.value)}
                                className="form-control"
                            >
                                {SLOT_OPTIONS.map((slot) => (
                                    <option key={slot.value} value={slot.value}>
                                        {slot.label}
                                    </option>
                                ))}
                            </select>
                            <span className="field-hint">Mealtime context</span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="statusFilter">Clinical Range</label>
                            <select
                                id="statusFilter"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="form-control"
                            >
                                {STATUS_OPTIONS.map((st) => (
                                    <option key={st.value} value={st.value}>
                                        {st.label}
                                    </option>
                                ))}
                            </select>
                            <span className="field-hint">ADA range category</span>
                        </div>
                    </div>
                </section>

                {loading && (
                    <div className="loading-container p-4 no-print">
                        <div className="spinner"></div>
                        <p className="loading-text">Generating report statistics & multi-modal charts...</p>
                    </div>
                )}

                {error && (
                    <div className="alert alert-error no-print">
                        <span className="alert-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {!loading && !error && report && (
                    <>
                        {range && (
                            <div className="period-badge">
                                📅 Reporting Window: <strong>{range.start}</strong> to <strong>{range.end}</strong>
                                {filteredReadings.length !== rawReadings.length && (
                                    <span className="filter-active-pill">
                                        Active filters applied: {filteredReadings.length} of {rawReadings.length} readings
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Metric Summary Cards */}
                        <section className="stats-grid">
                            <div className="stat-card stat-highest">
                                <div className="stat-header">
                                    <span className="stat-label">Peak Reading</span>
                                    <span className="stat-icon">📈</span>
                                </div>
                                <div className="stat-body">
                                    <span className="stat-value">{summary.highest}</span>
                                    <span className="stat-unit">mg/dL</span>
                                </div>
                                <div className="stat-footer">Highest glucose in period</div>
                            </div>

                            <div className="stat-card stat-lowest">
                                <div className="stat-header">
                                    <span className="stat-label">Lowest Reading</span>
                                    <span className="stat-icon">📉</span>
                                </div>
                                <div className="stat-body">
                                    <span className="stat-value">{summary.lowest}</span>
                                    <span className="stat-unit">mg/dL</span>
                                </div>
                                <div className="stat-footer">Lowest glucose recorded</div>
                            </div>

                            <div className="stat-card stat-average">
                                <div className="stat-header">
                                    <span className="stat-label">Mean Average</span>
                                    <span className="stat-icon">⚖️</span>
                                </div>
                                <div className="stat-body">
                                    <span className="stat-value">{summary.average}</span>
                                    <span className="stat-unit">mg/dL</span>
                                </div>
                                <div className="stat-footer">Average glucose level</div>
                            </div>

                            <div className="stat-card stat-total">
                                <div className="stat-header">
                                    <span className="stat-label">In Target Range</span>
                                    <span className="stat-icon">🎯</span>
                                </div>
                                <div className="stat-body">
                                    <span className="stat-value">{summary.timeInRange}%</span>
                                    <span className="stat-unit">TIR</span>
                                </div>
                                <div className="stat-footer">70 – 140 mg/dL target</div>
                            </div>
                        </section>

                        {/* Multi-modal Glucose Visualizations (Area, Line, Bar, Slot Averages, Distribution) */}
                        <GlucoseChart readings={filteredReadings} />

                        {/* Complete Readings Log Table */}
                        <section className="card table-card">
                            <div className="table-card-header">
                                <div>
                                    <h3 className="card-heading">Readings Breakdown Log</h3>
                                    <p className="card-subheading">
                                        Showing {filteredReadings.length} reading(s) for the selected timeframe
                                    </p>
                                </div>

                                <div className="sort-group no-print">
                                    <label htmlFor="sortOrder">Sort:</label>
                                    <select
                                        id="sortOrder"
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                        className="form-control form-control-sm"
                                    >
                                        {SORT_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {filteredReadings.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📂</div>
                                    <h3 className="empty-title">No readings match current filters</h3>
                                    <p className="empty-desc">
                                        Try adjusting your meal slot, clinical range filter, or reference date.
                                    </p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="modern-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Time Slot</th>
                                                <th>Glucose Level</th>
                                                <th>Clinical Status</th>
                                                <th>Target Reference</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredReadings.map((reading) => {
                                                const status = getGlucoseStatus(reading.value);
                                                const dateStr = String(reading.date).slice(0, 10);

                                                return (
                                                    <tr key={reading.id}>
                                                        <td>
                                                            <strong className="text-main">{dateStr}</strong>
                                                        </td>
                                                        <td>
                                                            <span className="slot-badge">{reading.slot}</span>
                                                        </td>
                                                        <td>
                                                            <strong className="glucose-val">{reading.value}</strong>{" "}
                                                            <span className="unit-label">mg/dL</span>
                                                        </td>
                                                        <td>
                                                            <span className={`glucose-pill ${status.badgeClass}`}>
                                                                ● {status.label}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="reference-text">{status.desc}</span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

export default Reports;
