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
} from "lucide-react";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        err.message && !err.message.includes("fetch")
          ? err.message
          : "Unable to sign in. Please verify your connection and credentials.";
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
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Centered Auth Form */}
      <main className="auth-content-area">
        <div className="auth-card-login">
          <div className="auth-card-header">
            <div className="auth-header-icon">
              <LogIn style={{ width: 24, height: 24 }} />
            </div>
            <h2 className="auth-card-title">{t("auth.signInTitle", "Welcome Back")}</h2>
            <p className="auth-card-subtitle">
              {t("auth.signInSubtitle", "Sign in to manage and track your civic complaints")}
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
                <label className="form-label">{t("auth.email", "Email Address")} *</label>
                <div className="input-with-icon">
                  <Mail className="input-icon" style={{ width: 16, height: 16 }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="citizen@example.com"
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
                    style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--color-text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center" }}
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ marginTop: "0.5rem" }}>
                {loading ? (
                  <>
                    <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn style={{ width: 16, height: 16 }} />
                    <span>{t("auth.signInBtn", "Sign In")}</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-card-footer" style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              <span>{t("auth.noAccount", "Don't have an account?")} </span>
              <Link to="/signup" className="auth-link">
                {t("nav.signup", "Register here")}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer text-center">
        <p>© 2026 KuralAI. Secure Civic Authentication.</p>
      </footer>
    </div>
  );
}
