import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Route guard that checks both authentication AND user role.
 * Usage: <Route element={<RoleProtectedRoute allowedRoles={["official", "admin"]} />}>
 */
const RoleProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner spinner-lg"></div>
        <span>Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="page-container" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <div className="card" style={{ maxWidth: 480, margin: "0 auto", padding: "2rem" }}>
          <h2 style={{ color: "var(--color-danger)", marginBottom: "1rem" }}>Access Denied</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            You do not have the required permissions to access this page.
          </p>
          <a href="/dashboard" className="btn btn-primary">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export default RoleProtectedRoute;
