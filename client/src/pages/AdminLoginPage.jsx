import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
  ArrowLeft,
  SlidersHorizontal,
} from "lucide-react";

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const requestedFrom =
    typeof location.state?.from === "string"
      ? location.state.from
      : location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(t("auth.fillAllFields", "Please fill in all required fields."));
      return;
    }

    setLoading(true);

    try {
      const loggedUser = await login(email, password, undefined, "admin");

      if (loggedUser?.role !== "admin") {
        await logout();
        setError(t("auth.adminOnlyError", "Access denied. This portal is strictly restricted to system administrators."));
        return;
      }

      let destination = "/admin/dashboard";
      if (requestedFrom && requestedFrom.startsWith("/admin")) {
        destination = requestedFrom;
      }
      navigate(destination, { replace: true });
    } catch (err) {
      console.error("Admin login error:", err);
      const msg =
        err.message && !err.message.includes("fetch")
          ? err.message
          : t("auth.loginFailedMsg", "Unable to sign in. Please verify your credentials.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Top Header */}
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="header-brand">
            <div className="brand-icon">
              <Shield style={{ width: 18, height: 18 }} />
            </div>
            <span className="brand-title">KuralAI</span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/" className="nav-link flex items-center gap-1">
              <ArrowLeft style={{ width: 14, height: 14 }} />
              <span>{t("auth.backToHome", "Back to Home")}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Centered Auth Form */}
      <main className="auth-content-area">
        <div className="auth-card-login" style={{ borderColor: "rgba(220, 60, 60, 0.25)" }}>
          <div className="auth-card-header">
            <div
              className="auth-header-icon"
              style={{ background: "rgba(220, 60, 60, 0.12)", color: "#dc3c3c" }}
            >
              <SlidersHorizontal style={{ width: 24, height: 24 }} />
            </div>
            <h2 className="auth-card-title">{t("auth.adminSignInTitle", "Administrator Portal")}</h2>
            <p className="auth-card-subtitle">
              {t("auth.adminSignInSubtitle", "Authorized personnel only. Secure administrative credentials required.")}
            </p>
          </div>

          <div className="auth-card-body">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">{t("auth.adminEmail", "Admin Email / ID")} *</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" style={{ width: 16, height: 16 }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@kural.ai"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t("auth.password", "Password")} *</label>
                <div className="input-with-icon" style={{ position: "relative" }}>
                  <Lock className="input-icon" style={{ width: 16, height: 16 }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "var(--color-text-tertiary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
                style={{ marginTop: "0.5rem", background: "var(--color-navy)" }}
              >
                {loading ? (
                  <>
                    <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                    <span>{t("auth.authenticating", "Authenticating...")}</span>
                  </>
                ) : (
                  <>
                    <LogIn style={{ width: 16, height: 16 }} />
                    <span>{t("auth.adminSignInBtn", "Sign In as Administrator")}</span>
                  </>
                )}
              </button>
            </form>

            <div
              className="auth-card-footer"
              style={{
                marginTop: "1.25rem",
                textAlign: "center",
                fontSize: "0.8125rem",
                color: "var(--color-text-secondary)",
                borderTop: "1px solid var(--border-primary)",
                paddingTop: "0.875rem",
                display: "flex",
                justifyContent: "center",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <Link to="/login" className="auth-link">
                {t("auth.citizenPortalLink", "Citizen Portal Sign In")}
              </Link>
              <span style={{ color: "var(--color-text-tertiary)" }}>•</span>
              <Link to="/departments" className="auth-link">
                {t("auth.departmentsLink", "Departments Selection")}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer text-center">
        <p>© 2026 KuralAI. Secure Administrative Oversight.</p>
      </footer>
    </div>
  );
}
