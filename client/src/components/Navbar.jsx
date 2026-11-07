import { Link, useLocation, useNavigate } from "react-router-dom";

/**
 * Navbar Component
 * ----------------
 * Learning points for React & Javascript:
 * 1. useLocation(): React Router hook to read the current URL pathname.
 *    We use it to determine which navigation link is active and apply an 'active' CSS class.
 * 2. useNavigate(): Programmatically navigate the user after logging out.
 * 3. localStorage: Access browser storage to get user profile details and clean up on logout.
 */
function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Safely parse user from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Readings", path: "/readings" },
    { label: "Reports", path: "/reports" },
  ];

  return (
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
            onClick={handleLogout}
            title="Log out of your account"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;

