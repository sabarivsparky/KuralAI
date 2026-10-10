import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { officerAPI, authAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import UrgencyBadge from "../components/UrgencyBadge";
import {
  Briefcase,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  ArrowRight,
  Send,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileText,
  XCircle,
  Loader2,
} from "lucide-react";

const STATUS_TABS = ["All", "Submitted", "In Review", "In Progress", "Resolved", "Rejected", "Escalated"];

const OFFICER_TRANSITIONS = {
  Submitted: ["In Review", "Rejected"],
  "In Review": ["In Progress", "Rejected", "Escalated"],
  "In Progress": ["Resolved", "Rejected", "Escalated"],
  Escalated: ["In Review", "In Progress"],
};

export default function OfficerPortalPage() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();

  // View state: "queue" | "detail"
  const [view, setView] = useState("queue");
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedLogs, setSelectedLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Status update form
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [updating, setUpdating] = useState(false);

  // Note form
  const [noteText, setNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Demo department switcher (for development test account officer@kural.ai)
  const [departmentsList, setDepartmentsList] = useState([]);
  const [switchingDept, setSwitchingDept] = useState(false);

  useEffect(() => {
    if (user?.email === "officer@kural.ai") {
      authAPI
        .getDepartments()
        .then((data) => setDepartmentsList(data.departments || []))
        .catch(() => {});
    }
  }, [user?.email]);

  const handleDemoSwitchDept = async (e) => {
    const code = e.target.value;
    if (!code) return;
    setSwitchingDept(true);
    setError(null);
    try {
      await authAPI.selectDemoDepartment({ departmentCode: code });
      if (refreshUser) await refreshUser();
      setPage(1);
      await fetchQueue();
    } catch (err) {
      setError(err.message);
    } finally {
      setSwitchingDept(false);
    }
  };

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 15 };
      if (statusFilter !== "All") params.status = statusFilter;

      const [queueData, statsData] = await Promise.all([
        officerAPI.getComplaints(params),
        officerAPI.getStats(),
      ]);

      setComplaints(queueData.complaints || []);
      setPagination(queueData.pagination || null);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const openDetail = async (id) => {
    try {
      setLoading(true);
      const data = await officerAPI.getComplaint(id);
      setSelectedComplaint(data.complaint);
      setSelectedLogs(data.logs || []);
      setView("detail");
      setNewStatus("");
      setStatusNote("");
      setNoteText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !selectedComplaint) return;

    const needsNote = newStatus === "Resolved" || newStatus === "Rejected";
    if (needsNote && statusNote.trim().length < 5) {
      setError("Please provide a note (at least 5 characters) for this status change.");
      return;
    }

    setUpdating(true);
    setError(null);
    try {
      await officerAPI.updateStatus(selectedComplaint._id, {
        status: newStatus,
        note: statusNote.trim() || undefined,
      });
      // Refresh detail
      await openDetail(selectedComplaint._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedComplaint) return;

    setAddingNote(true);
    setError(null);
    try {
      await officerAPI.addNote(selectedComplaint._id, noteText.trim());
      setNoteText("");
      // Refresh detail
      await openDetail(selectedComplaint._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingNote(false);
    }
  };

  const backToQueue = () => {
    setView("queue");
    setSelectedComplaint(null);
    setSelectedLogs([]);
    fetchQueue();
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ---------- DETAIL VIEW ----------
  if (view === "detail" && selectedComplaint) {
    const c = selectedComplaint;
    const allowedTransitions = OFFICER_TRANSITIONS[c.status] || [];

    return (
      <div className="page-container">
        <button onClick={backToQueue} className="btn btn-ghost" style={{ marginBottom: "1rem", gap: "0.5rem" }}>
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Back to Queue
        </button>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>
            <AlertTriangle style={{ width: 16, height: 16 }} />
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem", alignItems: "start" }}>
          {/* Main complaint card */}
          <div>
            <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  Complaint #{c._id?.slice(-8).toUpperCase()}
                </h2>
                <StatusBadge status={c.status} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>Filed:</span>{" "}
                  <span style={{ color: "var(--text-primary)" }}>{formatDate(c.createdAt)}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>Department:</span>{" "}
                  <span style={{ color: "var(--text-primary)" }}>{c.department?.name || c.aiAnalysis?.department || "—"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>Category:</span>{" "}
                  <span style={{ color: "var(--text-primary)" }}>{c.aiAnalysis?.category || "—"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>Severity & Urgency:</span>{" "}
                  <span style={{ color: "var(--text-primary)" }}>
                    {c.aiAnalysis?.severity ? `Severity ${c.aiAnalysis.severity}/5 ` : ""}
                    (Score: {c.aiAnalysis?.priorityScore || "—"})
                  </span>{" "}
                  <UrgencyBadge urgency={c.aiAnalysis?.urgency} />
                </div>
                {c.aiAnalysis?.location && c.aiAnalysis.location.toLowerCase() !== "unknown" && (
                  <div>
                    <span style={{ color: "var(--text-tertiary)" }}>Location:</span>{" "}
                    <span style={{ color: "var(--text-primary)" }}>{c.aiAnalysis.location}</span>
                  </div>
                )}
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>Citizen:</span>{" "}
                  <span style={{ color: "var(--text-primary)" }}>{c.userId?.displayName || "Anonymous Citizen"}</span>
                </div>
                {c.userId?.email && (
                  <div>
                    <span style={{ color: "var(--text-tertiary)" }}>Contact:</span>{" "}
                    <span style={{ color: "var(--text-primary)" }}>{c.userId?.email}</span>
                  </div>
                )}
              </div>

              <div style={{ padding: "1rem", background: "var(--bg-secondary)", borderRadius: "8px", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                  Complaint Text
                </div>
                <p style={{ color: "var(--text-primary)", lineHeight: 1.6 }}>
                  {c.text || "No text provided."}
                </p>
              </div>

              {c.aiAnalysis?.actionableSummary && (
                <div style={{ padding: "1rem", background: "rgba(36, 124, 120, 0.06)", borderRadius: "8px", border: "1px solid rgba(36, 124, 120, 0.15)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-teal)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                    AI Summary
                  </div>
                  <p style={{ color: "var(--text-primary)", lineHeight: 1.5 }}>
                    {c.aiAnalysis.actionableSummary}
                  </p>
                </div>
              )}

              {c.photoUrl && (
                <div style={{ marginTop: "1rem" }}>
                  <img
                    src={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${c.photoUrl}`}
                    alt="Complaint photo"
                    style={{ maxWidth: "100%", borderRadius: "8px", border: "1px solid var(--border-primary)" }}
                  />
                </div>
              )}
            </div>

            {/* Audit Log Timeline */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>
                Activity Timeline
              </h3>
              {selectedLogs.length === 0 ? (
                <p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem" }}>No activity recorded yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {selectedLogs.map((log, i) => (
                    <div
                      key={log._id || i}
                      style={{
                        padding: "0.75rem 1rem",
                        background: "var(--bg-secondary)",
                        borderRadius: "8px",
                        borderLeft: "3px solid var(--color-teal)",
                        fontSize: "0.8125rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <strong style={{ color: "var(--text-primary)" }}>{log.action}</strong>
                        <span style={{ color: "var(--text-tertiary)", fontSize: "0.75rem" }}>
                          {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <div style={{ color: "var(--text-secondary)" }}>
                        {log.agent}
                        {log.details && typeof log.details === "string" ? ` — ${log.details}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions sidebar */}
          <div style={{ position: "sticky", top: "1rem" }}>
            {/* Status Transition */}
            <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>
                Update Status
              </h3>
              {allowedTransitions.length === 0 ? (
                <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
                  No transitions available for the current status.
                </p>
              ) : (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                    {allowedTransitions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setNewStatus(s)}
                        className={`btn btn-sm ${newStatus === s ? "btn-primary" : "btn-outline"}`}
                        style={{ fontSize: "0.8125rem" }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {newStatus && (
                    <>
                      <textarea
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        placeholder={
                          newStatus === "Resolved" || newStatus === "Rejected"
                            ? `Reason for ${newStatus.toLowerCase()} (required)...`
                            : "Optional note..."
                        }
                        rows={3}
                        style={{
                          width: "100%",
                          padding: "0.625rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border-primary)",
                          background: "var(--bg-secondary)",
                          color: "var(--text-primary)",
                          fontSize: "0.8125rem",
                          resize: "vertical",
                          marginBottom: "0.75rem",
                        }}
                      />
                      <button
                        onClick={handleStatusUpdate}
                        disabled={updating}
                        className="btn btn-primary w-full"
                        style={{ gap: "0.5rem" }}
                      >
                        {updating ? (
                          <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                        ) : (
                          <ArrowRight style={{ width: 14, height: 14 }} />
                        )}
                        Transition to {newStatus}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Officer Notes */}
            <div className="card" style={{ padding: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-primary)" }}>
                Internal Notes
              </h3>

              {c.officerNotes && c.officerNotes.length > 0 && (
                <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {c.officerNotes.map((note, i) => (
                    <div key={i} style={{
                      padding: "0.5rem 0.75rem",
                      background: "var(--bg-secondary)",
                      borderRadius: "6px",
                      fontSize: "0.8125rem",
                    }}>
                      <div style={{ color: "var(--text-primary)" }}>{note.text}</div>
                      <div style={{ color: "var(--text-tertiary)", fontSize: "0.6875rem", marginTop: "0.25rem" }}>
                        {formatDate(note.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add investigation note..."
                rows={2}
                style={{
                  width: "100%",
                  padding: "0.625rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-primary)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  fontSize: "0.8125rem",
                  resize: "vertical",
                  marginBottom: "0.5rem",
                }}
              />
              <button
                onClick={handleAddNote}
                disabled={addingNote || !noteText.trim()}
                className="btn btn-outline btn-sm w-full"
                style={{ gap: "0.5rem" }}
              >
                {addingNote ? (
                  <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                ) : (
                  <Send style={{ width: 14, height: 14 }} />
                )}
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- QUEUE VIEW ----------
  return (
    <div className="page-container">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
            <Briefcase style={{ width: 24, height: 24, display: "inline", verticalAlign: "middle", marginRight: "0.5rem" }} />
            Department Queue
          </h1>
          {stats && (
            <p style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>
              {stats.department} · {stats.pending} pending
            </p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {user?.email === "officer@kural.ai" && departmentsList.length > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(36, 124, 120, 0.08)",
                padding: "0.35rem 0.75rem",
                borderRadius: "8px",
                border: "1px solid rgba(36, 124, 120, 0.2)",
                fontSize: "0.8125rem",
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--color-teal)" }}>Demo Dept:</span>
              <select
                value={user.department?.code || (typeof user.department === "string" ? user.department : "")}
                onChange={handleDemoSwitchDept}
                disabled={switchingDept}
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "6px",
                  padding: "0.25rem 0.5rem",
                  fontSize: "0.8125rem",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                <option value="" disabled>Select department to test...</option>
                {departmentsList.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              {switchingDept && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
            </div>
          )}
          <button onClick={fetchQueue} className="btn btn-outline btn-sm" style={{ gap: "0.5rem" }}>
            <RefreshCw style={{ width: 14, height: 14 }} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>
          <AlertTriangle style={{ width: 16, height: 16 }} />
          {error}
        </div>
      )}

      {/* Stats cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Total", value: stats.total, icon: ClipboardList, color: "var(--color-navy)" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "#e6930a" },
            { label: "In Progress", value: stats.inProgress, icon: ArrowRight, color: "var(--color-teal)" },
            { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "#22c55e" },
            { label: "Rejected", value: stats.rejected, icon: XCircle, color: "#ef4444" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card" style={{ padding: "1rem", textAlign: "center" }}>
              <Icon style={{ width: 20, height: 20, color, margin: "0 auto 0.5rem" }} />
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: "0.25rem", overflowX: "auto", marginBottom: "1rem", padding: "0.25rem", background: "var(--bg-secondary)", borderRadius: "8px" }}>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setStatusFilter(tab); setPage(1); }}
            className={`btn btn-sm ${statusFilter === tab ? "btn-primary" : "btn-ghost"}`}
            style={{ fontSize: "0.8125rem", whiteSpace: "nowrap" }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Complaints table */}
      {loading ? (
        <div className="loading-overlay" style={{ position: "relative", minHeight: 200 }}>
          <div className="spinner"></div>
        </div>
      ) : complaints.length === 0 ? (
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <FileText style={{ width: 40, height: 40, color: "var(--text-tertiary)", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-tertiary)" }}>No complaints found for this filter.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-secondary)", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-tertiary)", letterSpacing: "0.04em" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>ID</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Complaint & Summary</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Category & Severity</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Location</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Filed</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                      #{c._id?.slice(-8).toUpperCase()}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", maxWidth: 280 }}>
                      <div style={{ fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.text ? (c.text.length > 55 ? c.text.substring(0, 55) + "..." : c.text) : "No description"}
                      </div>
                      {c.aiAnalysis?.actionableSummary && (
                        <div style={{ fontSize: "0.75rem", color: "var(--color-teal)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.aiAnalysis.actionableSummary}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem" }}>
                      <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {c.aiAnalysis?.category || c.aiAnalysis?.issueType || "—"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "2px" }}>
                        {c.aiAnalysis?.severity ? <span>Severity {c.aiAnalysis.severity}/5</span> : null}
                        <UrgencyBadge urgency={c.aiAnalysis?.urgency} />
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.aiAnalysis?.location && c.aiAnalysis.location.toLowerCase() !== "unknown" ? c.aiAnalysis.location : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <StatusBadge status={c.status} />
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
                      {formatDate(c.createdAt)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <button onClick={() => openDetail(c._id)} className="btn btn-sm btn-ghost" style={{ gap: "0.25rem" }}>
                        <Eye style={{ width: 14, height: 14 }} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "1.5rem" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn btn-outline btn-sm"
          >
            <ChevronLeft style={{ width: 14, height: 14 }} />
          </button>
          <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
            className="btn btn-outline btn-sm"
          >
            <ChevronRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      )}
    </div>
  );
}
