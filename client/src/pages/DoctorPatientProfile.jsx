import { useState, useEffect } from "react";
import api from "../api/axios";
import GlucoseChart from "../components/GlucoseChart";

/**
 * ============================================================================
 * 🩺 DOCTOR PATIENT PROFILE — COMPREHENSIVE CLINICAL VIEW
 * ============================================================================
 *
 * 🎓 React & Architecture Concepts:
 *
 * 1. Read-Only Clinical Access Enforcement:
 *    - Explicitly surfaces to the doctor that patient glucose records are
 *      read-only per HIPAA and health data privacy principles.
 *
 * 2. Independent Tab Life-Cycles:
 *    - Each sub-tab (Overview, Readings, Reports, Charts) manages its own
 *      fetching lifecycle with independent loading & error states.
 *
 * 3. Re-usable Chart Integration:
 *    - The same powerful Recharts multi-view component used by patients is
 *      reused here, providing doctors with Area, Line, Bar, Meal-Slot averages,
 *      and ADA Target Range distribution.
 * ============================================================================
 */
function DoctorPatientProfile({ patient, onBack }) {
  // Sub-tabs: 'overview' | 'readings' | 'reports' | 'chart'
  const [subTab, setSubTab] = useState("overview");

  // Overview data
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState("");

  // Paginated Readings
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
  // 1. Fetch Overview
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    if (subTab === "overview") {
      api
        .get(`/doctor/patients/${patientId}`)
        .then((res) => {
          if (isMounted) {
            setOverview(res.data);
            setOverviewError("");
          }
        })
        .catch((err) => {
          if (isMounted) {
            setOverviewError(
              err.response?.data?.error || "Unable to load patient profile."
            );
          }
        })
        .finally(() => {
          if (isMounted) setOverviewLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [patientId, subTab]);

  // ---------------------------------------------------------------------------
  // 2. Fetch Paginated Readings
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    if (subTab === "readings") {
      api
        .get(`/doctor/patients/${patientId}/readings`, {
          params: { page: readingsPage, limit: 20 },
        })
        .then((res) => {
          if (isMounted) {
            setReadings(res.data.readings || []);
            setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
            setReadingsError("");
          }
        })
        .catch((err) => {
          if (isMounted) {
            setReadingsError(
              err.response?.data?.error || "Unable to load patient readings."
            );
          }
        })
        .finally(() => {
          if (isMounted) setReadingsLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [patientId, subTab, readingsPage]);

  // ---------------------------------------------------------------------------
  // 3. Fetch Reports (Daily / Month to Date / Monthly)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    if (subTab === "reports") {
      const periodPath = reportPeriod === "mtd" ? "month-to-date" : reportPeriod;
      api
        .get(`/doctor/patients/${patientId}/reports/${periodPath}`, {
          params: { date: reportDate },
        })
        .then((res) => {
          if (isMounted) {
            setReport(res.data);
            setReportError("");
          }
        })
        .catch((err) => {
          if (isMounted) {
            setReportError(
              err.response?.data?.error || "Unable to load clinical report."
            );
          }
        })
        .finally(() => {
          if (isMounted) setReportLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
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

  const getGlucoseBadgeClass = (val) => {
    const num = Number(val);
    if (isNaN(num) || val === null) return "badge-neutral";
    if (num < 70) return "badge-warning";
    if (num <= 140) return "badge-success";
    if (num <= 199) return "badge-caution";
    return "badge-danger";
  };

  return (
    <section className="doctor-profile-section">
      {/* Back button & Breadcrumbs */}
      <div className="profile-back-row">
        <button className="btn-back" onClick={onBack}>
          ← Back to Enrolled Patients
        </button>
      </div>

      {/* Patient Header Banner */}
      <div className="patient-profile-header">
        <div className="drc-avatar drc-avatar-lg drc-avatar-accepted">
          {patient.patientName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h2 className="profile-patient-name">{patient.patientName}</h2>
            <span className="status-badge status-accepted">● Active Care Consent</span>
          </div>
          <p className="profile-patient-email">✉️ {patient.patientEmail}</p>
          <div className="profile-badges" style={{ marginTop: "6px" }}>
            <span className="profile-badge badge-neutral">
              🛡️ Read-Only Clinical View
            </span>
            <span className="profile-badge badge-neutral">
              📅 Access Granted: {formatDate(patient.accessGrantedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="profile-sub-tabs">
        {[
          { key: "overview", label: "📋 Clinical Overview" },
          { key: "readings", label: "📝 All Glucose Readings" },
          { key: "reports", label: "📊 Periodic Reports" },
          { key: "chart", label: "📈 Trend Analytics & Charts" },
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

      {/* ===== 1. OVERVIEW TAB ===== */}
      {subTab === "overview" && (
        <div className="profile-tab-content">
          {overviewLoading && (
            <div className="loading-container">
              <div className="spinner" />
              <p className="loading-text">Loading patient clinical profile…</p>
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
              {/* 4 Stat Cards */}
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
                  <div className="stat-footer">All-time logged measurements</div>
                </div>

                <div className="stat-card stat-average">
                  <div className="stat-header">
                    <span className="stat-label">All-Time Average</span>
                    <span className="stat-icon">⚖️</span>
                  </div>
                  <div className="stat-body">
                    <span className="stat-value">
                      {overview.summary.averageGlucose ?? "—"}
                    </span>
                    <span className="stat-unit">mg/dL</span>
                  </div>
                  <div className="stat-footer">Calculated historical mean</div>
                </div>

                <div className="stat-card stat-highest">
                  <div className="stat-header">
                    <span className="stat-label">Peak Reading</span>
                    <span className="stat-icon">📈</span>
                  </div>
                  <div className="stat-body">
                    <span className="stat-value">
                      {overview.summary.highestGlucose ?? "—"}
                    </span>
                    <span className="stat-unit">mg/dL</span>
                  </div>
                  <div className="stat-footer">Highest recorded glucose</div>
                </div>

                <div className="stat-card stat-lowest">
                  <div className="stat-header">
                    <span className="stat-label">Lowest Reading</span>
                    <span className="stat-icon">📉</span>
                  </div>
                  <div className="stat-body">
                    <span className="stat-value">
                      {overview.summary.lowestGlucose ?? "—"}
                    </span>
                    <span className="stat-unit">mg/dL</span>
                  </div>
                  <div className="stat-footer">Minimum recorded level</div>
                </div>
              </div>

              {/* Patient Profile Card */}
              <div className="profile-meta-card">
                <h3 className="section-title">Patient Medical Profile</h3>
                <div className="profile-meta-grid">
                  <div>
                    <span className="meta-label">Patient Name</span>
                    <span className="meta-value">{overview.patient.name}</span>
                  </div>
                  <div>
                    <span className="meta-label">Email Address</span>
                    <span className="meta-value">{overview.patient.email}</span>
                  </div>
                  <div>
                    <span className="meta-label">Enrolled Member Since</span>
                    <span className="meta-value">
                      {formatDate(overview.patient.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="meta-label">First Recorded Reading</span>
                    <span className="meta-value">
                      {overview.summary.firstReadingDate
                        ? formatDate(overview.summary.firstReadingDate)
                        : "No readings"}
                    </span>
                  </div>
                  <div>
                    <span className="meta-label">Latest Recorded Reading</span>
                    <span className="meta-value">
                      {overview.summary.latestReadingDate
                        ? formatDate(overview.summary.latestReadingDate)
                        : "No readings"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== 2. ALL READINGS TAB ===== */}
      {subTab === "readings" && (
        <div className="profile-tab-content">
          {readingsLoading && (
            <div className="loading-container">
              <div className="spinner" />
              <p className="loading-text">Loading historical readings…</p>
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
              <h3 className="empty-title">No Readings Recorded</h3>
              <p className="empty-desc">
                This patient has not logged any blood glucose measurements yet.
              </p>
            </div>
          )}

          {!readingsLoading && readings.length > 0 && (
            <>
              <div className="table-responsive card" style={{ padding: 0, overflow: "hidden", marginTop: "16px" }}>
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Meal Slot</th>
                      <th>Glucose (mg/dL)</th>
                      <th>Clinical Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.date}</strong>
                        </td>
                        <td>
                          <span className="slot-badge">{r.slot}</span>
                        </td>
                        <td>
                          <span className="glucose-val">{r.value}</span>{" "}
                          <span className="unit-label">mg/dL</span>
                        </td>
                        <td>
                          <span
                            className={`glucose-pill ${getGlucoseBadgeClass(r.value)}`}
                          >
                            {r.value < 70
                              ? "● Low (<70)"
                              : r.value <= 140
                              ? "● Normal (70–140)"
                              : r.value <= 199
                              ? "● Elevated (141–199)"
                              : "● High (200+)"}
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
                    ← Previous Page
                  </button>
                  <span className="page-info">
                    Page <strong>{readingsPage}</strong> of{" "}
                    <strong>{pagination.pages}</strong> ({pagination.total} total logs)
                  </span>
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() =>
                      setReadingsPage((p) => Math.min(pagination.pages, p + 1))
                    }
                    disabled={readingsPage >= pagination.pages}
                  >
                    Next Page →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== 3. PERIODIC REPORTS TAB ===== */}
      {subTab === "reports" && (
        <div className="profile-tab-content">
          <div className="report-controls">
            <div className="report-period-tabs">
              {[
                { key: "daily", label: "📅 Daily Report" },
                { key: "mtd", label: "🗓️ Month to Date" },
                { key: "monthly", label: "⏮️ Previous Month" },
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
              <label htmlFor="report-date" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                Target Date:
              </label>
              <input
                id="report-date"
                type="date"
                className="form-control"
                style={{ width: "auto", padding: "8px 12px" }}
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>

          {reportLoading && (
            <div className="loading-container">
              <div className="spinner" />
              <p className="loading-text">Generating report analysis…</p>
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
                  📊 {report.displayLabel}
                </span>
              </div>

              {/* Period Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card stat-total">
                  <div className="stat-header">
                    <span className="stat-label">Readings in Period</span>
                    <span className="stat-icon">📋</span>
                  </div>
                  <div className="stat-body">
                    <span className="stat-value">
                      {report.summary.count ?? 0}
                    </span>
                    <span className="stat-unit">records</span>
                  </div>
                </div>

                <div className="stat-card stat-average">
                  <div className="stat-header">
                    <span className="stat-label">Period Average</span>
                    <span className="stat-icon">⚖️</span>
                  </div>
                  <div className="stat-body">
                    <span className="stat-value">
                      {report.summary.average ?? "—"}
                    </span>
                    <span className="stat-unit">mg/dL</span>
                  </div>
                </div>

                <div className="stat-card stat-highest">
                  <div className="stat-header">
                    <span className="stat-label">Period Peak</span>
                    <span className="stat-icon">📈</span>
                  </div>
                  <div className="stat-body">
                    <span className="stat-value">
                      {report.summary.highest ?? "—"}
                    </span>
                    <span className="stat-unit">mg/dL</span>
                  </div>
                </div>

                <div className="stat-card stat-lowest">
                  <div className="stat-header">
                    <span className="stat-label">Period Minimum</span>
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

              {report.readings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📊</div>
                  <h3 className="empty-title">No Readings in Selected Period</h3>
                  <p className="empty-desc">
                    The patient did not record glucose entries matching this date range.
                  </p>
                </div>
              ) : (
                <div className="table-responsive card" style={{ padding: 0, overflow: "hidden", marginTop: "20px" }}>
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Meal Slot</th>
                        <th>Glucose (mg/dL)</th>
                        <th>Clinical Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.readings.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.date}</strong>
                          </td>
                          <td>
                            <span className="slot-badge">{r.slot}</span>
                          </td>
                          <td>
                            <span className="glucose-val">{r.value}</span>{" "}
                            <span className="unit-label">mg/dL</span>
                          </td>
                          <td>
                            <span
                              className={`glucose-pill ${getGlucoseBadgeClass(r.value)}`}
                            >
                              {r.value < 70
                                ? "● Low (<70)"
                                : r.value <= 140
                                ? "● Normal (70–140)"
                                : r.value <= 199
                                ? "● Elevated (141–199)"
                                : "● High (200+)"}
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

      {/* ===== 4. TREND CHARTS TAB ===== */}
      {subTab === "chart" && (
        <div className="profile-tab-content">
          <ChartTab patientId={patientId} />
        </div>
      )}
    </section>
  );
}

/**
 * ChartTab — Isolated Component for Recharts Performance Optimization
 */
function ChartTab({ patientId }) {
  const [allReadings, setAllReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch comprehensive reading history for timeline visualization
    api
      .get(`/doctor/patients/${patientId}/readings`, {
        params: { page: 1, limit: 200 },
      })
      .then((res) => setAllReadings(res.data.readings || []))
      .catch((err) =>
        setError(err.response?.data?.error || "Unable to load visual chart history.")
      )
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="loading-text">Loading interactive glucose analytics…</p>
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
