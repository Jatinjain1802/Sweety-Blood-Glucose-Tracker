import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

/**
 * ============================================================================
 * 🌸 SWEETY — MAIN NAVIGATION COMPONENT
 * ============================================================================
 *
 * 🎓 React & JavaScript Concepts Explained:
 *
 * 1. State-Driven Modal Visibility (`useState`):
 *    - Instead of showing a browser-native alert or confirm dialog (which blocks
 *      the main thread and cannot be styled), we manage a local boolean flag
 *      `showLogoutModal`.
 *    - When `true`, React mounts the modal markup into the DOM with smooth CSS animations.
 *
 * 2. Event Bubbling & `e.stopPropagation()`:
 *    - The modal has two layers: the outer `.modal-backdrop` and inner `.modal-dialog`.
 *    - Clicking the backdrop triggers `onClick={() => setShowLogoutModal(false)}` to dismiss.
 *    - However, clicks inside `.modal-dialog` would naturally bubble up to the backdrop!
 *    - Calling `e.stopPropagation()` on the dialog prevents the click from reaching
 *      the backdrop, ensuring users can interact with text and buttons inside without
 *      accidentally closing the modal.
 *
 * 3. Keyboard Accessibility with `useEffect`:
 *    - Good UX dictates that users can dismiss modals with the "Escape" key.
 *    - We attach a `keydown` event listener to `window` inside `useEffect`, and
 *      CRUCIALLY return a cleanup function (`removeEventListener`) to prevent
 *      memory leaks when the component unmounts.
 * ============================================================================
 */
function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // State to control logout confirmation modal visibility
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Safely parse user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  // Handle confirmation: purge session and redirect to Landing Page
  const confirmLogout = () => {
    // 1. Clear session tokens and cached user data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // 2. Close modal
    setShowLogoutModal(false);

    // 3. Programmatically redirect to the public landing page ("/")
    navigate("/");
  };

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showLogoutModal) {
        setShowLogoutModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLogoutModal]);

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Readings", path: "/readings" },
    { label: "Reports", path: "/reports" },
  ];

  return (
    <>
      <header className="app-navbar">
        <div className="navbar-container">
          {/* Brand Logo & Title */}
          <Link to="/dashboard" className="navbar-brand">
            <div className="brand-icon">🌸</div>
            <div className="brand-text">
              <span className="brand-name">Sweety</span>
              <span className="brand-tagline">Blood Glucose Tracker</span>
            </div>
          </Link>

          {/* Navigation Tabs */}
          <nav className="navbar-nav">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive ? "active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout Action */}
          <div className="navbar-actions">
            <div className="user-badge" title={`Logged in as ${userName}`}>
              <span className="user-avatar">{userInitial}</span>
              <span className="user-name">{userName}</span>
            </div>

            <button
              type="button"
              className="btn-logout"
              onClick={() => setShowLogoutModal(true)}
              title="Log out of your account"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowLogoutModal(false)}
          role="presentation"
        >
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-icon-warning" aria-hidden="true">🌸</div>
              <h3 id="logout-modal-title">Log Out of Sweety?</h3>
            </div>

            <div className="modal-body">
              <p>
                Are you sure you want to end your current session, <strong>{userName}</strong>?
              </p>
              <p className="modal-subtext">
                You will be returned to the landing page and will need to log in again to record or review your blood glucose readings.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmLogout}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
