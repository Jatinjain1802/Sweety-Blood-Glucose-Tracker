import { useState, useEffect } from "react";
import api from "../api/axios";

/**
 * ============================================================================
 * 🩺 SWEETY — PATIENT "MY DOCTOR" PORTAL & CONSENT ACCESS MANAGER
 * ============================================================================
 *
 * 🎓 React & UI Architecture Concepts:
 *
 * 1. Controlled Search & Instant Filtering:
 *    - Search input is controlled via `searchTerm` state.
 *    - Debounced/triggered on change via `useEffect` with clean dependency tracking.
 *
 * 2. Consent Management & Safety Modals:
 *    - Revoking access or cancelling pending requests is state-driven with
 *      confirmation modals to prevent accidental medical record disconnects.
 *
 * 3. Dual Export (Default + Named):
 *    - `export { MyDoctor }; export default MyDoctor;` ensures zero import mismatch
 *      whether consumed as default or destructured import in Vite/React.
 * ============================================================================
 */
function MyDoctor() {
  // Active sub-section: 'find' | 'requests' | 'authorized'
  const [section, setSection] = useState("find");

  // ---- Find Doctors ----
  const [searchTerm, setSearchTerm] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorsError, setDoctorsError] = useState("");
  const [sendingRequestTo, setSendingRequestTo] = useState(null);
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
  const [revokeConfirm, setRevokeConfirm] = useState(null);
  const [revokeMsg, setRevokeMsg] = useState("");

  // ---------------------------------------------------------------------------
  // Synchronized Data Fetcher Effect with Unmount Cleanup
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    if (section === "find") {
      const params = searchTerm ? { search: searchTerm } : {};
      api
        .get("/patient/doctors", { params })
        .then((res) => {
          if (isMounted) {
            setDoctors(res.data.doctors || []);
            setDoctorsError("");
          }
        })
        .catch((err) => {
          if (isMounted) {
            setDoctorsError(
              err.response?.data?.error || "Unable to load doctors."
            );
          }
        })
        .finally(() => {
          if (isMounted) setDoctorsLoading(false);
        });
    } else if (section === "requests") {
      api
        .get("/patient/requests")
        .then((res) => {
          if (isMounted) {
            setRequests(res.data.requests || []);
            setRequestsError("");
          }
        })
        .catch((err) => {
          if (isMounted) {
            setRequestsError(
              err.response?.data?.error || "Unable to load your requests."
            );
          }
        })
        .finally(() => {
          if (isMounted) setRequestsLoading(false);
        });
    } else if (section === "authorized") {
      api
        .get("/patient/authorized-doctors")
        .then((res) => {
          if (isMounted) {
            setAuthorized(res.data.doctors || []);
            setAuthorizedError("");
          }
        })
        .catch((err) => {
          if (isMounted) {
            setAuthorizedError(
              err.response?.data?.error || "Unable to load authorized doctors."
            );
          }
        })
        .finally(() => {
          if (isMounted) setAuthorizedLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [section, searchTerm]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleSendRequest = async (doctorId) => {
    setSendingRequestTo(doctorId);
    setSendMsg("");
    setSendError("");
    try {
      const res = await api.post(`/patient/doctors/${doctorId}/request`);
      setSendMsg(res.data.message || "Request sent successfully!");
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctorId
            ? {
                ...d,
                existingRequest: {
                  status: "pending",
                  requestedAt: new Date().toISOString(),
                },
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

  const handleCancel = async (requestId) => {
    setCancellingId(requestId);
    setCancelMsg("");
    try {
      await api.delete(`/patient/requests/${requestId}`);
      setCancelMsg("Request cancelled successfully.");
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setCancelMsg(
        err.response?.data?.error || "Failed to cancel request."
      );
    } finally {
      setCancellingId(null);
    }
  };

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
      pending: { cls: "status-pending", label: "Pending Review" },
      accepted: { cls: "status-accepted", label: "Access Active" },
      rejected: { cls: "status-rejected", label: "Declined" },
      revoked: { cls: "status-revoked", label: "Revoked" },
    };
    const s = map[status] || { cls: "", label: status };
    return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
  };

  return (
    <section className="card-section my-doctor-section">
      <div className="section-header">
        <div>
          <h2 className="section-title">🩺 My Doctor & Healthcare Team</h2>
          <p className="section-subtitle">
            Authorize healthcare providers to securely review your blood glucose trends and reports.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="my-doctor-tabs">
        {[
          { key: "find", label: "🔍 Find & Connect Doctors" },
          { key: "requests", label: "📤 Outgoing Requests" },
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

      {/* ===== 1. FIND DOCTORS ===== */}
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
                  &times;
                </button>
              )}
            </div>

            {/* Live Search Status */}
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
              <p className="loading-text">Loading registered doctors…</p>
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
              <h3 className="empty-title">No Doctors Found</h3>
              <p className="empty-desc">
                {searchTerm
                  ? `No registered healthcare providers matched "${searchTerm}". Try a different name or email.`
                  : "No registered doctors are available in the directory yet."}
              </p>
            </div>
          )}

          {!doctorsLoading && doctors.length > 0 && (
            <div className="doctor-list">
              {doctors.map((doctor) => {
                const req = doctor.existingRequest;
                const canSend =
                  !req || req.status === "rejected" || req.status === "revoked";

                return (
                  <div className="doctor-find-card" key={doctor.id}>
                    <div className="dfc-info">
                      <div className="drc-avatar">
                        {doctor.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="drc-name">{doctor.name}</h3>
                        <p className="drc-email">✉️ {doctor.email}</p>
                        {req && (
                          <div className="dfc-status">
                            {statusBadge(req.status)}
                            <span className="drc-date">
                              📅 {formatDate(req.requestedAt)}
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
                            ? "Sending..."
                            : "Request Access"}
                        </button>
                      ) : req.status === "pending" ? (
                        <span className="dfc-sent-label">
                          ⏳ Request pending review
                        </span>
                      ) : req.status === "accepted" ? (
                        <span className="dfc-sent-label dfc-accepted">
                          ✅ Active medical access
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

      {/* ===== 2. OUTGOING REQUESTS ===== */}
      {section === "requests" && (
        <div>
          {cancelMsg && (
            <div
              className={`alert ${
                cancelMsg.includes("cancelled") ? "alert-success" : "alert-error"
              }`}
            >
              <span className="alert-icon">
                {cancelMsg.includes("cancelled") ? "✅" : "⚠️"}
              </span>
              <span>{cancelMsg}</span>
            </div>
          )}

          {requestsLoading && (
            <div className="loading-container">
              <div className="spinner" />
              <p className="loading-text">Loading your access requests…</p>
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
              <h3 className="empty-title">No Pending Requests</h3>
              <p className="empty-desc">
                You have no active requests sent to doctors. Use the{" "}
                <button
                  className="inline-link"
                  onClick={() => setSection("find")}
                >
                  Find Doctors
                </button>{" "}
                tab to send your first clinical access request.
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
                      <p className="drc-email">✉️ {req.doctorEmail}</p>
                      <p className="drc-date">
                        📅 Sent on: {formatDate(req.requestedAt)}
                      </p>
                      {req.respondedAt && (
                        <p className="drc-date">
                          ⚡ Responded: {formatDate(req.respondedAt)}
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
                        {cancellingId === req.id
                          ? "Cancelling..."
                          : "Cancel Request"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== 3. AUTHORIZED DOCTORS ===== */}
      {section === "authorized" && (
        <div>
          {revokeMsg && (
            <div
              className={`alert ${
                revokeMsg.includes("revoked") ? "alert-success" : "alert-error"
              }`}
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
              <h3 className="empty-title">No Authorized Doctors</h3>
              <p className="empty-desc">
                You have not granted any healthcare provider access to your records yet.
                Once a doctor accepts your request, they will appear here and you can manage or revoke their access at any time.
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
                      <p className="drc-email">✉️ {doc.doctorEmail}</p>
                      <p className="drc-date">
                        🛡️ Consent Granted: {formatDate(doc.accessGrantedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="dfc-action">
                    <span className="status-badge status-accepted">● Active Care</span>
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
                    &apos;s access to your blood glucose records?
                  </p>
                  <p className="modal-subtext">
                    They will immediately lose access to your medical readings, reports, and charts. You can re-send a request at any time.
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

export { MyDoctor };
export default MyDoctor;
