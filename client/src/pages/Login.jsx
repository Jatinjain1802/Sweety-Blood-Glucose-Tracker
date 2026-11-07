
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

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

            navigate("/dashboard");
        } catch (err) {
            setError(err.response?.data?.error || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>🌸 Sweety</h1>
                <p className="subtitle">Your health, one reading at a time.</p>

                <h2>Welcome Back!</h2>
                <p>Login to your account</p>

                <form onSubmit={handleSubmit}>
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />

                    {error && <p className="error">{error}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <p className="auth-link">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
