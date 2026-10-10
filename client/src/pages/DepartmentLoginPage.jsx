import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  Shield,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function DepartmentLoginPage() {
  const { t } = useTranslation();
  const { code } = useParams();
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const [department, setDepartment] = useState(null);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptError, setDeptError] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch department details to ensure valid department code
  useEffect(() => {
    let cancelled = false;
    authAPI
      .getDepartments()
      .then((data) => {
        if (cancelled) return;
        const matched = (data.departments || []).find(
          (d) => d.code.toUpperCase() === (code || "").toUpperCase()
        );
        if (matched) {
          setDepartment(matched);
        } else {
          setDeptError(
            t("departments.notFound", `Department code "${code}" does not exist.`)
          );
        }
      })
      .catch((err) => {
        if (!cancelled) setDeptError(err.message);
      })
      .finally(() => {
        if (!cancelled) setDeptLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [code, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(t("auth.fillAllFields", "Please fill in all required fields."));
      return;
    }

    setLoading(true);

    try {
      // Passes departmentCode to server for strict verification
      const loggedUser = await login(email, password, code, "official");

      // Verify client-side role
      if (loggedUser.role !== "official" && loggedUser.role !== "admin") {
        await logout();
        setError(
          t(
            "departments.notAuthorized",
            "Access denied. Only authorized department officers can access this portal."
          )
        );
        return;
      }

      // Verify client-side department match (officers must match department)
      if (loggedUser.role === "official") {
        const userDeptCode = loggedUser.department?.code || "";
        const userDeptId = loggedUser.department?._id || loggedUser.department || "";
        const deptId = department?._id || "";

        if (
          userDeptCode.toUpperCase() !== (code || "").toUpperCase() &&
          userDeptId.toString() !== deptId.toString()
        ) {
          await logout();
          const assignedName = loggedUser.department?.name || "another agency";
          setError(
            t(
              "departments.deptMismatch",
              `Department Mismatch: Your account is assigned to ${assignedName}, not ${department?.name}. Access denied.`
            )
          );
          return;
        }
      }

      // Successful verified officer login
      navigate("/officer/dashboard", { replace: true });
    } catch (err) {
      console.error("Department login error:", err);
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
            <Link to="/departments" className="nav-link flex items-center gap-1">
              <ArrowLeft style={{ width: 14, height: 14 }} />
              <span>{t("departments.changeDept", "Change Department")}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Form Area */}
      <main className="auth-content-area">
        <div className="auth-card-login" style={{ borderColor: "rgba(36, 124, 120, 0.3)" }}>
          <div className="auth-card-header">
            <div
              className="auth-header-icon"
              style={{ background: "rgba(43, 122, 120, 0.12)", color: "var(--color-teal)" }}
            >
              <Building2 style={{ width: 24, height: 24 }} />
            </div>

            {deptLoading ? (
              <div style={{ padding: "0.5rem" }}>
                <Loader2
                  style={{
                    width: 20,
                    height: 20,
                    animation: "spin 1s linear infinite",
                    margin: "0 auto",
                    color: "var(--color-teal)",
                  }}
                />
              </div>
            ) : department ? (
              <>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.35rem" }}>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "rgba(36, 124, 120, 0.12)",
                      color: "var(--color-teal)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {department.code}
                  </span>
                </div>
                <h2 className="auth-card-title">{department.name}</h2>
                <p className="auth-card-subtitle">
                  {t("departments.staffPortalTitle", "Department Officer & Field Staff Access")}
                </p>
              </>
            ) : (
              <h2 className="auth-card-title">Department Login</h2>
            )}
          </div>

          <div className="auth-card-body">
            {deptError ? (
              <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
                <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span>{deptError}</span>
                <div style={{ marginTop: "0.5rem" }}>
                  <Link to="/departments" className="btn btn-sm btn-outline">
                    {t("departments.viewAll", "View All Departments")}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
                    <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="form-group">
                    <label className="form-label">
                      {t("auth.staffIdentifier", "Staff Identifier / Official Email")} *
                    </label>
                    <div className="input-with-icon">
                      <Mail className="input-icon" style={{ width: 16, height: 16 }} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="officer@kural.ai"
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
                        {showPassword ? (
                          <EyeOff style={{ width: 16, height: 16 }} />
                        ) : (
                          <Eye style={{ width: 16, height: 16 }} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || deptLoading || !department}
                    className="btn btn-primary w-full"
                    style={{ marginTop: "0.5rem" }}
                  >
                    {loading ? (
                      <>
                        <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                        <span>{t("auth.verifyingStaff", "Verifying Officer Credentials...")}</span>
                      </>
                    ) : (
                      <>
                        <LogIn style={{ width: 16, height: 16 }} />
                        <span>
                          {t("departments.enterDeptQueue", `Sign In to ${department ? department.name : "Department"}`)}
                        </span>
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
                  <Link to="/departments" className="auth-link">
                    {t("departments.allDepartments", "All Departments")}
                  </Link>
                  <span style={{ color: "var(--color-text-tertiary)" }}>•</span>
                  <Link to="/login" className="auth-link">
                    {t("auth.citizenPortalLink", "Citizen Portal")}
                  </Link>
                  <span style={{ color: "var(--color-text-tertiary)" }}>•</span>
                  <Link to="/admin/login" className="auth-link">
                    {t("auth.adminPortalLink", "Admin Portal")}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="site-footer text-center">
        <p>© 2026 KuralAI. Municipal Officer & Department Gateway.</p>
      </footer>
    </div>
  );
}
