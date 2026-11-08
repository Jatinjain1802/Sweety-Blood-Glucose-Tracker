
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DoctorSignup from "./pages/DoctorSignup";
import Dashboard from "./pages/Dashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import Readings from "./pages/Readings";
import Reports from "./pages/Reports";
import MyDoctorPage from "./pages/MyDoctorPage";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";

/**
 * RoleRoute
 * ---------
 * A protected route that also checks the user's role.
 * If the role doesn't match, redirects to the appropriate dashboard.
 *
 * 🎓 Higher-order component pattern:
 *    This component wraps its children and conditionally renders them
 *    based on the `requiredRole` prop vs the stored user role.
 *    If the role doesn't match, we use <Navigate> to redirect — this is
 *    React Router's declarative redirect mechanism.
 */
function RoleRoute({ requiredRole, children }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== requiredRole) {
    // Redirect each role to their own home
    const redirect = user.role === "doctor" ? "/doctor-dashboard" : "/dashboard";
    return <Navigate to={redirect} replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/doctor-signup" element={<DoctorSignup />} />

        {/* Protected routes — any authenticated user */}
        <Route element={<ProtectedRoute />}>
          {/* Patient-only routes */}
          <Route
            path="/dashboard"
            element={
              <RoleRoute requiredRole="patient">
                <Dashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/readings"
            element={
              <RoleRoute requiredRole="patient">
                <Readings />
              </RoleRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleRoute requiredRole="patient">
                <Reports />
              </RoleRoute>
            }
          />
          <Route
            path="/my-doctor"
            element={
              <RoleRoute requiredRole="patient">
                <MyDoctorPage />
              </RoleRoute>
            }
          />
          <Route
            path="/doctor"
            element={<Navigate to="/my-doctor" replace />}
          />

          {/* Doctor-only routes */}
          <Route
            path="/doctor-dashboard"
            element={
              <RoleRoute requiredRole="doctor">
                <DoctorDashboard />
              </RoleRoute>
            }
          />

          {/* Shared routes */}
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
