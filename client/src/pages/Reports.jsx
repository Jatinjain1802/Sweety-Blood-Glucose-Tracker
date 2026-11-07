
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

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

    return (
        <div className="reports-page">
            <header className="dashboard-header">
                <div>
                    <h1>🌸 Sweety</h1>
                    <p>Blood Glucose Tracker</p>
                </div>

                <Link to="/dashboard" className="back-link">
                    ← Dashboard
                </Link>
            </header>

            <main className="reports-content">
                <h2>Glucose Reports</h2>
                <p className="dashboard-subtitle">
                    Review your blood glucose readings and summaries.
                </p>

                <section className="report-filter-card">
                    <div className="filter-field">
                        <label htmlFor="reportType">Report Type</label>
                        <select
                            id="reportType"
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                        >
                            {REPORT_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-field">
                        <label htmlFor="reportDate">Select Date</label>
                        <input
                            id="reportDate"
                            type="date"
                            max={getLocalDate()}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </section>

                {loading && <p className="loading">Loading report...</p>}

                {error && <p className="error">{error}</p>}

                {!loading && !error && report && (
                    <>
                        {range && (
                            <p className="report-range">
                                Report period: {range.start} to {range.end}
                            </p>
                        )}

                        <section className="report-summary-grid">
                            <div className="report-card">
                                <p>Highest</p>
                                <h2>{summary.highest ?? "--"}</h2>
                                <span>mg/dL</span>
                            </div>

                            <div className="report-card">
                                <p>Lowest</p>
                                <h2>{summary.lowest ?? "--"}</h2>
                                <span>mg/dL</span>
                            </div>

                            <div className="report-card">
                                <p>Average</p>
                                <h2>{summary.average ?? "--"}</h2>
                                <span>mg/dL</span>
                            </div>

                            <div className="report-card">
                                <p>Total Readings</p>
                                <h2>{summary.count ?? readings.length}</h2>
                                <span>Readings</span>
                            </div>
                        </section>

                        {reportType === "daily" && (
                            <section className="report-readings-card">
                                <h3>Daily Reading Details</h3>

                                {readings.length === 0 ? (
                                    <p className="empty-message">
                                        No readings recorded for this date.
                                    </p>
                                ) : (
                                    <div className="table-wrapper">
                                        <table className="readings-table">
                                            <thead>
                                                <tr>
                                                    <th>Time Slot</th>
                                                    <th>Glucose Value</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {readings.map((reading) => (
                                                    <tr key={reading.id}>
                                                        <td>{reading.slot}</td>
                                                        <td>{reading.value} mg/dL</td>
                                                    </tr>
                                                ))}
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
