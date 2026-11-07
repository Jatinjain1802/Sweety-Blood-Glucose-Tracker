import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

const REPORT_TYPES = [
    { value: "daily", label: "Daily Report" },
    { value: "month-to-date", label: "Month-to-Date Report" },
    { value: "monthly", label: "Previous Month Report" },
];

function getLocalDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset();

    return new Date(now.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 10);
}

/**
 * Reports Page
 * ------------
 * Logic preserved 100%:
 * - Same API endpoints and query params (/reports/:type?date=...)
 * - Same state and effect triggers on [reportType, selectedDate]
 * - Same summary calculation and conditional rendering
 *
 * Visual Enhancements:
 * - Unified navbar and breadcrumb navigation
 * - Elegant filter controls card
 * - Visual stat cards with status icons and indicators
 * - Polished tabular report representation
 */
function Reports() {
    const [reportType, setReportType] = useState("daily");
    const [selectedDate, setSelectedDate] = useState(getLocalDate());
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    const summary = report?.summary || report || {};
    const readings = Array.isArray(report?.readings)
        ? report.readings
        : [];

    const range = report?.range;

    const getGlucoseBadgeClass = (val) => {
        const num = Number(val);
        if (isNaN(num)) return "badge-neutral";
        if (num < 70) return "badge-warning";
        if (num <= 140) return "badge-success";
        if (num <= 199) return "badge-caution";
        return "badge-danger";
    };

    return (
        <div className="reports-page">
            <Navbar />

            <main className="reports-content">
                {/* Header & Breadcrumb */}
                <div className="page-header">
                    <div>
                        <div className="breadcrumbs">
                            <Link to="/dashboard">Dashboard</Link>
                            <span>/</span>
                            <span className="current">Reports</span>
                        </div>
                        <h1 className="page-title">Blood Glucose Reports</h1>
                        <p className="page-subtitle">
                            Analyze trends, calculate averages, and inspect glucose fluctuations.
                        </p>
                    </div>
                </div>

                {/* Filters Card */}
                <section className="card filter-card">
                    <div className="filter-header">
                        <span className="filter-icon">🔍</span>
                        <h3>Filter & Report Parameters</h3>
                    </div>

                    <div className="filter-grid">
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
                            <span className="field-hint">Choose day or month view</span>
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
                            <span className="field-hint">Calculations base date</span>
                        </div>
                    </div>
                </section>

                {loading && (
                    <div className="loading-container p-4">
                        <div className="spinner"></div>
                        <p className="loading-text">Generating report statistics...</p>
                    </div>
                )}

                {error && (
                    <div className="alert alert-error">
                        <span className="alert-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {!loading && !error && report && (
                    <>
                        {range && (
                            <div className="period-badge">
                                📅 Reporting Window: <strong>{range.start}</strong> to <strong>{range.end}</strong>
                            </div>
                        )}

                        {/* Metric Summary Cards */}
                        <section className="stats-grid">
                            <div className="stat-card stat-highest">
                                <div className="stat-header">
                                    <span className="stat-label">Highest</span>
                                    <span className="stat-icon">📈</span>
                                </div>
                                <div className="stat-body">
                                    <span className="stat-value">{summary.highest ?? "--"}</span>
                                    <span className="stat-unit">mg/dL</span>
                                </div>
                                <div className="stat-footer">Peak glucose in period</div>
                            </div>

                            <div className="stat-card stat-lowest">
                                <div className="stat-header">
                                    <span className="stat-label">Lowest</span>
                                    <span className="stat-icon">📉</span>
                                </div>
                                <div className="stat-body">
                                    <span className="stat-value">{summary.lowest ?? "--"}</span>
                                    <span className="stat-unit">mg/dL</span>
                                </div>
                                <div className="stat-footer">Lowest glucose recorded</div>
                            </div>

                            <div className="stat-card stat-average">
                                <div className="stat-header">
                                    <span className="stat-label">Average</span>
                                    <span className="stat-icon">⚖️</span>
                                </div>
                                <div className="stat-body">
                                    <span className="stat-value">{summary.average ?? "--"}</span>
                                    <span className="stat-unit">mg/dL</span>
                                </div>
                                <div className="stat-footer">Mean level across readings</div>
                            </div>

                            <div className="stat-card stat-total">
                                <div className="stat-header">
                                    <span className="stat-label">Total Readings</span>
                                    <span className="stat-icon">📊</span>
                                </div>
                                <div className="stat-body">
                                    <span className="stat-value">{summary.count ?? readings.length}</span>
                                    <span className="stat-unit">records</span>
                                </div>
                                <div className="stat-footer">In selected timeframe</div>
                            </div>
                        </section>

                        {/* Daily Readings Table breakdown (only shown when reportType is daily) */}
                        {reportType === "daily" && (
                            <section className="card table-card">
                                <div className="table-card-header">
                                    <div>
                                        <h3 className="card-heading">Daily Reading Details</h3>
                                        <p className="card-subheading">
                                            Individual measurements breakdown for {selectedDate}
                                        </p>
                                    </div>
                                </div>

                                {readings.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">📂</div>
                                        <h3 className="empty-title">No readings for this date</h3>
                                        <p className="empty-desc">
                                            There were no glucose levels recorded on {selectedDate}.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="modern-table">
                                            <thead>
                                                <tr>
                                                    <th>Time Slot</th>
                                                    <th>Glucose Value</th>
                                                    <th>Status Level</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {readings.map((reading) => {
                                                    const badgeClass = getGlucoseBadgeClass(reading.value);
                                                    const statusLabel =
                                                        Number(reading.value) < 70
                                                            ? "Low"
                                                            : Number(reading.value) <= 140
                                                            ? "Normal"
                                                            : Number(reading.value) <= 199
                                                            ? "Elevated"
                                                            : "High";

                                                    return (
                                                        <tr key={reading.id}>
                                                            <td>
                                                                <span className="slot-badge">{reading.slot}</span>
                                                            </td>
                                                            <td>
                                                                <strong className="glucose-val">{reading.value}</strong>{" "}
                                                                <span className="unit-label">mg/dL</span>
                                                            </td>
                                                            <td>
                                                                <span className={`glucose-pill ${badgeClass}`}>
                                                                    {statusLabel}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default Reports;
