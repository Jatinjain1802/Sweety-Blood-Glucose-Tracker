import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

/**
 * DoctorSignup Component
 * ----------------------
 * Allows healthcare professionals to securely register as doctors
 * using the server-side authorized registration code.
 *
 * 🎓 Key Concepts:
 * 1. Controlled forms: State holds current values, updating via handleChange.
 * 2. Visual harmony: Uses the exact same auth-wrapper and card styling as patient signup.
 * 3. Security: Role cannot be spoofed on client; backend validates secret key.
 */
function DoctorSignup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    doctorSecret: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/doctor-signup", form);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/doctor-dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-background-shape shape-1"></div>
      <div className="auth-background-shape shape-2"></div>

      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-badge">🩺 Doctor Portal</div>
          <h1 className="auth-title">Doctor Registration</h1>
          <p className="auth-subtitle">
            Register as a verified healthcare professional
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name (with Title)</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-control"
              placeholder="e.g. Dr. Priya Sharma"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Professional Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              placeholder="doctor@hospital.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="doctorSecret">Doctor Registration Code</label>
            <input
              id="doctorSecret"
              name="doctorSecret"
              type="password"
              className="form-control"
              placeholder="Enter authorized code"
              value={form.doctorSecret}
              onChange={handleChange}
              required
            />
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Provided by Sweety Administration. Contact support if you need a code.
            </p>
          </div>

          <button
            type="submit"
            className="btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-loading-content">
                <span className="spinner-sm"></span> Registering...
              </span>
            ) : (
              "Complete Doctor Registration"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already registered?{" "}
            <Link to="/login" className="auth-link">
              Log in
            </Link>
          </p>
          <p style={{ marginTop: "0.5rem" }}>
            Registering as a patient?{" "}
            <Link to="/signup" className="auth-link">
              Patient signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default DoctorSignup;
