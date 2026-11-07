import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

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

/**
 * Readings Page
 * -------------
 * Logic preserved 100%:
 * - Same state variables: readings, form, editingId, deleteId, error, message, etc.
 * - Same validation (40-600 integer, date cannot be future)
 * - Same API endpoints (GET /readings, POST /readings, PUT /readings/:id, DELETE /readings/:id)
 *
 * Modern UI enhancements:
 * - Clear visual separation between the input form and the data table.
 * - Interactive edit/delete actions with polished hover states.
 * - Smooth accessible confirmation modal for deletions.
 */
function Readings() {
    const [readings, setReadings] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1,
    });
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

    const fetchReadings = async (pageToLoad = currentPage) => {
        try {
            setLoading(true);

            const response = await api.get(
                `/readings?page=${pageToLoad}&limit=20`
            );

            const data = response.data;

            setReadings(Array.isArray(data) ? data : data.readings || []);

            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (err) {
            setError(err.response?.data?.error || "Could not load readings.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReadings(currentPage);
    }, [currentPage]);

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

    // Helper for glucose badge styling
    const getGlucoseBadgeClass = (val) => {
        const num = Number(val);
        if (isNaN(num)) return "badge-neutral";
        if (num < 70) return "badge-warning";
        if (num <= 140) return "badge-success";
        if (num <= 199) return "badge-caution";
        return "badge-danger";
    };

    return (
        <div className="readings-page">
            <Navbar />

            <main className="readings-content">
                {/* Page Title & Breadcrumb */}
                <div className="page-header">
                    <div>
                        <div className="breadcrumbs">
                            <Link to="/dashboard">Dashboard</Link>
                            <span>/</span>
                            <span className="current">Readings</span>
                        </div>
                        <h1 className="page-title">Manage Glucose Readings</h1>
                        <p className="page-subtitle">
                            Record your daily blood glucose measurements and keep an accurate log.
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <section className={`card form-card ${editingId !== null ? "is-editing" : ""}`}>
                    <div className="form-card-header">
                        <div className="form-card-title">
                            <span className="form-card-icon">{editingId !== null ? "✏️" : "➕"}</span>
                            <h3>{editingId !== null ? "Edit Blood Glucose Reading" : "Record New Glucose Reading"}</h3>
                        </div>
                        {editingId !== null && (
                            <span className="badge badge-primary">Editing Mode</span>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="modern-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="date">
                                    Reading Date <span className="req">*</span>
                                </label>
                                <input
                                    id="date"
                                    type="date"
                                    name="date"
                                    value={form.date}
                                    max={today}
                                    onChange={handleChange}
                                    required
                                    className="form-control"
                                />
                                <span className="field-hint">Cannot be a future date</span>
                            </div>

                            <div className="form-group">
                                <label htmlFor="slot">
                                    Meal / Time Slot <span className="req">*</span>
                                </label>
                                <select
                                    id="slot"
                                    name="slot"
                                    value={form.slot}
                                    onChange={handleChange}
                                    required
                                    className="form-control"
                                >
                                    {SLOTS.map((slot) => (
                                        <option key={slot} value={slot}>
                                            {slot}
                                        </option>
                                    ))}
                                </select>
                                <span className="field-hint">Select the timing context</span>
                            </div>

                            <div className="form-group">
                                <label htmlFor="value">
                                    Glucose Level (mg/dL) <span className="req">*</span>
                                </label>
                                <div className="input-with-addon">
                                    <input
                                        id="value"
                                        type="number"
                                        name="value"
                                        min="40"
                                        max="600"
                                        step="1"
                                        placeholder="e.g. 105"
                                        value={form.value}
                                        onChange={handleChange}
                                        required
                                        className="form-control"
                                    />
                                    <span className="input-addon">mg/dL</span>
                                </div>
                                <span className="field-hint">Target range: 70 - 140 mg/dL</span>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-error">
                                <span className="alert-icon">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {message && (
                            <div className="alert alert-success">
                                <span className="alert-icon">✓</span>
                                <span>{message}</span>
                            </div>
                        )}

                        <div className="form-actions-bar">
                            <button type="submit" disabled={saving} className="btn-primary">
                                {saving
                                    ? "Saving..."
                                    : editingId !== null
                                        ? "Update Reading"
                                        : "+ Save Reading"}
                            </button>

                            {editingId !== null && (
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={resetForm}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {/* Readings List / Table Card */}
                <section className="card table-card">
                    <div className="table-card-header">
                        <div>
                            <h3 className="card-heading">Recorded Readings History</h3>
                            <p className="card-subheading">
                                Total {pagination.total} reading{pagination.total === 1 ? "" : "s"} stored
                            </p>
                        </div>

                        {pagination.total > 0 && (
                            <div className="pagination-controls">
                                <button
                                    type="button"
                                    className="btn-pagination"
                                    disabled={currentPage <= 1 || loading}
                                    onClick={() => setCurrentPage((page) => page - 1)}
                                    title="Previous Page"
                                >
                                    ← Previous
                                </button>

                                <span className="pagination-page-indicator">
                                    Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong>
                                </span>

                                <button
                                    type="button"
                                    className="btn-pagination"
                                    disabled={currentPage >= pagination.pages || loading}
                                    onClick={() => setCurrentPage((page) => page + 1)}
                                    title="Next Page"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="loading-container p-4">
                            <div className="spinner"></div>
                            <p className="loading-text">Loading your readings history...</p>
                        </div>
                    ) : readings.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📖</div>
                            <h3 className="empty-title">No readings found</h3>
                            <p className="empty-desc">
                                Use the form above to record your first blood sugar measurement.
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Time Slot</th>
                                        <th>Glucose Value</th>
                                        <th>Status</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {readings.map((reading) => {
                                        const badgeClass = getGlucoseBadgeClass(reading.value);
                                        const statusLabel =
                                            Number(reading.value) < 70
                                                ? "Low"
                                                : Number(reading.value) <= 140
                                                    ? "Normal"
                                                    : Number(reading.value) <= 199
                                                        ? "Elevated"
                                                        : "High";

                                        return (
                                            <tr key={reading.id}>
                                                <td className="font-medium">
                                                    📅 {String(reading.date).slice(0, 10)}
                                                </td>
                                                <td>
                                                    <span className="slot-badge">{reading.slot}</span>
                                                </td>
                                                <td>
                                                    <strong className="glucose-val">{reading.value}</strong>{" "}
                                                    <span className="unit-label">mg/dL</span>
                                                </td>
                                                <td>
                                                    <span className={`glucose-pill ${badgeClass}`}>
                                                        {statusLabel}
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <div className="action-buttons-group">
                                                        <button
                                                            type="button"
                                                            className="btn-action btn-action-edit"
                                                            onClick={() => handleEdit(reading)}
                                                            title="Edit this entry"
                                                        >
                                                            ✏️ Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn-action btn-action-delete"
                                                            onClick={() => handleDelete(reading.id)}
                                                            title="Delete this entry"
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            {/* Modal Dialog */}
            {deleteId !== null && (
                <div
                    className="modal-backdrop"
                    onClick={() => !deleting && setDeleteId(null)}
                >
                    <div
                        className="modal-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div className="modal-icon-warning">⚠️</div>
                            <h3 id="delete-title">Delete Glucose Reading</h3>
                        </div>

                        <div className="modal-body">
                            <p>Are you sure you want to permanently delete this reading?</p>
                            <p className="modal-subtext">This action cannot be undone and will affect your reports.</p>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setDeleteId(null)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-danger"
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
