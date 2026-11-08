import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

/**
 * Login Component
 * ---------------
 * Logic preserved 100%:
 * - Controlled inputs with `form` state
 * - POST /auth/login request with axios
 * - Stores JWT token and user profile in localStorage
 * - Redirects to /dashboard on success
 *
 * Visual Enhancements:
 * - Ambient background styling
 * - Branded emblem card with clear typography
 * - Modern inputs with focus outlines and error alerts
 */
function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
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
            const response = await api.post("/auth/login", form);

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            const targetRoute = response.data.user?.role === "doctor" ? "/doctor-dashboard" : "/dashboard";
            navigate(targetRoute);
        } catch (err) {
            setError(err.response?.data?.error || "Login failed. Please try again.");
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
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">
                        Log in to monitor and manage your blood sugar levels
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="auth-form">
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
                            placeholder="Enter your password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="form-control"
                        />
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
                                <span className="spinner-sm"></span> Logging in...
                            </span>
                        ) : (
                            "Log In to Dashboard"
                        )}
                    </button>
                </form>

                {/* Footer Switcher */}
                <div className="auth-footer">
                    <p>
                        Don't have an account?{" "}
                        <Link to="/signup" className="auth-link">
                            Create an account
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

export default Login;
