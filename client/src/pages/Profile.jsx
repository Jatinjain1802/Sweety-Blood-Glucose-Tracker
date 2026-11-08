import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

/**
 * ============================================================================
 * 🌸 SWEETY — USER PROFILE & HEALTH PREFERENCES PAGE
 * ============================================================================
 *
 * 🎓 React, State Management & Security Concepts Explained:
 *
 * 1. Synchronizing Local & Remote State:
 *    - User profile data is fetched from the server via `GET /api/auth/profile`.
 *    - When the user modifies their name, we update both the backend database
 *      and browser `localStorage`. This ensures the Navbar avatar and greeting
 *      update instantly across the entire application without needing a page refresh!
 *
 * 2. Secure Form Submission (Password Changes):
 *    - Client-side validation checks that the new password meets length rules and
 *      matches confirmation before any network payload is sent.
 *    - Both `currentPassword` and `newPassword` are sent over TLS/HTTPS with the
 *      JWT Bearer token to protect against unauthorized tampering.
 *
 * 3. Client-Side Preferences Persistence (`localStorage`):
 *    - Personal targets (e.g. Fasting Target, Post-Meal Target, preferred Units)
 *      are saved directly into browser storage so patients can customize their
 *      target zones according to their endocrinologist's recommendations!
 * ============================================================================
 */
