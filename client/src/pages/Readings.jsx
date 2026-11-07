
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";


const SLOTS = [
    "Morning fasting",
    "After breakfast",
    "After lunch",
    "After dinner",
];

function getLocalDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 10);
}

function Readings() {
    const [readings, setReadings] = useState([]);
    const [form, setForm] = useState({
        date: getLocalDate(),
        slot: SLOTS[0],
        value: "",
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const today = getLocalDate();

    const fetchReadings = async () => {
        try {
            setLoading(true);
            const response = await api.get("/readings");
            const data = response.data;

            setReadings(Array.isArray(data) ? data : data.readings || []);
        } catch (err) {
            setError(err.response?.data?.error || "Could not load readings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReadings();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setForm({
            date: today,
            slot: SLOTS[0],
            value: "",
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        const value = Number(form.value);

        if (!Number.isInteger(value) || value < 40 || value > 600) {
            setError("Enter a whole number between 40 and 600.");
            return;
        }

        if (form.date > today) {
            setError("Reading date cannot be in the future.");
            return;
        }

        const payload = {
            date: form.date,
            slot: form.slot,
            value,
        };

        try {
            setSaving(true);

            if (editingId !== null) {
                await api.put(`/readings/${editingId}`, payload);
                setMessage("Reading updated successfully.");
            } else {
                await api.post("/readings", payload);
                setMessage("Reading added successfully.");
            }

            resetForm();
            await fetchReadings();
        } catch (err) {
            setError(
                err.response?.data?.error || "Could not save the reading."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (reading) => {
        setEditingId(reading.id);
        setForm({
            date: String(reading.date).slice(0, 10),
            slot: reading.slot,
            value: String(reading.value),
        });
        setError("");
        setMessage("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = (id) => {
        setError("");
        setMessage("");
        setDeleteId(id); // opens the modal
    };

    const confirmDelete = async () => {
        try {
            setDeleting(true);
            await api.delete(`/readings/${deleteId}`);
            setMessage("Reading deleted successfully.");

            if (editingId === deleteId) resetForm();

            await fetchReadings();
        } catch (err) {
            setError(
                err.response?.data?.error || "Could not delete the reading."
            );
        } finally {
            setDeleting(false);
            setDeleteId(null); // closes the modal
        }
    };
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && !deleting && setDeleteId(null);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [deleting]);

    return (

        <div className="readings-page">
            <header className="dashboard-header">
                <div>
                    <h1>🌸 Sweety</h1>
                    <p>Blood Glucose Tracker</p>
                </div>
                <Link to="/dashboard" className="back-link">
                    ← Dashboard
                </Link>
            </header>

            <main className="readings-content">
                <h2>Manage Glucose Readings</h2>
                <p className="dashboard-subtitle">
                    Keep track of your daily blood glucose measurements.
                </p>

                <section className="reading-form-card">
                    <h3>{editingId !== null ? "Edit Reading" : "Add New Reading"}</h3>

                    <form onSubmit={handleSubmit} className="reading-form">
                        <div>
                            <label htmlFor="date">Reading Date</label>
                            <input
                                id="date"
                                type="date"
                                name="date"
                                value={form.date}
                                max={today}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="slot">Time Slot</label>
                            <select
                                id="slot"
                                name="slot"
                                value={form.slot}
                                onChange={handleChange}
                                required
                            >
                                {SLOTS.map((slot) => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="value">Glucose Value (mg/dL)</label>
                            <input
                                id="value"
                                type="number"
                                name="value"
                                min="40"
                                max="600"
                                step="1"
                                placeholder="e.g. 110"
                                value={form.value}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {error && <p className="error">{error}</p>}
                        {message && <p className="success-message">{message}</p>}

                        <div className="form-actions">
                            <button type="submit" disabled={saving}>
                                {saving
                                    ? "Saving..."
                                    : editingId !== null
                                        ? "Update Reading"
                                        : "Add Reading"}
                            </button>

                            {editingId !== null && (
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                <section className="readings-table-card">
                    <h3>Your Readings</h3>

                    {loading ? (
                        <p>Loading readings...</p>
                    ) : readings.length === 0 ? (
                        <p className="empty-message">No readings found. Add your first reading above.</p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="readings-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Time Slot</th>
                                        <th>Value (mg/dL)</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {readings.map((reading) => (
                                        <tr key={reading.id}>
                                            <td>{String(reading.date).slice(0, 10)}</td>
                                            <td>{reading.slot}</td>
                                            <td>{reading.value}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        type="button"
                                                        className="edit-btn"
                                                        onClick={() => handleEdit(reading)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="delete-btn"
                                                        onClick={() => handleDelete(reading.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
            {deleteId !== null && (
                <div
                    className="modal-overlay"
                    onClick={() => !deleting && setDeleteId(null)}
                >
                    <div
                        className="modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 id="delete-title">Delete Reading?</h3>
                        <p>Are you sure you want to delete this reading? This cannot be undone.</p>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => setDeleteId(null)}
                                disabled={deleting}
                            >
                                No
                            </button>
                            <button
                                type="button"
                                className="delete-btn"
                                onClick={confirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Readings;
