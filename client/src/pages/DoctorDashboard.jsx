import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import DoctorPatientProfile from "./DoctorPatientProfile";

/**
 * DoctorDashboard Page
 * --------------------
 * Main interface for authenticated doctors.
 * Has 3 tabs: Pending Requests, My Patients, Patient Profile.
 *
 * 🎓 React Concepts:
 * 1. Tab-based navigation with local state — no URL change needed for sub-tabs.
 * 2. `useEffect` with dependency array — re-fetches when activeTab changes.
 * 3. Lifting state: selectedPatient is managed here and passed to DoctorPatientProfile.
 * 4. Promise.all vs sequential awaits: `useEffect` runs fetches in parallel for speed.
 */
function DoctorDashboard() {
  const navigate = useNavigate();
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

  // Selected patient for the profile tab
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Action feedback (accept/reject messages)
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const fetchRequests = async () => {
    setRequestsLoading(true);
    setRequestsError("");
    try {
      const res = await api.get("/doctor/patients/requests");
      setRequests(res.data.requests || []);
    } catch (err) {
      setRequestsError(
        err.response?.data?.error || "Unable to load patient requests."
      );
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchPatients = async () => {
    setPatientsLoading(true);
    setPatientsError("");
    try {
      const res = await api.get("/doctor/patients");
      setPatients(res.data.patients || []);
    } catch (err) {
      setPatientsError(
        err.response?.data?.error || "Unable to load patients."
      );
    } finally {
      setPatientsLoading(false);
    }
  };

  // 🎓 useEffect runs AFTER the component renders.
  //    The dependency array [activeTab] means: re-run when activeTab changes.
  useEffect(() => {
    if (activeTab === "requests") fetchRequests();
    if (activeTab === "patients") fetchPatients();
  }, [activeTab]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleAccept = async (requestId) => {
    setActionMsg("");
    setActionError("");
    try {
      const res = await api.post(
        `/doctor/patients/requests/${requestId}/accept`
      );
      setActionMsg(res.data.message);
      // Remove from pending list and refresh patients
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setActionError(err.response?.data?.error || "Failed to accept request.");
    }
  };

  const handleReject = async (requestId) => {
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
    }
  };

  const openPatientProfile = (patient) => {
    setSelectedPatient(patient);
    setActiveTab("profile");
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

  const getGlucoseClass = (val) => {
    if (val == null) return "";
    if (val < 70) return "glucose-low";
    if (val <= 140) return "glucose-normal";
    if (val <= 199) return "glucose-elevated";
    return "glucose-high";
  };

  // ---------------------------------------------------------------------------
  // Render helpers
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
            <p className="drc-email">{req.patientEmail}</p>
            <p className="drc-date">
              Requested: {formatDate(req.requestedAt)}
            </p>
          </div>
        </div>
        <span className="status-badge status-pending">Pending</span>
      </div>

      {/* Limited patient summary */}
      <div className="drc-summary-grid">
        <div className="drc-stat">
          <span className="drc-stat-label">Total Readings</span>
          <span className="drc-stat-value">
            {req.patientSummary.totalReadings}
          </span>
        </div>
        <div className="drc-stat">
          <span className="drc-stat-label">Avg. Glucose</span>
          <span
            className={`drc-stat-value ${getGlucoseClass(req.patientSummary.averageGlucose)}`}
          >
            {req.patientSummary.averageGlucose ?? "—"}{" "}
            {req.patientSummary.averageGlucose ? "mg/dL" : ""}
          </span>
        </div>
        <div className="drc-stat">
          <span className="drc-stat-label">Highest</span>
          <span
            className={`drc-stat-value ${getGlucoseClass(req.patientSummary.highestGlucose)}`}
          >
            {req.patientSummary.highestGlucose ?? "—"}{" "}
            {req.patientSummary.highestGlucose ? "mg/dL" : ""}
          </span>
        </div>
        <div className="drc-stat">
          <span className="drc-stat-label">Lowest</span>
          <span
            className={`drc-stat-value ${getGlucoseClass(req.patientSummary.lowestGlucose)}`}
          >
            {req.patientSummary.lowestGlucose ?? "—"}{" "}
            {req.patientSummary.lowestGlucose ? "mg/dL" : ""}
          </span>
        </div>
        <div className="drc-stat">
          <span className="drc-stat-label">First Reading</span>
          <span className="drc-stat-value">
            {req.patientSummary.firstReadingDate
              ? formatDate(req.patientSummary.firstReadingDate)
              : "—"}
          </span>
        </div>
        <div className="drc-stat">
          <span className="drc-stat-label">Latest Reading</span>
          <span className="drc-stat-value">
            {req.patientSummary.latestReadingDate
              ? formatDate(req.patientSummary.latestReadingDate)
              : "—"}
          </span>
        </div>
      </div>

      <div className="drc-actions">
        <button
          className="btn-success"
          onClick={() => handleAccept(req.id)}
        >
          ✓ Accept
        </button>
        <button
          className="btn-danger"
          onClick={() => handleReject(req.id)}
        >
          ✗ Reject
        </button>
      </div>
    </div>
  );

  const renderPatientCard = (patient) => (
    <div className="doctor-patient-card" key={patient.patientId}>
      <div className="dpc-header">
        <div className="drc-patient-info">
          <div className="drc-avatar drc-avatar-accepted">
            {patient.patientName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="drc-name">{patient.patientName}</h3>
            <p className="drc-email">{patient.patientEmail}</p>
            <p className="drc-date">
              Access since: {formatDate(patient.accessGrantedAt)}
            </p>
          </div>
        </div>
        <span className="status-badge status-accepted">Active</span>
      </div>

      <div className="drc-summary-grid">
        <div className="drc-stat">
          <span className="drc-stat-label">Total Readings</span>
          <span className="drc-stat-value">{patient.summary.totalReadings}</span>
        </div>
        <div className="drc-stat">
          <span className="drc-stat-label">Avg. Glucose</span>
          <span
            className={`drc-stat-value ${getGlucoseClass(patient.summary.averageGlucose)}`}
          >
            {patient.summary.averageGlucose ?? "—"}{" "}
            {patient.summary.averageGlucose ? "mg/dL" : ""}
          </span>
        </div>
        <div className="drc-stat">
          <span className="drc-stat-label">Highest</span>
          <span
            className={`drc-stat-value ${getGlucoseClass(patient.summary.highestGlucose)}`}
          >
            {patient.summary.highestGlucose ?? "—"}{" "}
            {patient.summary.highestGlucose ? "mg/dL" : ""}
          </span>
        </div>
        <div className="drc-stat">
          <span className="drc-stat-label">Lowest</span>
          <span
            className={`drc-stat-value ${getGlucoseClass(patient.summary.lowestGlucose)}`}
          >
            {patient.summary.lowestGlucose ?? "—"}{" "}
            {patient.summary.lowestGlucose ? "mg/dL" : ""}
          </span>
        </div>
        <div className="drc-stat">
          <span className="drc-stat-label">Latest Reading</span>
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
          View Full Profile →
        </button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard-content">
        {/* Hero Banner */}
        <section className="welcome-banner">
          <div className="welcome-info">
            <span className="welcome-pill">🩺 Doctor Dashboard</span>
            <h1 className="welcome-title">
              Hello, Dr. {user.name || "Doctor"}!{" "}
              <span className="wave">👋</span>
            </h1>
            <p className="welcome-subtitle">
              Manage patient access requests and review glucose health records.
            </p>
          </div>
        </section>

        {/* Action feedback */}
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

        {/* Tabs */}
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
            👥 My Patients
          </button>
          {selectedPatient && (
            <button
              className={`doctor-tab ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              🔍 {selectedPatient.patientName}
            </button>
          )}
        </div>

        {/* Tab content */}
        {activeTab === "requests" && (
          <section className="card-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">Patient Access Requests</h2>
                <p className="section-subtitle">
                  Review patient requests to share their glucose records with
                  you.
                </p>
              </div>
            </div>

            {requestsLoading && (
              <div className="loading-container">
                <div className="spinner" />
                <p className="loading-text">Loading requests…</p>
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
                <h3 className="empty-title">No pending requests</h3>
                <p className="empty-desc">
                  When patients request access to share their glucose records
                  with you, they will appear here.
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

        {activeTab === "patients" && (
          <section className="card-section">
            <div className="section-header">
              <div>
                <h2 className="section-title">My Patients</h2>
                <p className="section-subtitle">
                  Patients who have granted you access to their glucose records.
                </p>
              </div>
            </div>

            {patientsLoading && (
              <div className="loading-container">
                <div className="spinner" />
                <p className="loading-text">Loading patients…</p>
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
                <h3 className="empty-title">No patients yet</h3>
                <p className="empty-desc">
                  Patients will appear here once you accept their access
                  requests.
                </p>
              </div>
            )}

            {!patientsLoading && patients.length > 0 && (
              <div className="doctor-requests-list">
                {patients.map(renderPatientCard)}
              </div>
            )}
          </section>
        )}

        {activeTab === "profile" && selectedPatient && (
          <DoctorPatientProfile
            patient={selectedPatient}
            onBack={() => setActiveTab("patients")}
          />
        )}
      </main>
    </div>
  );
}

export default DoctorDashboard;

