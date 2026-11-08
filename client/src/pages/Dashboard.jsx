import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import MyDoctor from "../components/MyDoctor";

/**
 * Dashboard Page
 * --------------
 * Visual Redesign preserving all existing data-fetching logic and state.
 *
 * Concepts to learn:
 * 1. Semantic HTML: <main>, <section>, <header> improve accessibility and SEO.
 * 2. Visual Hierarchy: Big stat numbers, color-coded badges, clear CTA buttons.
 * 3. Conditional Rendering: Rendering loading spinners or empty-state cards.
 */
function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [report, setReport] = useState(null);
    const [readings, setReadings] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const today = new Date().toLocaleDateString("en-CA");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [reportResponse, readingsResponse] = await Promise.all([
                    api.get(`/reports/daily?date=${today}`),
                    api.get(`/readings?date=${today}`),
                ]);

                setReport(reportResponse.data);
                const allReadings = Array.isArray(readingsResponse.data)
                    ? readingsResponse.data
                    : readingsResponse.data.readings || [];

                setReadings(
                    allReadings.filter(
                        (reading) => String(reading.date).slice(0, 10) === today
                    )
                );
            } catch (err) {
                setError(
                    err.response?.data?.error || "Unable to load dashboard data."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [today]);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    if (loading) {
        return (
            <div className="dashboard-page">
                <Navbar />
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p className="loading-text">Loading your health dashboard...</p>
                </div>
            </div>
        );
    }

    const summary = report?.summary || report || {};

    // Helper to style blood glucose values nicely based on typical target ranges
    const getGlucoseBadgeClass = (val) => {
        const num = Number(val);
        if (isNaN(num)) return "badge-neutral";
        if (num < 70) return "badge-warning"; // Low
        if (num <= 140) return "badge-success"; // Normal
        if (num <= 199) return "badge-caution"; // Elevated
        return "badge-danger"; // High
    };

    return (
        <div className="dashboard-page">
            <Navbar />

            <main className="dashboard-content">
                {/* Hero Greeting Card */}
                <section className="welcome-banner">
                    <div className="welcome-info">
                        <span className="welcome-pill">📅 Today • {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <h1 className="welcome-title">
                            Hello, {user.name || "there"}! <span className="wave">👋</span>
                        </h1>
                        <p className="welcome-subtitle">
                            Here is your blood glucose overview and tracking summary for today.
                        </p>
                    </div>

                    <div className="welcome-actions">
                        <Link to="/readings" className="btn-primary">
                            <span>+</span> Add Reading
                        </Link>
                        <Link to="/reports" className="btn-secondary">
                            View Reports →
                        </Link>
                    </div>
                </section>

                {error && (
                    <div className="alert alert-error">
                        <span className="alert-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* 4 Stat Cards */}
                <section className="stats-grid">
                    {/* Highest Card */}
                    <div className="stat-card stat-highest">
                        <div className="stat-header">
                            <span className="stat-label">Highest</span>
                            <span className="stat-icon">📈</span>
                        </div>
                        <div className="stat-body">
                            <span className="stat-value">{summary.highest ?? "--"}</span>
                            <span className="stat-unit">mg/dL</span>
                        </div>
                        <div className="stat-footer">Peak glucose level today</div>
                    </div>

                    {/* Lowest Card */}
                    <div className="stat-card stat-lowest">
                        <div className="stat-header">
                            <span className="stat-label">Lowest</span>
                            <span className="stat-icon">📉</span>
                        </div>
                        <div className="stat-body">
                            <span className="stat-value">{summary.lowest ?? "--"}</span>
                            <span className="stat-unit">mg/dL</span>
                        </div>
                        <div className="stat-footer">Minimum recorded level</div>
                    </div>

                    {/* Average Card */}
                    <div className="stat-card stat-average">
                        <div className="stat-header">
                            <span className="stat-label">Average</span>
                            <span className="stat-icon">⚖️</span>
                        </div>
                        <div className="stat-body">
                            <span className="stat-value">{summary.average ?? "--"}</span>
                            <span className="stat-unit">mg/dL</span>
                        </div>
                        <div className="stat-footer">Calculated daily average</div>
                    </div>

                    {/* Total Readings Card */}
                    <div className="stat-card stat-total">
                        <div className="stat-header">
                            <span className="stat-label">Total Logs</span>
                            <span className="stat-icon">📋</span>
                        </div>
                        <div className="stat-body">
                            <span className="stat-value">{summary.count ?? readings.length}</span>
                            <span className="stat-unit">records</span>
                        </div>
                        <div className="stat-footer">Logged today</div>
                    </div>
                </section>

                {/* Today's Readings Section */}
                <section className="card-section">
                    <div className="section-header">
                        <div>
                            <h2 className="section-title">Today's Readings</h2>
                            <p className="section-subtitle">
                                All glucose levels recorded for today
                            </p>
                        </div>
                        <Link to="/readings" className="section-link">
                            Manage All Readings <span>→</span>
                        </Link>
                    </div>

                    {readings.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🩸</div>
                            <h3 className="empty-title">No readings recorded today</h3>
                            <p className="empty-desc">
                                Track your glucose after meals or in the morning to maintain healthy patterns.
                            </p>
                            <Link to="/readings" className="btn-primary btn-sm">
                                + Log Your First Reading
                            </Link>
                        </div>
                    ) : (
                        <div className="readings-grid">
                            {readings.map((reading) => (
                                <div className="reading-card" key={reading.id}>
                                    <div className="reading-card-left">
                                        <div className="slot-badge">
                                            {reading.slot}
                                        </div>
                                        <span className="reading-date">
                                            {reading.date}
                                        </span>
                                    </div>

                                    <div className="reading-card-right">
                                        <span className={`glucose-pill ${getGlucoseBadgeClass(reading.value)}`}>
                                            <strong>{reading.value}</strong> mg/dL
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Quick Navigation Cards */}
                <section className="quick-links-grid">
                    <Link to="/readings" className="quick-link-card">
                        <div className="quick-link-icon">📝</div>
                        <div className="quick-link-content">
                            <h3>Manage Readings</h3>
                            <p>Log a new reading, edit historical values, or remove entries.</p>
                        </div>
                        <span className="quick-link-arrow">→</span>
                    </Link>

                    <Link to="/reports" className="quick-link-card">
                        <div className="quick-link-icon">📊</div>
                        <div className="quick-link-content">
                            <h3>View Health Reports</h3>
                            <p>Analyze daily, month-to-date, and previous month glucose metrics.</p>
                        </div>
                        <span className="quick-link-arrow">→</span>
                    </Link>
                </section>

                {/* My Doctor Section — only for patients */}
                <MyDoctor />
            </main>
        </div>
    );
}

export default Dashboard;
