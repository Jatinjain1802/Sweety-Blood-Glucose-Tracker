import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

/**
 * DoctorSignup Page
 * -----------------
 * Allows healthcare professionals to register as doctors using a secret code.
 *
 * 🎓 React Concepts:
 * 1. Controlled Inputs: `value={form.name}` + `onChange` keeps React as the
 *    single source of truth for form data — no DOM queries needed.
 * 2. `useState` with an object: We store all form fields in one state object
 *    and use the spread operator `...prev` to update only the changed field.
 * 3. Conditional rendering: The error/success message is only shown when set.
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

  // Update a single field without touching others
  // e.target.name maps to the `name` attribute on each <input>
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent browser's native form submission / page reload
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/doctor-signup", form);
      // Store JWT and user info in localStorage (same pattern as patient login)
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-icon">🩺</span>
          <h1 className="auth-title">Doctor Registration</h1>
          <p className="auth-subtitle">
            Register as a healthcare professional on Sweety
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder="Dr. Firstname Lastname"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="doctor@hospital.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="doctorSecret">
              Doctor Registration Code
            </label>
            <input
              id="doctorSecret"
              name="doctorSecret"
              type="password"
              className="form-input"
              placeholder="Provided by Sweety administration"
              value={form.doctorSecret}
              onChange={handleChange}
              required
            />
            <p className="form-hint">
              This code is provided by the Sweety administration. Contact your
              system administrator if you do not have one.
            </p>
          </div>

          <button
            type="submit"
            className="btn-primary btn-full"
            disabled={loading}
          >
            {loading ? "Registering…" : "Register as Doctor"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
          <p>
            Registering as a patient?{" "}
            <Link to="/signup" className="auth-link">
              Patient sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default DoctorSignup;

