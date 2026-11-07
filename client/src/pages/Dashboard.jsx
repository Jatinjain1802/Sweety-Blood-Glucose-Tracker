
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

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
                setReadings(
                    Array.isArray(readingsResponse.data)
                        ? readingsResponse.data
                        : readingsResponse.data.readings || []
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
        navigate("/login");
    };

    if (loading) return <p className="loading">Loading dashboard...</p>;

    const summary = report?.summary || report || {};

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div>
                    <h1>🌸 Sweety</h1>
                    <p>Blood Glucose Tracker</p>
                </div>

                <button className="logout-btn" onClick={logout}>
                    Logout
                </button>
            </header>

            <main className="dashboard-content">
                <h2>Hello, {user.name || "there"}! 👋</h2>
                <p className="dashboard-subtitle">
                    Here's your glucose overview for today.
                </p>

                {error && <p className="error">{error}</p>}

                <div className="summary-grid">
                    <div className="summary-card">
                        <p>Highest</p>
                        <h2>{summary.highest ?? "--"}</h2>
                        <span>mg/dL</span>
                    </div>

                    <div className="summary-card">
                        <p>Lowest</p>
                        <h2>{summary.lowest ?? "--"}</h2>
                        <span>mg/dL</span>
                    </div>

                    <div className="summary-card">
                        <p>Average</p>
                        <h2>{summary.average ?? "--"}</h2>
                        <span>mg/dL</span>
                    </div>

                    <div className="summary-card">
                        <p>Total Readings</p>
                        <h2>{summary.count ?? readings.length}</h2>
                        <span>Today</span>
                    </div>
                </div>

                <section className="readings-section">
                    <div className="section-heading">
                        <h2>Today's Readings</h2>
                        <Link to="/readings">Manage Readings</Link>
                    </div>

                    {readings.length === 0 ? (
                        <p className="empty-message">
                            No readings recorded today. Add your first reading!
                        </p>
                    ) : (
                        <div className="reading-list">
                            {readings.map((reading) => (
                                <div className="reading-item" key={reading.id}>
                                    <div>
                                        <strong>{reading.slot}</strong>
                                        <p>{reading.date}</p>
                                    </div>

                                    <strong>{reading.value} mg/dL</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <div className="dashboard-links">
                    <Link to="/readings">Manage Glucose Readings →</Link>
                    <Link to="/reports">View Reports →</Link>
                </div>
            </main>
        </div>
    );
}

export default Dashboard;
