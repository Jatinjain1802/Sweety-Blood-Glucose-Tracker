import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import DoctorPatientProfile from "./DoctorPatientProfile";

/**
 * ============================================================================
 * 🩺 SWEETY — CLINICAL DOCTOR DASHBOARD
 * ============================================================================
 *
 * 🎓 React & UX Concepts Explained:
 *
 * 1. KPI Metrics Aggregation (`useMemo`):
 *    - Instead of re-calculating stats on every minor render, `useMemo` computes
 *      top-level clinical metrics (Active Patients, Pending Requests, Action Required)
 *      only when `requests` or `patients` arrays change!
 *
 * 2. Multi-Tab Workflow with Breadcrumb Navigation:
 *    - Seamlessly transitions between:
 *      a) Overview & Pending Patient Requests
 *      b) Active Patient Directory (with instant name/email search)
 *      c) Deep Patient Profile (read-only comprehensive charts & reports)
 *
 * 3. Clinical Consent Safeguards:
 *    - Clear visual indicators that pending requests provide only a limited
 *      statistical snapshot, and full medical logs unlock upon acceptance.
 * ============================================================================
 */
function DoctorDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Tab state: 'requests' | 'patients' | 'profile'
  const [activeTab, setActiveTab] = useState("requests");

  // Pending patient requests
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState("");

  // Accepted patients list
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientsError, setPatientsError] = useState("");

  // Filter query in "My Patients" tab
  const [patientSearch, setPatientSearch] = useState("");

  // Selected patient for deep inspection
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Processing state for individual request actions
  const [processingId, setProcessingId] = useState(null);
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");

  // ---------------------------------------------------------------------------
  // Data Fetching & Effect Synchronization
  // ---------------------------------------------------------------------------
  const reloadData = () => {
    setRequestsLoading(true);
    setPatientsLoading(true);
    Promise.all([
      api.get("/doctor/patients/requests"),
      api.get("/doctor/patients"),
    ])
      .then(([reqRes, patRes]) => {
        setRequests(reqRes.data.requests || []);
        setPatients(patRes.data.patients || []);
        setRequestsError("");
        setPatientsError("");
      })
      .catch((err) => {
        setRequestsError(err.response?.data?.error || "Failed to load requests.");
      })
      .finally(() => {
        setRequestsLoading(false);
        setPatientsLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;

    api
      .get("/doctor/patients/requests")
      .then((res) => {
        if (isMounted) {
          setRequests(res.data.requests || []);
          setRequestsError("");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setRequestsError(
            err.response?.data?.error || "Unable to load pending patient requests."
          );
        }
      })
      .finally(() => {
        if (isMounted) setRequestsLoading(false);
      });

    api
      .get("/doctor/patients")
      .then((res) => {
        if (isMounted) {
          setPatients(res.data.patients || []);
          setPatientsError("");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setPatientsError(
            err.response?.data?.error || "Unable to load patient directory."
          );
        }
      })
      .finally(() => {
        if (isMounted) setPatientsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Filtered patients for directory search
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase().trim();
    return patients.filter(
      (p) =>
        (p.patientName && p.patientName.toLowerCase().includes(q)) ||
        (p.patientEmail && p.patientEmail.toLowerCase().includes(q))
    );
  }, [patients, patientSearch]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleAccept = async (requestId) => {
    setProcessingId(requestId);
    setActionMsg("");
    setActionError("");
    try {
      const res = await api.post(
        `/doctor/patients/requests/${requestId}/accept`
      );
      setActionMsg(res.data.message || "Request accepted successfully.");
      // Optimistically remove from requests and reload patients
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      reloadData();
    } catch (err) {
      setActionError(err.response?.data?.error || "Failed to accept request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    setActionMsg("");
    setActionError("");
    try {
      const res = await api.post(
        `/doctor/patients/requests/${requestId}/reject`
      );
      setActionMsg(res.data.message || "Request rejected.");
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setActionError(err.response?.data?.error || "Failed to reject request.");
    } finally {
      setProcessingId(null);
    }
  };

  const openPatientProfile = (patient) => {
    setSelectedPatient(patient);
    setActiveTab("profile");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  // ---------------------------------------------------------------------------
  // Render: Pending Request Card
  // ---------------------------------------------------------------------------
  const renderRequestCard = (req) => (
    <div className="doctor-request-card" key={req.id}>
      <div className="drc-header">
        <div className="drc-patient-info">
          <div className="drc-avatar">
            {req.patientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="drc-name">{req.patientName}</h3>
            <p className="drc-email">✉️ {req.patientEmail}</p>
            <p className="drc-date">
              📅 Request Received: {formatDate(req.requestedAt)}
            </p>
          </div>
        </div>
        <span className="status-badge status-pending">Action Required</span>
      </div>

      {/* Privacy Notice Banner */}
      <div className="drc-privacy-notice">
        <span className="notice-icon">🔒</span>
        <span>
          <strong>Pre-Consent Clinical Summary:</strong> Detailed glucose logs,
          daily reports, and trend charts will be unlocked upon accepting this request.
        </span>
      </div>

      {/* Limited Clinical Summary Grid */}
      <div className="drc-summary-grid">
        <div className="drc-stat">
          <span className="drc-stat-label">Total Readings</span>
          <span className="drc-stat-value">
            {req.patientSummary.totalReadings} <small>logs</small>
          </span>
        </div>

        <div className="drc-stat">
          <span className="drc-stat-label">All-Time Average</span>
          <span className="drc-stat-value">
            <span className={`glucose-pill ${getGlucoseBadgeClass(req.patientSummary.averageGlucose)}`}>
              {req.patientSummary.averageGlucose ?? "—"} mg/dL
            </span>
          </span>
        </div>

        <div className="drc-stat">
          <span className="drc-stat-label">Peak Reading</span>
          <span className="drc-stat-value">
            <span className={`glucose-pill ${getGlucoseBadgeClass(req.patientSummary.highestGlucose)}`}>
              {req.patientSummary.highestGlucose ?? "—"} mg/dL
            </span>
          </span>
        </div>

        <div className="drc-stat">
          <span className="drc-stat-label">Lowest Reading</span>
          <span className="drc-stat-value">
            <span className={`glucose-pill ${getGlucoseBadgeClass(req.patientSummary.lowestGlucose)}`}>
              {req.patientSummary.lowestGlucose ?? "—"} mg/dL
            </span>
          </span>
        </div>

        <div className="drc-stat">
          <span className="drc-stat-label">First Recorded</span>
          <span className="drc-stat-value">
            {req.patientSummary.firstReadingDate
              ? formatDate(req.patientSummary.firstReadingDate)
              : "—"}
          </span>
        </div>

        <div className="drc-stat">
          <span className="drc-stat-label">Latest Recorded</span>
          <span className="drc-stat-value">
            {req.patientSummary.latestReadingDate
              ? formatDate(req.patientSummary.latestReadingDate)
              : "—"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="drc-actions">
        <button
          className="btn-danger btn-sm"
          onClick={() => handleReject(req.id)}
          disabled={processingId === req.id}
        >
          {processingId === req.id ? "Processing..." : "✕ Reject Request"}
        </button>
        <button
          className="btn-success btn-sm"
          onClick={() => handleAccept(req.id)}
          disabled={processingId === req.id}
        >
          {processingId === req.id ? "Processing..." : "✓ Accept & Unlock Records"}
        </button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Active Patient Card
  // ---------------------------------------------------------------------------
  const renderPatientCard = (patient) => (
    <div className="doctor-patient-card" key={patient.patientId}>
      <div className="dpc-header">
        <div className="drc-patient-info">
          <div className="drc-avatar drc-avatar-accepted">
            {patient.patientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="drc-name">{patient.patientName}</h3>
            <p className="drc-email">✉️ {patient.patientEmail}</p>
            <p className="drc-date">
              🛡️ Active Access Since: {formatDate(patient.accessGrantedAt)}
            </p>
          </div>
        </div>
        <span className="status-badge status-accepted">● Active Care</span>
      </div>

      <div className="drc-summary-grid">
        <div className="drc-stat">
          <span className="drc-stat-label">Total Readings</span>
          <span className="drc-stat-value">
            {patient.summary.totalReadings} <small>records</small>
          </span>
        </div>
        <div className="drc-stat">
          <span className="drc-stat-label">Avg. Glucose</span>
          <span className="drc-stat-value">
            <span className={`glucose-pill ${getGlucoseBadgeClass(patient.summary.averageGlucose)}`}>
              {patient.summary.averageGlucose ?? "—"} mg/dL
            </span>
          </span>
        </div>
        <div className="drc-stat">
          <span className="drc-stat-label">Peak Reading</span>
          <span className="drc-stat-value">
            <span className={`glucose-pill ${getGlucoseBadgeClass(patient.summary.highestGlucose)}`}>
              {patient.summary.highestGlucose ?? "—"} mg/dL
            </span>
          </span>
        </div>
        <div className="drc-stat">
          <span className="drc-stat-label">Lowest Reading</span>
          <span className="drc-stat-value">
            <span className={`glucose-pill ${getGlucoseBadgeClass(patient.summary.lowestGlucose)}`}>
              {patient.summary.lowestGlucose ?? "—"} mg/dL
            </span>
          </span>
        </div>
        <div className="drc-stat">
          <span className="drc-stat-label">Latest Log</span>
          <span className="drc-stat-value">
            {patient.summary.latestReadingDate
              ? formatDate(patient.summary.latestReadingDate)
              : "—"}
          </span>
        </div>
      </div>

      <div className="drc-actions">
        <button
          className="btn-primary"
          onClick={() => openPatientProfile(patient)}
        >
          View Full Clinical Profile →
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard-content">
        {/* Hero Greeting & Doctor Profile Banner */}
        <section className="welcome-banner">
          <div className="welcome-info">
            <span className="welcome-pill">🩺 Doctor Care Portal</span>
            <h1 className="welcome-title">
              Welcome, Dr. {user.name || "Doctor"}! <span className="wave">👋</span>
            </h1>
            <p className="welcome-subtitle">
              Review consent-based patient requests and analyze longitudinal blood glucose records.
            </p>
          </div>
          <div className="welcome-actions">
            <button
              className="btn-primary"
              onClick={() => {
                setActiveTab("patients");
                reloadData();
              }}
            >
              👥 My Patients ({patients.length})
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setActiveTab("requests");
                reloadData();
              }}
            >
              📋 Requests ({requests.length})
            </button>
          </div>
        </section>

        {/* Action Notifications */}
        {actionMsg && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            <span>{actionMsg}</span>
          </div>
        )}
        {actionError && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{actionError}</span>
          </div>
        )}

        {/* 4 Clinical Overview Stat Cards */}
        <section className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-header">
              <span className="stat-label">Active Patients</span>
              <span className="stat-icon">👥</span>
            </div>
            <div className="stat-body">
              <span className="stat-value">{patients.length}</span>
              <span className="stat-unit">enrolled</span>
            </div>
            <div className="stat-footer">Authorized consent granted</div>
          </div>

          <div className="stat-card stat-highest">
            <div className="stat-header">
              <span className="stat-label">Pending Requests</span>
              <span className="stat-icon">📋</span>
            </div>
            <div className="stat-body">
              <span className="stat-value">{requests.length}</span>
              <span className="stat-unit">awaiting review</span>
            </div>
            <div className="stat-footer">Requires doctor decision</div>
          </div>

          <div className="stat-card stat-average">
            <div className="stat-header">
              <span className="stat-label">Clinical Scope</span>
              <span className="stat-icon">🩺</span>
            </div>
            <div className="stat-body">
              <span className="stat-value" style={{ fontSize: "1.25rem" }}>
                Diabetology
              </span>
            </div>
            <div className="stat-footer">Registered Healthcare Provider</div>
          </div>

          <div className="stat-card stat-lowest">
            <div className="stat-header">
              <span className="stat-label">Access Mode</span>
              <span className="stat-icon">🛡️</span>
            </div>
            <div className="stat-body">
              <span className="stat-value" style={{ fontSize: "1.25rem" }}>
                Read-Only
              </span>
            </div>
            <div className="stat-footer">Patient-consent protected</div>
          </div>
        </section>

        {/* Doctor Tab Navigation */}
        <div className="doctor-tabs">
          <button
            className={`doctor-tab ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("requests");
              setActionMsg("");
              setActionError("");
            }}
          >
            📋 Pending Requests
            {requests.length > 0 && (
              <span className="tab-badge">{requests.length}</span>
            )}
          </button>

          <button
            className={`doctor-tab ${activeTab === "patients" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("patients");
              setActionMsg("");
              setActionError("");
            }}
          >
            👥 My Patients Directory ({patients.length})
          </button>

          {selectedPatient && (
            <button
              className={`doctor-tab ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              🔍 Patient: {selectedPatient.patientName}
            </button>
          )}
        </div>

        {/* ===== TAB 1: PENDING PATIENT REQUESTS ===== */}
        {activeTab === "requests" && (
          <section className="card-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Incoming Patient Access Requests</h2>
                <p className="section-subtitle">
                  Patients requesting your clinical review of their blood sugar patterns.
                </p>
              </div>
              <button
                className="btn-secondary btn-sm"
                onClick={reloadData}
                disabled={requestsLoading}
              >
                🔄 Refresh
              </button>
            </div>

            {requestsLoading && (
              <div className="loading-container">
                <div className="spinner" />
                <p className="loading-text">Loading incoming requests…</p>
              </div>
            )}

            {requestsError && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{requestsError}</span>
              </div>
            )}

            {!requestsLoading && !requestsError && requests.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3 className="empty-title">All Caught Up!</h3>
                <p className="empty-desc">
                  There are no pending patient requests awaiting your decision.
                  When patients request access using your email (<strong>{user.email}</strong>), they will appear here.
                </p>
              </div>
            )}

            {!requestsLoading && requests.length > 0 && (
              <div className="doctor-requests-list">
                {requests.map(renderRequestCard)}
              </div>
            )}
          </section>
        )}

        {/* ===== TAB 2: MY PATIENTS DIRECTORY ===== */}
        {activeTab === "patients" && (
          <section className="card-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Enrolled Patients Directory</h2>
                <p className="section-subtitle">
                  Patients who have granted you active consent to review their blood glucose records.
                </p>
              </div>
              <button
                className="btn-secondary btn-sm"
                onClick={reloadData}
                disabled={patientsLoading}
              >
                🔄 Refresh Directory
              </button>
            </div>

            {/* Patient Search Bar */}
            {patients.length > 0 && (
              <div className="doctor-search-container">
                <div className="doctor-search-bar">
                  <span className="search-icon" aria-hidden="true">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="doctor-search-input"
                    placeholder="Search enrolled patients by name or email…"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                  />
                  {patientSearch && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setPatientSearch("")}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {patientsLoading && (
              <div className="loading-container">
                <div className="spinner" />
                <p className="loading-text">Loading patients directory…</p>
              </div>
            )}

            {patientsError && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{patientsError}</span>
              </div>
            )}

            {!patientsLoading && !patientsError && patients.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🏥</div>
                <h3 className="empty-title">No Patients Enrolled Yet</h3>
                <p className="empty-desc">
                  You have not accepted any patient access requests yet. Share your registered email (<strong>{user.email}</strong>) with your patients so they can send requests from their dashboard.
                </p>
              </div>
            )}

            {!patientsLoading && patients.length > 0 && filteredPatients.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3 className="empty-title">No Matching Patients Found</h3>
                <p className="empty-desc">
                  No enrolled patients matched &quot;{patientSearch}&quot;.
                </p>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setPatientSearch("")}
                >
                  Clear Search Filter
                </button>
              </div>
            )}

            {!patientsLoading && filteredPatients.length > 0 && (
              <div className="doctor-requests-list">
                {filteredPatients.map(renderPatientCard)}
              </div>
            )}
          </section>
        )}

        {/* ===== TAB 3: DEEP PATIENT PROFILE (READ-ONLY) ===== */}
        {activeTab === "profile" && selectedPatient && (
          <DoctorPatientProfile
            patient={selectedPatient}
            onBack={() => {
              setActiveTab("patients");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}
      </main>
    </div>
  );
}

export default DoctorDashboard;
