import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  Shield,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Phone,
  UserPlus,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function SignupPage() {
  const { t, i18n } = useTranslation();
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState(i18n.language || "en");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim() || !email.trim() || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setError(t("auth.passMinChar", "Password must be at least 6 characters."));
      return;
    }

    setLoading(true);

    try {
      await signup({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        preferredLanguage,
        phone: phone.trim(),
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Signup submit error:", err);
      const msg =
        err.message && !err.message.includes("fetch")
          ? err.message
          : "Unable to create account. Please verify server connection or try a different email.";
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
        <div className="auth-card-signup">
          <div className="auth-card-header">
            <div className="auth-header-icon">
              <UserPlus style={{ width: 24, height: 24 }} />
            </div>
            <h2 className="auth-card-title">{t("auth.signUpTitle", "Join KuralAI Platform")}</h2>
            <p className="auth-card-subtitle">
              {t("auth.signUpSubtitle", "Create an account to report civic issues in your language")}
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
                <label className="form-label">{t("auth.fullName", "Full Name")} *</label>
                <div className="input-with-icon">
                  <User className="input-icon" style={{ width: 16, height: 16 }} />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ramanathan Kumar"
                    className="form-input"
                  />
                </div>
              </div>

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
                <div className="flex justify-between items-center" style={{ marginBottom: "0.25rem" }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>{t("auth.password", "Password")} *</label>
                  <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>Min 6 characters</span>
                </div>
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

              {/* Form Row: Language & Phone */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label className="form-label">{t("auth.preferredLanguage", "Preferred Language")}</label>
                  <div className="input-with-icon">
                    <Globe className="input-icon" style={{ width: 16, height: 16 }} />
                    <select
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="form-input form-select"
                    >
                      <option value="en">English</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="hi">हिंदी (Hindi)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t("auth.phone", "Phone (Optional)")}</label>
                  <div className="input-with-icon">
                    <Phone className="input-icon" style={{ width: 16, height: 16 }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full" style={{ marginTop: "0.5rem" }}>
                {loading ? (
                  <>
                    <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus style={{ width: 16, height: 16 }} />
                    <span>{t("auth.signUpBtn", "Create Account")}</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-card-footer" style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              <span>{t("auth.alreadyHaveAccount", "Already registered?")} </span>
              <Link to="/login" className="auth-link">
                {t("nav.login", "Sign In")}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="site-footer text-center">
        <p>© 2026 KuralAI. Multilingual Citizen Registration.</p>
      </footer>
    </div>
  );
}
