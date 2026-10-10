import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { complaintAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import UrgencyBadge from "../components/UrgencyBadge";
import {
  Search,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Shield,
  Layers,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Safely extracts and formats the complaint's submission timestamp.
 * Fallbacks across createdAt, analyzedAt, updatedAt, and MongoDB ObjectId timestamp.
 * Never outputs "Invalid Date".
 */
function getComplaintSubmissionDate(complaint, includeTime = false) {
  if (!complaint) return "Date unavailable";
  const candidates = [
    complaint.createdAt,
    complaint.analyzedAt,
    complaint.timestamp,
    complaint.updatedAt,
  ];

  for (const c of candidates) {
    if (c) {
      const d = new Date(c);
      if (!isNaN(d.getTime())) {
        return formatParsedDate(d, includeTime);
      }
    }
  }

  // Fallback: extract timestamp from 24-character hexadecimal MongoDB ObjectId
  if (
    complaint._id &&
    typeof complaint._id === "string" &&
    /^[0-9a-fA-F]{24}$/.test(complaint._id)
  ) {
    try {
      const ts = parseInt(complaint._id.substring(0, 8), 16) * 1000;
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return formatParsedDate(d, includeTime);
      }
    } catch {
      // ignore
    }
  }

  return "Date recorded upon submission";
}

/**
 * Safely formats a parsed Date object.
 */
function formatParsedDate(d, includeTime) {
  if (includeTime) {
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Safely extracts and formats an audit log's timestamp.
 */
function getLogTimestamp(log) {
  if (!log) return "Time unavailable";
  const candidates = [log.createdAt, log.timestamp, log.updatedAt];
  for (const c of candidates) {
    if (c) {
      const d = new Date(c);
      if (!isNaN(d.getTime())) {
        return formatParsedDate(d, true);
      }
    }
  }
  if (log._id && typeof log._id === "string" && /^[0-9a-fA-F]{24}$/.test(log._id)) {
    try {
      const ts = parseInt(log._id.substring(0, 8), 16) * 1000;
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return formatParsedDate(d, true);
      }
    } catch {
      // ignore
    }
  }
  return "Timestamp recorded";
}

/**
 * Safely renders audit log details whether stored as a string or structured object.
 */
function renderLogDetails(details) {
  if (!details) return "Official status update registered.";
  if (typeof details === "string") return details;
  if (typeof details === "object") {
    if (details.citizenReply) return details.citizenReply;
    if (details.actionableSummary) return details.actionableSummary;
    if (details.englishTranslation) return details.englishTranslation;
    if (details.issueType) return `Issue classified as: ${details.issueType}`;
    try {
      return Object.entries(details)
        .filter(([_, v]) => typeof v === "string" || typeof v === "number")
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ") || "Status update logged.";
    } catch {
      return "Status update logged.";
    }
  }
  return String(details);
}

export default function TrackingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [inputQuery, setInputQuery] = useState(initialId);
  const [complaint, setComplaint] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialId) {
      handleSearch(initialId);
    }
  }, [initialId]);

  const handleSearch = async (idToSearch) => {
    const raw = (idToSearch !== undefined ? idToSearch : inputQuery).trim();

    if (!raw) {
      setValidationError("Please enter a Complaint ID to track.");
      return;
    }

    // Validate 24-character hexadecimal format
    if (!/^[0-9a-fA-F]{24}$/.test(raw)) {
      setValidationError(
        "Invalid ID format. A valid Complaint ID is a 24-character hexadecimal reference (e.g., 6ac940fb714e3a1bdf7b2c3a)."
      );
      return;
    }

    setValidationError(null);
    setLoading(true);
    setError(null);
    setComplaint(null);
    setLogs([]);

    try {
      // Use the unified public-safe tracking endpoint
      const result = await complaintAPI.track(raw);

      if (result && result.complaint) {
        setComplaint(result.complaint);
        setLogs(Array.isArray(result.logs) ? result.logs : []);
      } else if (result && result._id) {
        setComplaint(result);
        try {
          const auditLogs = await complaintAPI.getLogs(raw);
          setLogs(Array.isArray(auditLogs) ? auditLogs : []);
        } catch {
          setLogs([]);
        }
      } else {
        throw new Error("No complaint record found.");
      }

      setSearchParams({ id: raw });
    } catch (err) {
      console.error("Failed to track complaint:", err);
      const message =
        err?.status === 404
          ? "No complaint found with this ID. Please double-check your tracking reference."
          : err?.message || "Unable to retrieve complaint record. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitForm = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const copyIdToClipboard = () => {
    if (complaint?._id) {
      navigator.clipboard.writeText(complaint._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const ai = complaint?.aiAnalysis || {};
  const photoUrl = complaint?.photoUrl || complaint?.photo
    ? (complaint.photoUrl || complaint.photo).startsWith("http")
      ? (complaint.photoUrl || complaint.photo)
      : `${API_BASE}/${(complaint.photoUrl || complaint.photo).replace(/\\/g, "/")}`
    : null;

  return (
    <div className="tracking-page-container">
      {/* 1. Page Breadcrumbs & Navigation */}
      <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
        <nav aria-label="Breadcrumb" className="flex items-center gap-2" style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
          <Link to={user ? "/dashboard" : "/"} style={{ color: "var(--color-text-secondary)" }} className="hover:underline">
            {user ? "Dashboard" : "Home"}
          </Link>
          <span style={{ color: "var(--color-border)" }}>/</span>
          <span style={{ color: "var(--color-navy)", fontWeight: 600 }}>Track Complaint</span>
        </nav>

        <Link
          to={user ? "/dashboard" : "/"}
          className="btn btn-outline btn-sm flex items-center gap-1.5"
        >
          <ArrowLeft style={{ width: 14, height: 14 }} />
          <span>{user ? "Back to Dashboard" : "Back to Home"}</span>
        </Link>
      </div>

      {/* 2. Page Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h2 className="page-title">Track Complaint</h2>
        <p className="page-subtitle">
          Monitor real-time resolution progress, department routing, and official audit history for any civic complaint using its unique tracking ID.
        </p>
      </div>

      {/* 3. Tracking Search Card */}
      <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <form onSubmit={onSubmitForm} className="flex flex-col gap-3">
          <label className="form-label" htmlFor="tracking-search-input">
            Enter 24-Character Complaint Reference ID *
          </label>

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="input-with-icon flex-1">
              <Search className="input-icon" style={{ width: 18, height: 18, color: "var(--color-text-tertiary)" }} />
              <input
                id="tracking-search-input"
                type="text"
                placeholder="Paste or type ID, e.g. 6ac940fb714e3a1bdf7b2c3a"
                value={inputQuery}
                onChange={(e) => {
                  setInputQuery(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                className="form-input"
                style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center justify-center gap-2"
              style={{ minWidth: "150px" }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search style={{ width: 16, height: 16 }} />
                  <span>Track Status</span>
                </>
              )}
            </button>
          </div>

          {validationError ? (
            <div className="flex items-center gap-1.5" style={{ fontSize: "0.8125rem", color: "var(--color-danger)" }}>
              <AlertCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-2" style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
              <span>Enter the reference ID issued when filing the complaint.</span>
              {user && (
                <Link to="/complaints" className="auth-link flex items-center gap-1">
                  <span>View my complaints directory</span>
                  <ArrowRight style={{ width: 12, height: 12 }} />
                </Link>
              )}
            </div>
          )}
        </form>
      </div>

      {/* 4. Loading State */}
      {loading && (
        <div className="card" style={{ padding: "3rem 1.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <Loader2 style={{ width: 36, height: 36, color: "var(--color-teal)" }} className="animate-spin" />
          <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-navy)", margin: 0 }}>
            Locating complaint record in system...
          </h4>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
            Fetching verified status, AI routing analysis, and audit log history.
          </p>
        </div>
      )}

      {/* 5. Error State */}
      {error && !loading && (
        <div className="alert alert-error" style={{ marginBottom: "2rem" }}>
          <AlertCircle style={{ width: 20, height: 20, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, marginBottom: "2px" }}>Lookup Failed</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* 6. Complaint Summary & Audit Trail */}
      {complaint && !loading && (
        <div className="flex flex-col gap-6">
          {/* Complaint Summary Card */}
          <div className="tracking-result-card">
            {/* Header: Status, Severity, Category, and Full ID with Copy */}
            <div className="result-header">
              <div className="flex items-center flex-wrap gap-2">
                <StatusBadge status={complaint.status} />
                <UrgencyBadge severity={ai.urgency || (ai.severity ? (ai.severity >= 4 ? "High" : ai.severity === 3 ? "Medium" : "Low") : "Medium")} />
                {(ai.category || complaint.category) && (
                  <span className="category-pill">
                    {ai.category || complaint.category}
                  </span>
                )}
              </div>

              {/* Complete, untruncated ID with copy button */}
              <div className="flex items-center gap-2">
                <span
                  title={complaint._id}
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--color-navy)",
                    backgroundColor: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.25rem 0.625rem",
                    wordBreak: "break-all",
                  }}
                >
                  ID: {complaint._id}
                </span>

                <button
                  onClick={copyIdToClipboard}
                  className="btn btn-outline btn-sm flex items-center gap-1.5"
                  title="Copy Complaint ID to clipboard"
                  aria-label="Copy Complaint ID"
                >
                  {copied ? (
                    <>
                      <Check style={{ width: 13, height: 13, color: "var(--color-success)" }} />
                      <span style={{ color: "var(--color-success)", fontSize: "0.75rem", fontWeight: 600 }}>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy style={{ width: 13, height: 13, color: "var(--color-text-secondary)" }} />
                      <span style={{ fontSize: "0.75rem" }}>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Issue Title */}
            <h3 className="result-title">
              {ai.issue || ai.englishTranslation || complaint.text?.substring(0, 90) || "Civic Grievance Report"}
            </h3>

            {/* 4-Item Responsive Meta Grid */}
            <div className="result-meta-grid">
              <div className="meta-box">
                <span className="meta-label">Responsible Agency</span>
                <span className="meta-val flex items-center gap-1.5">
                  <Building style={{ width: 14, height: 14, color: "var(--color-teal)", flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ai.department || "General Administration"}
                  </span>
                </span>
              </div>

              <div className="meta-box">
                <span className="meta-label">Submission Date</span>
                <span className="meta-val flex items-center gap-1.5">
                  <Calendar style={{ width: 14, height: 14, color: "var(--color-teal)", flexShrink: 0 }} />
                  <span>{getComplaintSubmissionDate(complaint, false)}</span>
                </span>
              </div>

              <div className="meta-box">
                <span className="meta-label">Severity Level</span>
                <span className="meta-val flex items-center gap-1.5">
                  <Clock style={{ width: 14, height: 14, color: "var(--color-warning)", flexShrink: 0 }} />
                  <span>
                    {ai.severity ? `Level ${ai.severity}/5 (${ai.urgency || "Medium"})` : (ai.urgency || "Medium")}
                  </span>
                </span>
              </div>

              <div className="meta-box">
                <span className="meta-label">Priority Score</span>
                <span className="meta-val flex items-center gap-1.5" style={{ color: "var(--color-warning)" }}>
                  <TrendingUp style={{ width: 14, height: 14, flexShrink: 0 }} />
                  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>
                    {ai.priorityScore !== undefined && ai.priorityScore !== null
                      ? `${ai.priorityScore}/100`
                      : "50/100"}
                  </span>
                </span>
              </div>
            </div>

            {/* Issue Description / Translation snippet */}
            {(complaint.text || complaint.englishTranslation) && (
              <div style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.375rem" }}>
                  Citizen Description
                </span>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-primary)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                  {complaint.text || complaint.englishTranslation}
                </p>

                {complaint.englishTranslation && complaint.text && complaint.text !== complaint.englishTranslation && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--color-border-light)" }}>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-teal)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.25rem" }}>
                      AI English Translation
                    </span>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0 }}>
                      {complaint.englishTranslation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Attached Photo Evidence Thumbnail if present */}
            {photoUrl && (
              <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-navy)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ImageIcon style={{ width: 15, height: 15, color: "var(--color-teal)" }} />
                  <span>Attached Evidence Photo</span>
                </div>
                <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--color-border)", maxWidth: "260px", maxHeight: "180px" }}>
                  <img
                    src={photoUrl}
                    alt="Complaint evidence photo"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}

            {/* Link to Full Details if User is Logged In */}
            <div className="flex items-center justify-between flex-wrap gap-3" style={{ paddingTop: "1rem", borderTop: "1px solid var(--color-border-light)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                Logged under verified KuralAI intake pipeline.
              </span>
              <Link
                to={`/complaints/${complaint._id}`}
                className="btn btn-outline btn-sm flex items-center gap-1.5"
              >
                <span>View Full Details &amp; AI Audit</span>
                <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          </div>

          {/* Official Resolution Audit Trail Card */}
          <div className="card" style={{ padding: "1.75rem" }}>
            <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--color-border-light)" }}>
              <div className="flex items-center gap-2">
                <Clock style={{ width: 18, height: 18, color: "var(--color-teal)" }} />
                <h3 className="card-section-title" style={{ margin: 0 }}>
                  Official Resolution Audit Trail
                </h3>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                {logs.length} logged event{logs.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="timeline-container">
              {logs.length === 0 ? (
                <div className="timeline-item">
                  <div className="timeline-dot active" />
                  <div className="timeline-content">
                    <span className="timeline-time">
                      {getComplaintSubmissionDate(complaint, true)}
                    </span>
                    <h5 className="timeline-action">Complaint Registered</h5>
                    <p className="timeline-desc">
                      Grievance submitted into KuralAI intake pipeline. Queued for department review and dispatch.
                    </p>
                  </div>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={log._id || index} className="timeline-item">
                    <div className="timeline-dot active" />
                    <div className="timeline-content">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="timeline-time">
                          {getLogTimestamp(log)}
                        </span>
                        {log.agent && (
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              backgroundColor: "var(--color-bg)",
                              border: "1px solid var(--color-border)",
                              borderRadius: "var(--radius-sm)",
                              padding: "1px 6px",
                              color: "var(--color-text-secondary)",
                              fontWeight: 600,
                            }}
                          >
                            {log.agent}
                          </span>
                        )}
                      </div>
                      <h5 className="timeline-action" style={{ marginTop: "2px" }}>
                        {log.action || "Status Update"}
                      </h5>
                      <p className="timeline-desc">
                        {renderLogDetails(log.details)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