function Profile() {
    const cachedUser = JSON.parse(localStorage.getItem("user") || "{}");

    // Profile state
    const [name, setName] = useState(cachedUser.name || "");
    const [email, setEmail] = useState(cachedUser.email || "");
    const [createdAt, setCreatedAt] = useState("");
    const [totalReadings, setTotalReadings] = useState(0);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Health target preferences (stored in localStorage)
    const [preferences, setPreferences] = useState(() => {
        const saved = localStorage.getItem("sweety_preferences");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                // fallback to default
            }
        }
        return {
            fastingMin: 70,
            fastingMax: 99,
            postMealMax: 140,
            hypoThreshold: 70,
            unit: "mg/dL",
        };
    });

    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: "", message: "" });
    const [prefSaved, setPrefSaved] = useState(false);

    // Fetch live profile details on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/auth/profile");
                if (response.data?.user) {
                    const u = response.data.user;
                    setName(u.name || "");
                    setEmail(u.email || "");
                    setCreatedAt(u.created_at ? new Date(u.created_at).toLocaleDateString() : "Member");
                    setTotalReadings(u.totalReadings || 0);

                    // Update localStorage if name changed
                    localStorage.setItem("user", JSON.stringify(u));
                }
            } catch (err) {
                // If API profile route is not reached, fall back gracefully to cachedUser
                setCreatedAt("Member");
            }
        };

        fetchProfile();
    }, []);

    // Save Health Target Preferences
    const handleSavePreferences = (e) => {
        e.preventDefault();
        localStorage.setItem("sweety_preferences", JSON.stringify(preferences));
        setPrefSaved(true);
        setTimeout(() => setPrefSaved(false), 3000);
    };

    // Update Profile / Change Password
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setFeedback({ type: "", message: "" });

        if (newPassword) {
            if (newPassword.length < 6) {
                setFeedback({
                    type: "error",
                    message: "New password must be at least 6 characters long.",
                });
                return;
            }
            if (newPassword !== confirmPassword) {
                setFeedback({
                    type: "error",
                    message: "New password and confirmation do not match.",
                });
                return;
            }
            if (!currentPassword) {
                setFeedback({
                    type: "error",
                    message: "Current password is required to set a new password.",
                });
                return;
            }
        }

        setLoading(true);

        try {
            const payload = {
                name: name.trim(),
            };
            if (newPassword) {
                payload.currentPassword = currentPassword;
                payload.newPassword = newPassword;
            }

            const response = await api.put("/auth/profile", payload);

            // Update cached user in localStorage
            if (response.data?.user) {
                localStorage.setItem("user", JSON.stringify(response.data.user));
            }

            setFeedback({
                type: "success",
                message: response.data?.message || "Profile updated successfully!",
            });

            // Clear password inputs on success
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setFeedback({
                type: "error",
                message:
                    err.response?.data?.error ||
                    "Unable to update profile. Please check your current password.",
            });
        } finally {
            setLoading(false);
        }
    };

    // Export Profile summary as JSON
    const handleExportProfileData = () => {
        const profileData = {
            user: { name, email, createdAt, totalReadings },
            preferences,
            exportedAt: new Date().toISOString(),
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profileData, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `sweety_profile_${name.toLowerCase().replace(/\s+/g, "_")}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    const userInitial = (name || "U").charAt(0).toUpperCase();

    return (
        <div className="profile-page">
            <Navbar />

            <main className="profile-content">
                {/* Header & Breadcrumbs */}
                <div className="page-header">
                    <div>
                        <div className="breadcrumbs">
                            <Link to="/dashboard">Dashboard</Link>
                            <span>/</span>
                            <span className="current">User Profile</span>
                        </div>
                        <h1 className="page-title">My Profile & Health Settings</h1>
                        <p className="page-subtitle">
                            Manage your personal credentials, target clinical ranges, and measurement preferences.
                        </p>
                    </div>
                </div>

                {/* Profile Overview Card */}
                <section className="card profile-overview-card">
                    <div className="profile-header-group">
                        <div className="profile-avatar-large">
                            {userInitial}
                        </div>
                        <div className="profile-identity">
                            <h2 className="profile-name">{name || "Sweety User"}</h2>
                            <p className="profile-email">✉️ {email}</p>
                            <div className="profile-badges">
                                <span className="profile-badge badge-active">● Active Account</span>
                                <span className="profile-badge badge-neutral">🗓️ Joined: {createdAt}</span>
                                <span className="profile-badge badge-records">📊 {totalReadings} Logged Readings</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Notifications Alert */}
                {feedback.message && (
                    <div className={`alert ${feedback.type === "error" ? "alert-error" : "alert-success"}`}>
                        <span className="alert-icon">{feedback.type === "error" ? "⚠️" : "✓"}</span>
                        <span>{feedback.message}</span>
                    </div>
                )}

                <div className="profile-grid">
                    {/* 1. Account Details & Password Change */}
                    <section className="card profile-card">
                        <div className="card-header">
                            <span className="card-icon">👤</span>
                            <div>
                                <h3 className="card-heading">Account Credentials</h3>
                                <p className="card-subheading">Update display name and password</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="profile-form">
                            <div className="form-group">
                                <label htmlFor="profileName">Full Display Name</label>
                                <input
                                    id="profileName"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="form-control"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="profileEmail">Registered Email</label>
                                <input
                                    id="profileEmail"
                                    type="email"
                                    value={email}
                                    disabled
                                    className="form-control form-control-disabled"
                                    title="Email is permanent and tied to your account records"
                                />
                                <span className="field-hint">Primary email address (used for secure sign in)</span>
                            </div>

                            <div className="form-divider" />
                            <h4 className="form-section-title">Change Password (Optional)</h4>

                            <div className="form-group">
                                <label htmlFor="currentPassword">Current Password</label>
                                <input
                                    id="currentPassword"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password to authorize changes"
                                    className="form-control"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="newPassword">New Password</label>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Minimum 6 characters"
                                        className="form-control"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm New Password</label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat new password"
                                        className="form-control"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading}
                            >
                                {loading ? "Saving Changes..." : "Save Account Changes"}
                            </button>
                        </form>
                    </section>

                    {/* 2. Personalized Health Targets & Preferences */}
                    <section className="card profile-card">
                        <div className="card-header">
                            <span className="card-icon">🎯</span>
                            <div>
                                <h3 className="card-heading">Clinical Glucose Targets</h3>
                                <p className="card-subheading">Customize target thresholds per your doctor's care plan</p>
                            </div>
                        </div>

                        {prefSaved && (
                            <div className="alert alert-success">
                                <span className="alert-icon">✓</span>
                                <span>Glucose targets updated successfully!</span>
                            </div>
                        )}

                        <form onSubmit={handleSavePreferences} className="profile-form">
                            <div className="form-group">
                                <label htmlFor="unit">Measurement Unit</label>
                                <select
                                    id="unit"
                                    value={preferences.unit}
                                    onChange={(e) =>
                                        setPreferences({ ...preferences, unit: e.target.value })
                                    }
                                    className="form-control"
                                >
                                    <option value="mg/dL">mg/dL (Milligrams per deciliter - Standard US/India)</option>
                                    <option value="mmol/L">mmol/L (Millimoles per liter - Standard UK/Canada)</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="fastingMin">Fasting Target Min (mg/dL)</label>
                                    <input
                                        id="fastingMin"
                                        type="number"
                                        value={preferences.fastingMin}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                fastingMin: Number(e.target.value),
                                            })
                                        }
                                        className="form-control"
                                    />
                                    <span className="field-hint">ADA standard: 70 mg/dL</span>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="fastingMax">Fasting Target Max (mg/dL)</label>
                                    <input
                                        id="fastingMax"
                                        type="number"
                                        value={preferences.fastingMax}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                fastingMax: Number(e.target.value),
                                            })
                                        }
                                        className="form-control"
                                    />
                                    <span className="field-hint">ADA standard: 99 mg/dL</span>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="postMealMax">Post-Meal Target Max (mg/dL)</label>
                                    <input
                                        id="postMealMax"
                                        type="number"
                                        value={preferences.postMealMax}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                postMealMax: Number(e.target.value),
                                            })
                                        }
                                        className="form-control"
                                    />
                                    <span className="field-hint">ADA standard: &lt; 140 mg/dL</span>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="hypoThreshold">Hypo Alert Level (mg/dL)</label>
                                    <input
                                        id="hypoThreshold"
                                        type="number"
                                        value={preferences.hypoThreshold}
                                        onChange={(e) =>
                                            setPreferences({
                                                ...preferences,
                                                hypoThreshold: Number(e.target.value),
                                            })
                                        }
                                        className="form-control"
                                    />
                                    <span className="field-hint">Warning threshold (&lt; 70 mg/dL)</span>
                                </div>
                            </div>

                            <div className="profile-actions-row">
                                <button type="submit" className="btn-secondary">
                                    Update Target Guidelines
                                </button>
                                <button
                                    type="button"
                                    className="btn-link"
                                    onClick={handleExportProfileData}
                                    title="Export profile configuration as JSON"
                                >
                                    💾 Export Profile Data
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default Profile;

