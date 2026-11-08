import { useState, useEffect } from "react";
import api from "../api/axios";

/**
 * MyDoctor Component
 * ------------------
 * Patient-facing section to find doctors, send requests, and manage access.
 * This is embedded in the patient Dashboard page, not a standalone page.
 *
 * 🎓 React Concepts:
 * 1. Lifting state up: This component manages its own data and uses
 *    callbacks only when the parent needs to know about changes.
 * 2. Debouncing (manual): We refetch the doctor list when the search
 *    input value changes using `useEffect` with `[searchTerm]` as the dependency.
 * 3. Confirmation modal pattern: Before revoking access, we show an
 *    inline confirmation so the user can't accidentally revoke.
 * 4. Optimistic UI: When the user sends a request, we immediately update
 *    local state so the button changes — without waiting for a full refetch.
 */
function MyDoctor() {
  // Active sub-section: 'find' | 'requests' | 'authorized'
  const [section, setSection] = useState("find");

  // ---- Find Doctors ----
  const [searchTerm, setSearchTerm] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState("");
  const [sendingRequestTo, setSendingRequestTo] = useState(null); // doctorId being sent
  const [sendMsg, setSendMsg] = useState("");
  const [sendError, setSendError] = useState("");

  // ---- My Requests ----
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelMsg, setCancelMsg] = useState("");

  // ---- Authorized Doctors ----
  const [authorized, setAuthorized] = useState([]);
  const [authorizedLoading, setAuthorizedLoading] = useState(false);
  const [authorizedError, setAuthorizedError] = useState("");
  const [revokeConfirm, setRevokeConfirm] = useState(null); // { requestId, doctorName }
  const [revokeMsg, setRevokeMsg] = useState("");

  // ---------------------------------------------------------------------------
  // Fetch doctors (re-runs when searchTerm changes)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (section !== "find") return;
    setDoctorsLoading(true);
    setDoctorsError("");
    setSendMsg("");
    setSendError("");

    const params = searchTerm ? { search: searchTerm } : {};
    api
      .get("/patient/doctors", { params })
      .then((res) => setDoctors(res.data.doctors || []))
      .catch((err) =>
        setDoctorsError(err.response?.data?.error || "Unable to load doctors.")
      )
      .finally(() => setDoctorsLoading(false));
  }, [section, searchTerm]);

  // ---------------------------------------------------------------------------
  // Fetch outgoing requests
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (section !== "requests") return;
    setRequestsLoading(true);
    setRequestsError("");
    setCancelMsg("");
    api
      .get("/patient/requests")
      .then((res) => setRequests(res.data.requests || []))
      .catch((err) =>
        setRequestsError(
          err.response?.data?.error || "Unable to load your requests."
        )
      )
      .finally(() => setRequestsLoading(false));
  }, [section]);

  // ---------------------------------------------------------------------------
  // Fetch authorized doctors
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (section !== "authorized") return;
    setAuthorizedLoading(true);
    setAuthorizedError("");
    setRevokeMsg("");
    api
      .get("/patient/authorized-doctors")
      .then((res) => setAuthorized(res.data.doctors || []))
      .catch((err) =>
        setAuthorizedError(
          err.response?.data?.error || "Unable to load authorized doctors."
        )
      )
      .finally(() => setAuthorizedLoading(false));
  }, [section]);

  // ---------------------------------------------------------------------------
  // Send request to a doctor
  // ---------------------------------------------------------------------------
  const handleSendRequest = async (doctorId) => {
    setSendingRequestTo(doctorId);
    setSendMsg("");
    setSendError("");
    try {
      const res = await api.post(`/patient/doctors/${doctorId}/request`);
      setSendMsg(res.data.message);
      // Optimistically update the doctor card's existingRequest state
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctorId
            ? {
                ...d,
                existingRequest: { status: "pending", requestedAt: new Date().toISOString() },
              }
            : d
        )
      );
    } catch (err) {
      setSendError(err.response?.data?.error || "Failed to send request.");
    } finally {
      setSendingRequestTo(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Cancel a pending request
  // ---------------------------------------------------------------------------
  const handleCancel = async (requestId) => {
    setCancellingId(requestId);
    setCancelMsg("");
    try {
      await api.delete(`/patient/requests/${requestId}`);
      setCancelMsg("Request cancelled.");
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setCancelMsg(
        err.response?.data?.error || "Failed to cancel request."
      );
    } finally {
      setCancellingId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Revoke access
  // ---------------------------------------------------------------------------
  const handleRevoke = async () => {
    if (!revokeConfirm) return;
    try {
      await api.delete(`/patient/authorized-doctors/${revokeConfirm.requestId}`);
      setRevokeMsg(
        `Dr. ${revokeConfirm.doctorName}'s access has been revoked.`
      );
      setAuthorized((prev) =>
        prev.filter((d) => d.requestId !== revokeConfirm.requestId)
      );
    } catch (err) {
      setRevokeMsg(err.response?.data?.error || "Failed to revoke access.");
    } finally {
      setRevokeConfirm(null);
    }
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

  const statusBadge = (status) => {
    const map = {
      pending: { cls: "status-pending", label: "Pending" },
      accepted: { cls: "status-accepted", label: "Accepted" },
      rejected: { cls: "status-rejected", label: "Rejected" },
      revoked: { cls: "status-revoked", label: "Revoked" },
    };
    const s = map[status] || { cls: "", label: status };
    return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <section className="card-section my-doctor-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">🩺 My Doctor</h2>
          <p className="section-subtitle">
            Share your glucose records with your healthcare provider.
          </p>
        </div>
      </div>

      {/* Section navigation */}
      <div className="my-doctor-tabs">
        {[
          { key: "find", label: "🔍 Find Doctors" },
          { key: "requests", label: "📤 My Requests" },
          { key: "authorized", label: "✅ Authorized Doctors" },
        ].map((t) => (
          <button
            key={t.key}
            className={`doctor-tab ${section === t.key ? "active" : ""}`}
            onClick={() => setSection(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== FIND DOCTORS ===== */}
      {section === "find" && (
        <div>
          {/* Enhanced Search Header & Input */}
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
                id="doctor-search-input"
                type="text"
                className="doctor-search-input"
                placeholder="Search registered doctors by name or email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Search Status & Quick Filter Chips */}
            <div className="search-meta-row">
              <span className="search-count-badge">
                {doctorsLoading
                  ? "Searching..."
                  : searchTerm
                  ? `Found ${doctors.length} doctor${doctors.length === 1 ? "" : "s"} matching "${searchTerm}"`
                  : `Showing all ${doctors.length} registered doctor${doctors.length === 1 ? "" : "s"}`}
              </span>

              {searchTerm && (
                <button
                  type="button"
                  className="btn-reset-filter"
                  onClick={() => setSearchTerm("")}
                >
                  Reset search
                </button>
              )}
            </div>
          </div>

          {sendMsg && (
            <div className="alert alert-success">
              <span className="alert-icon">✅</span>
              <span>{sendMsg}</span>
            </div>
          )}
          {sendError && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{sendError}</span>
            </div>
          )}

          {doctorsLoading && (
            <div className="loading-container">
              <div className="spinner" />
              <p className="loading-text">Searching doctors…</p>
            </div>
          )}

          {doctorsError && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{doctorsError}</span>
            </div>
          )}

          {!doctorsLoading && !doctorsError && doctors.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🏥</div>
              <h3 className="empty-title">No doctors found</h3>
              <p className="empty-desc">
                {searchTerm
                  ? "No doctors match your search. Try a different name or email."
                  : "No registered doctors are available yet."}
              </p>
            </div>
          )}

          {!doctorsLoading && doctors.length > 0 && (
            <div className="doctor-list">
              {doctors.map((doctor) => {
                const req = doctor.existingRequest;
                const canSend = !req || req.status === "rejected" || req.status === "revoked";

                return (
                  <div className="doctor-find-card" key={doctor.id}>
                    <div className="dfc-info">
                      <div className="drc-avatar">
                        {doctor.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="drc-name">{doctor.name}</h3>
                        <p className="drc-email">{doctor.email}</p>
                        {req && (
                          <div className="dfc-status">
                            {statusBadge(req.status)}
                            <span className="drc-date">
                              {formatDate(req.requestedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="dfc-action">
                      {canSend ? (
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => handleSendRequest(doctor.id)}
                          disabled={sendingRequestTo === doctor.id}
                        >
                          {sendingRequestTo === doctor.id
                            ? "Sending…"
                            : "Request Access"}
                        </button>
                      ) : req.status === "pending" ? (
                        <span className="dfc-sent-label">
                          ⏳ Request sent
                        </span>
                      ) : req.status === "accepted" ? (
                        <span className="dfc-sent-label dfc-accepted">
                          ✅ Access granted
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== MY REQUESTS ===== */}
      {section === "requests" && (
        <div>
          {cancelMsg && (
            <div
              className={`alert ${cancelMsg.startsWith("Failed") ? "alert-error" : "alert-success"}`}
            >
              <span className="alert-icon">
                {cancelMsg.startsWith("Failed") ? "⚠️" : "✅"}
              </span>
              <span>{cancelMsg}</span>
            </div>
          )}

          {requestsLoading && (
            <div className="loading-container">
              <div className="spinner" />
              <p className="loading-text">Loading your requests…</p>
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
              <div className="empty-icon">📤</div>
              <h3 className="empty-title">No requests sent yet</h3>
              <p className="empty-desc">
                Use the{" "}
                <button
                  className="inline-link"
                  onClick={() => setSection("find")}
                >
                  Find Doctors
                </button>{" "}
                tab to send your first access request.
              </p>
            </div>
          )}

          {!requestsLoading && requests.length > 0 && (
            <div className="doctor-list">
              {requests.map((req) => (
                <div className="doctor-find-card" key={req.id}>
                  <div className="dfc-info">
                    <div className="drc-avatar">
                      {req.doctorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="drc-name">{req.doctorName}</h3>
                      <p className="drc-email">{req.doctorEmail}</p>
                      <p className="drc-date">
                        Sent: {formatDate(req.requestedAt)}
                      </p>
                      {req.respondedAt && (
                        <p className="drc-date">
                          Responded: {formatDate(req.respondedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="dfc-action">
                    {statusBadge(req.status)}
                    {req.status === "pending" && (
                      <button
                        className="btn-danger btn-sm"
                        onClick={() => handleCancel(req.id)}
                        disabled={cancellingId === req.id}
                      >
                        {cancellingId === req.id ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== AUTHORIZED DOCTORS ===== */}
      {section === "authorized" && (
        <div>
          {revokeMsg && (
            <div
              className={`alert ${revokeMsg.includes("revoked") ? "alert-success" : "alert-error"}`}
            >
              <span className="alert-icon">
                {revokeMsg.includes("revoked") ? "✅" : "⚠️"}
              </span>
              <span>{revokeMsg}</span>
            </div>
          )}

          {authorizedLoading && (
            <div className="loading-container">
              <div className="spinner" />
              <p className="loading-text">Loading authorized doctors…</p>
            </div>
          )}

          {authorizedError && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{authorizedError}</span>
            </div>
          )}

          {!authorizedLoading && !authorizedError && authorized.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔓</div>
              <h3 className="empty-title">No authorized doctors</h3>
              <p className="empty-desc">
                You have not granted any doctor access to your records. When a
                doctor accepts your request, they will appear here.
              </p>
            </div>
          )}

          {!authorizedLoading && authorized.length > 0 && (
            <div className="doctor-list">
              {authorized.map((doc) => (
                <div className="doctor-find-card" key={doc.requestId}>
                  <div className="dfc-info">
                    <div className="drc-avatar drc-avatar-accepted">
                      {doc.doctorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="drc-name">{doc.doctorName}</h3>
                      <p className="drc-email">{doc.doctorEmail}</p>
                      <p className="drc-date">
                        Access since: {formatDate(doc.accessGrantedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="dfc-action">
                    <span className="status-badge status-accepted">Active</span>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() =>
                        setRevokeConfirm({
                          requestId: doc.requestId,
                          doctorName: doc.doctorName,
                        })
                      }
                    >
                      Revoke Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Revoke Confirmation Modal */}
          {revokeConfirm && (
            <div
              className="modal-backdrop"
              onClick={() => setRevokeConfirm(null)}
              role="presentation"
            >
              <div
                className="modal-dialog"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <div className="modal-icon-warning">⚠️</div>
                  <h3>Revoke Doctor Access?</h3>
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to revoke{" "}
                    <strong>Dr. {revokeConfirm.doctorName}</strong>
                    &apos;s access to your glucose records?
                  </p>
                  <p className="modal-subtext">
                    They will immediately lose the ability to view your records.
                    You can re-send a request later if needed.
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn-secondary"
                    onClick={() => setRevokeConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button className="btn-danger" onClick={handleRevoke}>
                    Yes, Revoke Access
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default MyDoctor;

