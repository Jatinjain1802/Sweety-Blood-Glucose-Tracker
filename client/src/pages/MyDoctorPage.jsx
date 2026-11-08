import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import MyDoctor from "../components/MyDoctor";

/**
 * ============================================================================
 * 🩺 SWEETY — PATIENT "MY DOCTOR" PAGE
 * ============================================================================
 *
 * 🎓 React & UX Architecture Concepts:
 *
 * 1. Dedicated Portal View:
 *    - Elevates doctor discovery and consent access management from a nested section
 *      into a dedicated top-level page linked directly in the navigation bar.
 *
 * 2. Breadcrumb Navigation:
 *    - Provides contextual orientation (`Dashboard > My Doctor`), making it
 *      easy for patients to navigate between their health metrics and care team.
 * ============================================================================
 */
function MyDoctorPage() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard-content">
        {/* Page Breadcrumbs & Title */}
        <div className="page-header" style={{ marginBottom: "24px" }}>
          <div>
            <div className="breadcrumbs">
              <Link to="/dashboard">Dashboard</Link>
              <span>/</span>
              <span className="current">My Doctor</span>
            </div>
            <h1 className="page-title">Healthcare Providers & Doctor Access</h1>
            <p className="page-subtitle">
              Connect with registered physicians, share your blood glucose records securely, and manage medical consent.
            </p>
          </div>
        </div>

        {/* Hero Welcome Banner */}
        <section className="welcome-banner" style={{ marginBottom: "28px" }}>
          <div className="welcome-info">
            <span className="welcome-pill">🩺 Care Team Portal</span>
            <h1 className="welcome-title">
              Hello, {user.name || "Patient"}! <span className="wave">👋</span>
            </h1>
            <p className="welcome-subtitle">
              You remain in 100% control of your private health data. Doctors can only view your readings and reports after you send an access request and they accept.
            </p>
          </div>
        </section>

        {/* Embedded Full MyDoctor Component */}
        <MyDoctor />
      </main>
    </div>
  );
}

export default MyDoctorPage;

