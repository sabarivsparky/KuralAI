import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authAPI } from "../services/api";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  Shield,
  Building2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Droplets,
  HardHat,
  Zap,
  Trash2,
  HeartPulse,
  Flame,
  Trees,
  Briefcase,
  Waves,
  CloudRain,
} from "lucide-react";

// Department icon helper
function getDeptIcon(code) {
  switch ((code || "").toUpperCase()) {
    case "WATER":
      return Droplets;
    case "SEWER":
      return Waves;
    case "STORM":
      return CloudRain;
    case "ROADS":
      return HardHat;
    case "ELEC":
      return Zap;
    case "SWM":
    case "SANIT":
      return Trash2;
    case "HEALTH":
      return HeartPulse;
    case "SAFETY":
      return Flame;
    case "PARKS":
      return Trees;
    default:
      return Briefcase;
  }
}

export default function DepartmentSelectionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDepts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authAPI.getDepartments();
      setDepartments(data.departments || []);
    } catch (err) {
      console.error("Fetch departments error:", err);
      setError(
        err.message ||
          t("departments.loadError", "Unable to load municipal departments. Please verify backend connection.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  return (
    <div className="landing-page-wrapper" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="site-header" role="banner">
        <div className="container header-inner">
          <Link to="/" className="header-brand" aria-label="KuralAI Home">
            <div className="brand-icon">
              <Shield style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div className="brand-title">KuralAI</div>
              <div className="brand-tagline">Civic AI Platform</div>
            </div>
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

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "3rem 1rem" }}>
        <div className="container" style={{ maxWidth: 1040 }}>
          {/* Page Heading */}
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                background: "rgba(36, 124, 120, 0.12)",
                color: "var(--color-teal)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
              }}
            >
              <Building2 style={{ width: 14, height: 14 }} />
              <span>{t("departments.badge", "Government & Municipal Services")}</span>
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.5rem" }}>
              {t("departments.title", "Select Your Department")}
            </h1>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "1rem", maxWidth: 600, margin: "0 auto" }}>
              {t(
                "departments.subtitle",
                "Choose your assigned municipal agency to enter your official staff login and duty complaint queue."
              )}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="alert alert-error"
              style={{ maxWidth: 600, margin: "0 auto 2rem auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
              <button onClick={fetchDepts} className="btn btn-sm btn-outline" style={{ gap: "0.25rem" }}>
                <RefreshCw style={{ width: 12, height: 12 }} />
                {t("common.retry", "Retry")}
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <Loader2
                style={{
                  width: 36,
                  height: 36,
                  color: "var(--color-teal)",
                  margin: "0 auto 1rem auto",
                  animation: "spin 1s linear infinite",
                }}
              />
              <p style={{ color: "var(--color-text-secondary)" }}>
                {t("departments.loading", "Loading active municipal departments...")}
              </p>
            </div>
          ) : departments.length === 0 ? (
            /* Empty State */
            <div
              className="card"
              style={{ padding: "3rem", textAlign: "center", maxWidth: 500, margin: "0 auto" }}
            >
              <Building2 style={{ width: 44, height: 44, color: "var(--color-text-tertiary)", margin: "0 auto 1rem auto" }} />
              <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                {t("departments.emptyTitle", "No Departments Registered")}
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                {t("departments.emptyDesc", "No municipal departments have been configured in the database yet.")}
              </p>
              <Link to="/login" className="btn btn-primary">
                {t("auth.citizenPortalLink", "Go to Citizen Login")}
              </Link>
            </div>
          ) : (
            /* Department Grid */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {departments.map((dept) => {
                const IconComponent = getDeptIcon(dept.code);
                return (
                  <div
                    key={dept._id || dept.code}
                    className="card hover-shadow"
                    style={{
                      padding: "1.5rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      border: "1px solid var(--border-primary)",
                      borderRadius: "10px",
                      background: "#FFFFFF",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "1rem",
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "8px",
                            background: "rgba(43, 122, 120, 0.1)",
                            color: "var(--color-teal)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <IconComponent style={{ width: 22, height: 22 }} />
                        </div>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: "var(--bg-secondary)",
                            color: "var(--color-text-secondary)",
                            fontFamily: "monospace",
                          }}
                        >
                          {dept.code}
                        </span>
                      </div>

                      <h3
                        style={{
                          fontSize: "1.125rem",
                          fontWeight: 600,
                          color: "var(--color-navy)",
                          marginBottom: "0.5rem",
                        }}
                      >
                        {dept.name}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--color-text-secondary)",
                          lineHeight: 1.5,
                          marginBottom: "1.25rem",
                          minHeight: 48,
                        }}
                      >
                        {dept.description || t("departments.defaultDesc", "Civic complaints and infrastructure service management.")}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/departments/${encodeURIComponent(dept.code)}/login`)}
                      className="btn btn-outline w-full"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        borderColor: "var(--color-teal)",
                        color: "var(--color-teal)",
                        fontWeight: 600,
                      }}
                    >
                      <span>{t("departments.staffLoginBtn", "Officer Sign In")}</span>
                      <ArrowRight style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Portal Switcher Links */}
          <div
            style={{
              marginTop: "3rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--border-primary)",
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              gap: "1.5rem",
              flexWrap: "wrap",
              fontSize: "0.875rem",
            }}
          >
            <Link to="/login" className="auth-link" style={{ color: "var(--color-teal)" }}>
              {t("auth.citizenPortalLink", "People / Citizens Portal")}
            </Link>
            <span style={{ color: "var(--color-text-tertiary)" }}>•</span>
            <Link to="/admin/login" className="auth-link" style={{ color: "var(--color-teal)" }}>
              {t("auth.adminPortalLink", "Administrator Portal")}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer text-center">
        <p>© 2026 KuralAI. Municipal Officer & Department Gateway.</p>
      </footer>
    </div>
  );
}
