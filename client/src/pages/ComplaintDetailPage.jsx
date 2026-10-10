import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { complaintAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import UrgencyBadge from "../components/UrgencyBadge";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Building,
  Sparkles,
  Calendar,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  User,
  Shield,
  FileText,
  TrendingUp,
  Copy,
  Check,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();

  const [complaint, setComplaint] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, logs] = await Promise.all([
        complaintAPI.getById(id),
        complaintAPI.getLogs(id).catch(() => []),
      ]);

      setComplaint(data);
      setAuditLog(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error("Failed to load complaint details", err);
      setError(err.message || "Complaint not found or server error.");
    } finally {
      setLoading(false);
    }
  };

  const copyIdToClipboard = () => {
    if (complaint?._id) {
      navigator.clipboard.writeText(complaint._id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="empty-state-box" style={{ marginTop: "3rem" }}>
        <Loader2 style={{ width: 32, height: 32, color: "var(--accent-teal)", margin: "0 auto 0.75rem auto" }} className="animate-spin" />
        <h4 style={{ fontSize: "1rem", fontWeight: 600 }}>
          Loading complaint details and audit trail...
        </h4>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div style={{ marginTop: "2rem" }}>
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          <AlertCircle style={{ width: 20, height: 20 }} />
          <span>{error || "Complaint details not found"}</span>
        </div>
        <Link to="/complaints" className="btn btn-outline gap-2">
          <ArrowLeft style={{ width: 16, height: 16 }} />
          <span>Back to Complaints Directory</span>
        </Link>
      </div>
    );
  }

  const ai = complaint.aiAnalysis || {};
  const photoUrl = complaint.photo
    ? complaint.photo.startsWith("http")
      ? complaint.photo
      : `${API_BASE}/${complaint.photo.replace(/\\/g, "/")}`
    : null;

  const priorityScore = ai.priorityScore || 50;

  return (
    <div className="detail-page-container">
      {/* 1. Page Header Navigation & ID Banner */}
      <div className="detail-nav-bar">
        <Link to="/complaints" className="btn btn-outline btn-sm gap-2">
          <ArrowLeft style={{ width: 16, height: 16 }} />
          <span>Back to Complaints</span>
        </Link>

        <button
          onClick={copyIdToClipboard}
          className="btn btn-outline btn-sm gap-2"
          title="Copy Complaint ID"
        >
          <span style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 600 }}>
            ID: {complaint._id}
          </span>
          {copied ? <Check style={{ width: 14, height: 14, color: "#10B981" }} /> : <Copy style={{ width: 14, height: 14, color: "var(--color-text-tertiary)" }} />}
        </button>
      </div>

      {/* Main Title Banner Card */}
      <div className="detail-header-card">
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: "0.75rem" }}>
            <StatusBadge status={complaint.status} />
            <UrgencyBadge severity={ai.urgency || "Medium"} />
            {complaint.language && (
              <span className="category-pill" style={{ textTransform: "uppercase" }}>
                Language: {complaint.language}
              </span>
            )}
          </div>

          <h2 className="detail-title">
            {ai.issue || complaint.text?.substring(0, 90) || "Civic Grievance Report"}
          </h2>
        </div>

        {/* Priority Score Bar Widget */}
        <div className="priority-meter-box">
          <div className="flex items-center justify-between" style={{ marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
              <TrendingUp style={{ width: 14, height: 14, color: "var(--accent-amber)" }} />
              <span>Priority Score</span>
            </span>
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--accent-amber)", fontFamily: "monospace" }}>
              {priorityScore}/100
            </span>
          </div>

          <div className="meter-bar-track">
            <div className="meter-bar-fill" style={{ width: `${Math.min(priorityScore, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* 2. 4-Card Summary Metadata Grid */}
      <div className="summary-grid">
        {/* Card 1: Submission Date */}
        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: "rgba(37, 99, 235, 0.12)", color: "#1D4ED8" }}>
            <Calendar style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <div className="summary-card-label">Submitted On</div>
            <div className="summary-card-value">
              {new Date(complaint.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Card 2: Department */}
        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: "rgba(5, 150, 105, 0.12)", color: "#047857" }}>
            <Building style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <div className="summary-card-label">Assigned Agency</div>
            <div className="summary-card-value" style={{ fontSize: "0.75rem" }}>
              {ai.department || "General Administration"}
            </div>
          </div>
        </div>

        {/* Card 3: Urgency / Severity */}
        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: "rgba(217, 119, 6, 0.12)", color: "#B45309" }}>
            <Clock style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <div className="summary-card-label">Urgency Level</div>
            <UrgencyBadge severity={ai.urgency || "Medium"} />
          </div>
        </div>

        {/* Card 4: Current Status */}
        <div className="summary-card">
          <div className="summary-card-icon" style={{ background: "rgba(79, 70, 229, 0.12)", color: "#4338CA" }}>
            <CheckCircle2 style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <div className="summary-card-label">Current Status</div>
            <StatusBadge status={complaint.status} />
          </div>
        </div>
      </div>

      {/* 3. 2-Column Detail Content Grid */}
      <div className="detail-grid">
        {/* Left Column: Citizen Submission + Photo Evidence + Audit Timeline */}
        <div className="flex flex-col gap-6">
          {/* Card: Original Submission & Media */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: "1rem" }}>
              <h3 className="card-section-title">
                <FileText style={{ width: 18, height: 18, color: "var(--accent-teal)" }} />
                <span>Original Citizen Submission</span>
              </h3>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              <p style={{ fontSize: "0.9375rem", color: "var(--color-text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {complaint.text}
              </p>

              {complaint.englishTranslation && (
                <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-teal)", textTransform: "uppercase", display: "block", marginBottom: "0.25rem" }}>
                    AI English Translation
                  </span>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                    {complaint.englishTranslation}
                  </p>
                </div>
              )}

              {/* Attached Photo Evidence */}
              {photoUrl && (
                <div style={{ marginTop: "1.5rem" }}>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-navy)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ImageIcon style={{ width: 16, height: 16, color: "var(--accent-teal)" }} />
                    <span>Attached Photo Evidence</span>
                  </div>
                  <div style={{ borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--color-border)", maxHeight: "360px" }}>
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

              {/* Geo Coordinates */}
              {complaint.geo && (complaint.geo.lat || complaint.geo.lng) && (
                <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8125rem", color: "var(--accent-rose)" }}>
                  <MapPin style={{ width: 16, height: 16 }} />
                  <span>GPS Location: {complaint.geo.lat}, {complaint.geo.lng}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card: Audit & Resolution Timeline */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: "1rem" }}>
              <h3 className="card-section-title">
                <Clock style={{ width: 18, height: 18, color: "var(--accent-teal)" }} />
                <span>Status &amp; Resolution Audit Log</span>
              </h3>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              <div className="timeline-container">
                {auditLog.length === 0 ? (
                  <div className="timeline-item">
                    <div className="timeline-dot active" />
                    <div>
                      <div className="timeline-time">
                        {new Date(complaint.createdAt).toLocaleString()}
                      </div>
                      <div className="timeline-action">Complaint Registered</div>
                      <p className="timeline-desc">
                        Grievance received into KuralAI intake pipeline. Queued for department review.
                      </p>
                    </div>
                  </div>
                ) : (
                  auditLog.map((log, index) => (
                    <div key={log._id || index} className="timeline-item">
                      <div className="timeline-dot active" />
                      <div>
                        <div className="timeline-time">
                          {new Date(log.timestamp || log.createdAt).toLocaleString()}
                        </div>
                        <div className="timeline-action">{log.action || "Status Update"}</div>
                        <p className="timeline-desc">
                          {log.details || `Agent / System Action by ${log.agent || "Listener Agent"}`}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights Breakdown Card */}
        <div>
          <div className="ai-insights-card">
            <div className="flex items-center gap-2" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem" }}>
              <Sparkles style={{ width: 20, height: 20, color: "var(--accent-teal)" }} />
              <h3 className="card-section-title">
                Gemini AI Insights
              </h3>
            </div>

            <div className="insight-item">
              <span className="insight-label">Department</span>
              <span className="insight-value">{ai.department || "General Administration"}</span>
            </div>

            <div className="insight-item">
              <span className="insight-label">Category</span>
              <span className="insight-value">{ai.category || "Civic Issue"}</span>
            </div>

            <div className="insight-item">
              <span className="insight-label">Severity</span>
              <UrgencyBadge severity={ai.urgency || "Medium"} />
            </div>

            <div className="insight-item">
              <span className="insight-label">Priority Score</span>
              <span className="insight-value" style={{ fontFamily: "monospace", color: "var(--accent-amber)" }}>
                {priorityScore}/100
              </span>
            </div>

            {ai.actionableSummary && (
              <div style={{ paddingTop: "0.5rem" }}>
                <span className="insight-label" style={{ display: "block", marginBottom: "0.5rem" }}>
                  Actionable Summary
                </span>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", background: "var(--color-bg)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                  {ai.actionableSummary}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
