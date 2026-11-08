import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

/**
 * Signup Component
 * ----------------
 * Logic preserved 100%:
 * - Controlled inputs with `form` state
 * - POST /auth/signup request with axios
 * - Stores JWT token and user profile in localStorage
 * - Redirects to /dashboard on success
 *
 * Visual Enhancements:
 * - Ambient background styling
 * - Branded emblem card with clear typography
 * - Modern inputs with focus outlines and error alerts
 */
function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("/auth/signup", form);

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.error || "Signup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-background-shape shape-1"></div>
            <div className="auth-background-shape shape-2"></div>

            <div className="auth-card">
                {/* Brand Logo Header */}
                <div className="auth-header">
                    <div className="brand-badge">🌸 Sweety</div>
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">
                        Start your journey toward balanced blood sugar levels
                    </p>
                </div>

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            placeholder="e.g. Sweety Sharma"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="name@example.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            placeholder="Minimum 6 characters"
                            value={form.password}
                            onChange={handleChange}
                            minLength={6}
                            required
                            className="form-control"
                        />
                        <span className="field-hint">Must be at least 6 characters</span>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            <span className="alert-icon">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="btn-primary btn-block">
                        {loading ? (
                            <span className="btn-loading-content">
                                <span className="spinner-sm"></span> Creating account...
                            </span>
                        ) : (
                            "Create Your Account"
                        )}
                    </button>
                </form>

                {/* Footer Switcher */}
                <div className="auth-footer">
                    <p>
                        Already have an account?{" "}
                        <Link to="/login" className="auth-link">
                            Log in
                        </Link>
                    </p>
                    <p style={{ marginTop: "0.5rem" }}>
                        Healthcare professional?{" "}
                        <Link to="/doctor-signup" className="auth-link">
                            Doctor registration
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Signup;
