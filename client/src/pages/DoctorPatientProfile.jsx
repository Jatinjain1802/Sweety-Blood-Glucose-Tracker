import { useState, useEffect } from "react";
import api from "../api/axios";
import GlucoseChart from "../components/GlucoseChart";

/**
 * DoctorPatientProfile
 * --------------------
 * Full patient profile view shown to doctors after request acceptance.
 * This is a "component" rendered inside the DoctorDashboard, not its own page.
 *
 * 🎓 React Concepts:
 * 1. Props: `patient` and `onBack` are passed from the parent (DoctorDashboard).
 *    Props flow DOWN (parent → child). Events flow UP (child calls parent function).
 * 2. Sub-tabs within a component: We have Report / History / Chart sub-tabs.
 * 3. Pagination: `page` state controls which slice of readings to display.
 * 4. useEffect cleanup: each tab fetch is independent and controlled by dependency changes.
 */
function DoctorPatientProfile({ patient, onBack }) {
  const [subTab, setSubTab] = useState("overview");

  // Overview data
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState("");

  // Readings (paginated)
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [readingsPage, setReadingsPage] = useState(1);
  const [readingsLoading, setReadingsLoading] = useState(false);
  const [readingsError, setReadingsError] = useState("");

  // Reports
  const [report, setReport] = useState(null);
  const [reportPeriod, setReportPeriod] = useState("daily");
  const [reportDate, setReportDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const patientId = patient.patientId;

  // ---------------------------------------------------------------------------
  // Overview fetch
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (subTab !== "overview") return;
    setOverviewLoading(true);
    setOverviewError("");
    api
      .get(`/doctor/patients/${patientId}`)
      .then((res) => setOverview(res.data))
      .catch((err) =>
        setOverviewError(
          err.response?.data?.error || "Unable to load patient profile."
        )
      )
      .finally(() => setOverviewLoading(false));
  }, [patientId, subTab]);

  // ---------------------------------------------------------------------------
  // Readings fetch (re-fetches when page changes)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (subTab !== "readings") return;
    setReadingsLoading(true);
    setReadingsError("");
    api
      .get(`/doctor/patients/${patientId}/readings`, {
        params: { page: readingsPage, limit: 20 },
      })
      .then((res) => {
        setReadings(res.data.readings || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      })
      .catch((err) =>
        setReadingsError(
          err.response?.data?.error || "Unable to load readings."
        )
      )
      .finally(() => setReadingsLoading(false));
  }, [patientId, subTab, readingsPage]);

  // ---------------------------------------------------------------------------
  // Reports fetch
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (subTab !== "reports") return;
    setReportLoading(true);
    setReportError("");
    const periodPath = reportPeriod === "mtd" ? "month-to-date" : reportPeriod;
    api
      .get(`/doctor/patients/${patientId}/reports/${periodPath}`, {
        params: { date: reportDate },
      })
      .then((res) => setReport(res.data))
      .catch((err) =>
        setReportError(err.response?.data?.error || "Unable to load report.")
      )
      .finally(() => setReportLoading(false));
  }, [patientId, subTab, reportPeriod, reportDate]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const getGlucoseClass = (val) => {
    if (val == null) return "";
    if (val < 70) return "glucose-low";
    if (val <= 140) return "glucose-normal";
    if (val <= 199) return "glucose-elevated";
    return "glucose-high";
  };

  const getGlucoseBadgeClass = (val) => {
    const num = Number(val);
    if (isNaN(num)) return "badge-neutral";
    if (num < 70) return "badge-warning";
    if (num <= 140) return "badge-success";
    if (num <= 199) return "badge-caution";
    return "badge-danger";
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <section className="doctor-profile-section">
      {/* Back button */}
      <div className="profile-back-row">
        <button className="btn-back" onClick={onBack}>
          ← Back to Patients
        </button>
      </div>

      {/* Patient header */}
      <div className="patient-profile-header">
        <div className="drc-avatar drc-avatar-lg">
          {patient.patientName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="profile-patient-name">{patient.patientName}</h2>
          <p className="profile-patient-email">{patient.patientEmail}</p>
          <span className="status-badge status-accepted">Access Granted</span>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="profile-sub-tabs">
        {[
          { key: "overview", label: "📋 Overview" },
          { key: "readings", label: "📝 All Readings" },
          { key: "reports", label: "📊 Reports" },
          { key: "chart", label: "📈 Charts" },
        ].map((t) => (
          <button
            key={t.key}
            className={`doctor-sub-tab ${subTab === t.key ? "active" : ""}`}
            onClick={() => setSubTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {subTab === "overview" && (
        <div className="profile-tab-content">
          {overviewLoading && (
            <div className="loading-container">
              <div className="spinner" />
              <p className="loading-text">Loading patient profile…</p>
            </div>
          )}
          {overviewError && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{overviewError}</span>
            </div>
          )}
          {!overviewLoading && overview && (
            <>
              <div className="stats-grid">
                <div className="stat-card stat-total">
                  <div className="stat-header">
                    <span className="stat-label">Total Readings</span>
                    <span className="stat-icon">📋</span>
                  </div>
                  <div className="stat-body">
                    <span className="stat-value">
                      {overview.summary.totalReadings}
                    </span>
                    <span className="stat-unit">records</span>
                  </div>
                  <div className="stat-footer">All time</div>
                </div>

                <div className="stat-card stat-average">
                  <div className="stat-header">
                    <span className="stat-label">Average</span>
                    <span className="stat-icon">⚖️</span>
                  </div>
                  <div className="stat-body">
                    <span
                      className={`stat-value ${getGlucoseClass(overview.summary.averageGlucose)}`}
                    >
                      {overview.summary.averageGlucose ?? "—"}
                    </span>
                    <span className="stat-unit">mg/dL</span>
                  </div>
                  <div className="stat-footer">All-time average</div>
                </div>

                <div className="stat-card stat-highest">
                  <div className="stat-header">
                    <span className="stat-label">Highest</span>
                    <span className="stat-icon">📈</span>
                  </div>
                  <div className="stat-body">
                    <span className="stat-value">
                      {overview.summary.highestGlucose ?? "—"}
                    </span>
                    <span className="stat-unit">mg/dL</span>
                  </div>
                  <div className="stat-footer">Peak glucose</div>
                </div>

                <div className="stat-card stat-lowest">
                  <div className="stat-header">
                    <span className="stat-label">Lowest</span>
                    <span className="stat-icon">📉</span>
                  </div>
                  <div className="stat-body">
                    <span className="stat-value">
                      {overview.summary.lowestGlucose ?? "—"}
                    </span>
                    <span className="stat-unit">mg/dL</span>
                  </div>
                  <div className="stat-footer">Minimum recorded</div>
                </div>
              </div>

              <div className="profile-meta-card">
                <h3 className="section-title">Patient Information</h3>
                <div className="profile-meta-grid">
                  <div>
                    <span className="meta-label">Name</span>
                    <span className="meta-value">{overview.patient.name}</span>
                  </div>
                  <div>
                    <span className="meta-label">Email</span>
                    <span className="meta-value">{overview.patient.email}</span>
                  </div>
                  <div>
                    <span className="meta-label">Member Since</span>
                    <span className="meta-value">
                      {formatDate(overview.patient.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="meta-label">First Reading</span>
                    <span className="meta-value">
                      {formatDate(overview.summary.firstReadingDate)}
                    </span>
                  </div>
                  <div>
                    <span className="meta-label">Latest Reading</span>
                    <span className="meta-value">
                      {formatDate(overview.summary.latestReadingDate)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== READINGS TAB ===== */}
      {subTab === "readings" && (
        <div className="profile-tab-content">
          {readingsLoading && (
            <div className="loading-container">
              <div className="spinner" />
              <p className="loading-text">Loading readings…</p>
            </div>
          )}
          {readingsError && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{readingsError}</span>
            </div>
          )}
          {!readingsLoading && !readingsError && readings.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3 className="empty-title">No readings recorded</h3>
              <p className="empty-desc">
                This patient has not logged any glucose readings yet.
              </p>
            </div>
          )}

          {!readingsLoading && readings.length > 0 && (
            <>
              <div className="readings-table-wrapper">
                <table className="readings-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Meal Slot</th>
                      <th>Glucose (mg/dL)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((r) => (
                      <tr key={r.id}>
                        <td>{r.date}</td>
                        <td>
                          <span className="slot-badge">{r.slot}</span>
                        </td>
                        <td>
                          <strong>{r.value}</strong>
                        </td>
                        <td>
                          <span
                            className={`glucose-pill ${getGlucoseBadgeClass(r.value)}`}
                          >
                            {r.value < 70
                              ? "Low"
                              : r.value <= 140
                              ? "Normal"
                              : r.value <= 199
                              ? "Elevated"
                              : "High"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination-row">
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => setReadingsPage((p) => Math.max(1, p - 1))}
                    disabled={readingsPage <= 1}
                  >
                    ← Previous
                  </button>
                  <span className="page-info">
                    Page {readingsPage} of {pagination.pages} (
                    {pagination.total} total)
                  </span>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() =>
                      setReadingsPage((p) => Math.min(pagination.pages, p + 1))
                    }
                    disabled={readingsPage >= pagination.pages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== REPORTS TAB ===== */}
      {subTab === "reports" && (
        <div className="profile-tab-content">
          <div className="report-controls">
            <div className="report-period-tabs">
              {[
                { key: "daily", label: "Daily" },
                { key: "mtd", label: "Month to Date" },
                { key: "monthly", label: "Previous Month" },
              ].map((p) => (
                <button
                  key={p.key}
                  className={`report-period-btn ${reportPeriod === p.key ? "active" : ""}`}
                  onClick={() => setReportPeriod(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="report-date-picker">
              <label htmlFor="report-date" className="form-label">
                Select Date
              </label>
              <input
                id="report-date"
                type="date"
                className="form-input"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>

          {reportLoading && (
            <div className="loading-container">
              <div className="spinner" />
              <p className="loading-text">Loading report…</p>
            </div>
          )}
          {reportError && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{reportError}</span>
            </div>
          )}

          {!reportLoading && report && (
            <>
              <div className="report-label-row">
                <span className="report-display-label">
                  {report.displayLabel}
                </span>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Readings</span>
                    <span className="stat-icon">📋</span>
                  </div>
                  <div className="stat-body">
                    <span className="stat-value">
                      {report.summary.count ?? "—"}
                    </span>
                    <span className="stat-unit">total</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Average</span>
                    <span className="stat-icon">⚖️</span>
                  </div>
                  <div className="stat-body">
                    <span className="stat-value">
                      {report.summary.average ?? "—"}
                    </span>
                    <span className="stat-unit">mg/dL</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Highest</span>
                    <span className="stat-icon">📈</span>
                  </div>
                  <div className="stat-body">
                    <span className="stat-value">
                      {report.summary.highest ?? "—"}
                    </span>
                    <span className="stat-unit">mg/dL</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Lowest</span>
                    <span className="stat-icon">📉</span>
                  </div>
                  <div className="stat-body">
                    <span className="stat-value">
                      {report.summary.lowest ?? "—"}
                    </span>
                    <span className="stat-unit">mg/dL</span>
                  </div>
                </div>
              </div>

              {report.readings.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3 className="empty-title">No readings in this period</h3>
                </div>
              )}

              {report.readings.length > 0 && (
                <div className="readings-table-wrapper">
                  <table className="readings-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Meal Slot</th>
                        <th>Glucose (mg/dL)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.readings.map((r) => (
                        <tr key={r.id}>
                          <td>{r.date}</td>
                          <td>
                            <span className="slot-badge">{r.slot}</span>
                          </td>
                          <td>
                            <strong>{r.value}</strong>
                          </td>
                          <td>
                            <span
                              className={`glucose-pill ${getGlucoseBadgeClass(r.value)}`}
                            >
                              {r.value < 70
                                ? "Low"
                                : r.value <= 140
                                ? "Normal"
                                : r.value <= 199
                                ? "Elevated"
                                : "High"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== CHART TAB ===== */}
      {subTab === "chart" && (
        <div className="profile-tab-content">
          <ChartTab patientId={patientId} />
        </div>
      )}
    </section>
  );
}

/**
 * ChartTab — fetches ALL patient readings for chart visualization.
 * Separated as its own component so the fetch only runs when chart tab is open.
 *
 * 🎓 Why split into a sub-component?
 *    If ChartTab is a child component, its `useEffect` only runs when it is MOUNTED.
 *    When the user switches to another tab, ChartTab unmounts and no wasted fetches occur.
 */
function ChartTab({ patientId }) {
  const [allReadings, setAllReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch up to 200 readings for chart display
    api
      .get(`/doctor/patients/${patientId}/readings`, {
        params: { page: 1, limit: 200 },
      })
      .then((res) => setAllReadings(res.data.readings || []))
      .catch((err) =>
        setError(err.response?.data?.error || "Unable to load chart data.")
      )
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="loading-text">Loading chart data…</p>
      </div>
    );

  if (error)
    return (
      <div className="alert alert-error">
        <span className="alert-icon">⚠️</span>
        <span>{error}</span>
      </div>
    );

  return <GlucoseChart readings={allReadings} />;
}

export default DoctorPatientProfile;

