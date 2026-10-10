import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { adminAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import {
  SlidersHorizontal,
  Users,
  Building2,
  ScrollText,
  BarChart3,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  UserCog,
  Plus,
  Shield,
  Eye,
  Loader2,
  XCircle,
  Search,
} from "lucide-react";

const TABS = ["overview", "complaints", "users", "departments", "audit"];

const ALL_STATUSES = ["Submitted", "In Review", "In Progress", "Resolved", "Escalated", "Rejected"];

export default function AdminPortalPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location.pathname.includes("/complaints")) setActiveTab("complaints");
    else if (location.pathname.includes("/users")) setActiveTab("users");
    else if (location.pathname.includes("/departments")) setActiveTab("departments");
    else if (location.pathname.includes("/audit")) setActiveTab("audit");
    else if (location.pathname.includes("/dashboard") || location.pathname.includes("/admin") || location.pathname.includes("/overview")) setActiveTab("overview");
  }, [location.pathname]);

  // Overview stats
  const [stats, setStats] = useState(null);

  // Complaints
  const [complaints, setComplaints] = useState([]);
  const [complaintPagination, setComplaintPagination] = useState(null);
  const [complaintPage, setComplaintPage] = useState(1);
  const [complaintStatusFilter, setComplaintStatusFilter] = useState("");
  const [complaintSearch, setComplaintSearch] = useState("");

  // Users
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState(null);
  const [userPage, setUserPage] = useState(1);
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Departments
  const [departments, setDepartments] = useState([]);
  const [showCreateDept, setShowCreateDept] = useState(false);
  const [newDept, setNewDept] = useState({ name: "", code: "", description: "" });
  const [creatingDept, setCreatingDept] = useState(false);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState(null);
  const [auditPage, setAuditPage] = useState(1);

  // Role edit modal
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [savingRole, setSavingRole] = useState(false);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAPI.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: complaintPage, limit: 15 };
      if (complaintStatusFilter) params.status = complaintStatusFilter;
      if (complaintSearch.trim()) params.search = complaintSearch.trim();
      const data = await adminAPI.getComplaints(params);
      setComplaints(data.complaints || []);
      setComplaintPagination(data.pagination || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [complaintPage, complaintStatusFilter, complaintSearch]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: userPage, limit: 20 };
      if (userRoleFilter) params.role = userRoleFilter;
      if (userSearch.trim()) params.search = userSearch.trim();
      const data = await adminAPI.getUsers(params);
      setUsers(data.users || []);
      setUserPagination(data.pagination || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userPage, userRoleFilter, userSearch]);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAPI.getDepartments();
      setDepartments(data.departments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAPI.getAuditLogs({ page: auditPage, limit: 30 });
      setAuditLogs(data.logs || []);
      setAuditPagination(data.pagination || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [auditPage]);

  useEffect(() => {
    if (activeTab === "overview") fetchOverview();
    else if (activeTab === "complaints") fetchComplaints();
    else if (activeTab === "users") fetchUsers();
    else if (activeTab === "departments") fetchDepartments();
    else if (activeTab === "audit") fetchAuditLogs();
  }, [activeTab, fetchOverview, fetchComplaints, fetchUsers, fetchDepartments, fetchAuditLogs]);

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const handleCreateDept = async () => {
    if (!newDept.name.trim() || !newDept.code.trim()) return;
    setCreatingDept(true);
    setError(null);
    try {
      await adminAPI.createDepartment(newDept);
      setNewDept({ name: "", code: "", description: "" });
      setShowCreateDept(false);
      fetchDepartments();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingDept(false);
    }
  };

  const handleSaveRole = async () => {
    if (!editingUser || !editRole) return;
    setSavingRole(true);
    setError(null);
    try {
      await adminAPI.updateUserRole(editingUser._id, {
        role: editRole,
        departmentId: editRole === "official" ? editDeptId : undefined,
      });
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingRole(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    setError(null);
    try {
      await adminAPI.updateUserStatus(userId, !currentStatus);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const tabIcons = {
    overview: BarChart3,
    complaints: ClipboardList,
    users: Users,
    departments: Building2,
    audit: ScrollText,
  };

  const tabLabels = {
    overview: "Overview",
    complaints: "Complaints",
    users: "Users",
    departments: "Departments",
    audit: "Audit Trail",
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
          <SlidersHorizontal style={{ width: 24, height: 24, display: "inline", verticalAlign: "middle", marginRight: "0.5rem" }} />
          Admin Dashboard
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>
          System-wide management and oversight
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "1rem" }}>
          <AlertTriangle style={{ width: 16, height: 16 }} />
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit" }}>✕</button>
        </div>
      )}

      {/* Tab navigation */}
      <div style={{ display: "flex", gap: "0.25rem", overflowX: "auto", marginBottom: "1.5rem", padding: "0.25rem", background: "var(--bg-secondary)", borderRadius: "8px" }}>
        {TABS.map((tab) => {
          const Icon = tabIcons[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`btn btn-sm ${activeTab === tab ? "btn-primary" : "btn-ghost"}`}
              style={{ gap: "0.375rem", fontSize: "0.8125rem", whiteSpace: "nowrap" }}
            >
              <Icon style={{ width: 14, height: 14 }} />
              {tabLabels[tab]}
            </button>
          );
        })}
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === "overview" && (
        <>
          {loading ? (
            <div className="loading-overlay" style={{ position: "relative", minHeight: 200 }}>
              <div className="spinner"></div>
            </div>
          ) : stats ? (
            <>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                {[
                  { label: "Total Complaints", value: stats.complaints?.total, icon: ClipboardList, color: "var(--color-navy)" },
                  { label: "Pending", value: stats.complaints?.pending, icon: Clock, color: "#e6930a" },
                  { label: "Resolved", value: stats.complaints?.resolved, icon: CheckCircle2, color: "#22c55e" },
                  { label: "Total Users", value: stats.users?.total, icon: Users, color: "var(--color-teal)" },
                  { label: "Officers", value: stats.users?.officers, icon: Shield, color: "#6366f1" },
                  { label: "Departments", value: stats.departments, icon: Building2, color: "#8b5cf6" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
                    <Icon style={{ width: 22, height: 22, color, margin: "0 auto 0.5rem" }} />
                    <div style={{ fontSize: "1.75rem", fontWeight: 700, color }}>{value ?? 0}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Departments breakdown */}
              <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Complaints by Department</h3>
                {stats.departmentBreakdown?.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {stats.departmentBreakdown.map((d, i) => {
                      const pct = stats.complaints?.total ? Math.round((d.count / stats.complaints.total) * 100) : 0;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <span style={{ fontSize: "0.8125rem", color: "var(--text-primary)", minWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {d.department}
                          </span>
                          <div style={{ flex: 1, height: 8, background: "var(--bg-secondary)", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-teal)", borderRadius: 4, transition: "width 0.3s" }} />
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", minWidth: 60, textAlign: "right" }}>
                            {d.count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem" }}>No data available.</p>
                )}
              </div>

              {/* Quick stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="card" style={{ padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Avg Resolution Time</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-teal)" }}>{stats.avgResolutionHours || 0}h</div>
                </div>
                <div className="card" style={{ padding: "1.25rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Complaints This Week</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-navy)" }}>{stats.recentActivity?.complaintsLastWeek || 0}</div>
                </div>
              </div>
            </>
          ) : null}
        </>
      )}

      {/* ==================== COMPLAINTS TAB ==================== */}
      {activeTab === "complaints" && (
        <>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search style={{ width: 14, height: 14, position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
              <input
                type="text"
                placeholder="Search complaints..."
                value={complaintSearch}
                onChange={(e) => { setComplaintSearch(e.target.value); setComplaintPage(1); }}
                style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2rem", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8125rem" }}
              />
            </div>
            <select
              value={complaintStatusFilter}
              onChange={(e) => { setComplaintStatusFilter(e.target.value); setComplaintPage(1); }}
              style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8125rem" }}
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="loading-overlay" style={{ position: "relative", minHeight: 200 }}><div className="spinner"></div></div>
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-secondary)", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                      <th style={{ padding: "0.75rem 1rem" }}>ID</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Issue / Text</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Department</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Citizen</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Filed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)" }}>No complaints found.</td></tr>
                    ) : complaints.map((c) => (
                      <tr key={c._id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", fontFamily: "monospace" }}>#{c._id?.slice(-8).toUpperCase()}</td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.aiAnalysis?.issueType || c.text?.substring(0, 40) || "—"}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{c.aiAnalysis?.department || "—"}</td>
                        <td style={{ padding: "0.75rem 1rem" }}><StatusBadge status={c.status} /></td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{c.userId?.displayName || "Anonymous"}</td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {complaintPagination && complaintPagination.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem", alignItems: "center" }}>
              <button onClick={() => setComplaintPage((p) => Math.max(1, p - 1))} disabled={complaintPage <= 1} className="btn btn-outline btn-sm">
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Page {complaintPagination.page} of {complaintPagination.pages}</span>
              <button onClick={() => setComplaintPage((p) => Math.min(complaintPagination.pages, p + 1))} disabled={complaintPage >= complaintPagination.pages} className="btn btn-outline btn-sm">
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ==================== USERS TAB ==================== */}
      {activeTab === "users" && (
        <>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search style={{ width: 14, height: 14, position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                style={{ width: "100%", padding: "0.5rem 0.75rem 0.5rem 2rem", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8125rem" }}
              />
            </div>
            <select
              value={userRoleFilter}
              onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
              style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8125rem" }}
            >
              <option value="">All Roles</option>
              <option value="citizen">Citizen</option>
              <option value="official">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {loading ? (
            <div className="loading-overlay" style={{ position: "relative", minHeight: 200 }}><div className="spinner"></div></div>
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-secondary)", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                      <th style={{ padding: "0.75rem 1rem" }}>Name</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Email</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Role</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Department</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan="6" style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)" }}>No users found.</td></tr>
                    ) : users.map((u) => (
                      <tr key={u._id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: 500 }}>{u.displayName}</td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{u.email}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{
                            fontSize: "0.6875rem",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            background: u.role === "admin" ? "rgba(220,60,60,0.12)" : u.role === "official" ? "rgba(36,124,120,0.12)" : "rgba(100,116,139,0.12)",
                            color: u.role === "admin" ? "#dc3c3c" : u.role === "official" ? "var(--color-teal)" : "var(--text-secondary)",
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                          {u.department?.name || "—"}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{
                            fontSize: "0.6875rem",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontWeight: 600,
                            background: u.isActive !== false ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                            color: u.isActive !== false ? "#22c55e" : "#ef4444",
                          }}>
                            {u.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            <button
                              onClick={() => { setEditingUser(u); setEditRole(u.role); setEditDeptId(u.department?._id || ""); }}
                              className="btn btn-sm btn-ghost"
                              title="Edit Role"
                              disabled={u._id === user?._id}
                            >
                              <UserCog style={{ width: 14, height: 14 }} />
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(u._id, u.isActive !== false)}
                              className="btn btn-sm btn-ghost"
                              title={u.isActive !== false ? "Deactivate" : "Activate"}
                              disabled={u._id === user?._id}
                              style={{ color: u.isActive !== false ? "#ef4444" : "#22c55e" }}
                            >
                              {u.isActive !== false ? <XCircle style={{ width: 14, height: 14 }} /> : <CheckCircle2 style={{ width: 14, height: 14 }} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {userPagination && userPagination.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem", alignItems: "center" }}>
              <button onClick={() => setUserPage((p) => Math.max(1, p - 1))} disabled={userPage <= 1} className="btn btn-outline btn-sm">
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Page {userPagination.page} of {userPagination.pages}</span>
              <button onClick={() => setUserPage((p) => Math.min(userPagination.pages, p + 1))} disabled={userPage >= userPagination.pages} className="btn btn-outline btn-sm">
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}

          {/* Role Edit Modal */}
          {editingUser && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
              <div className="card" style={{ padding: "1.5rem", maxWidth: 420, width: "90%" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
                  Edit Role: {editingUser.displayName}
                </h3>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8125rem" }}
                  >
                    <option value="citizen">Citizen</option>
                    <option value="official">Officer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {editRole === "official" && (
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "0.375rem" }}>Department</label>
                    <select
                      value={editDeptId}
                      onChange={(e) => setEditDeptId(e.target.value)}
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8125rem" }}
                    >
                      <option value="">Select department...</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  <button onClick={() => setEditingUser(null)} className="btn btn-outline btn-sm">Cancel</button>
                  <button onClick={handleSaveRole} disabled={savingRole} className="btn btn-primary btn-sm" style={{ gap: "0.5rem" }}>
                    {savingRole && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ==================== DEPARTMENTS TAB ==================== */}
      {activeTab === "departments" && (
        <>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
            <button onClick={() => setShowCreateDept(!showCreateDept)} className="btn btn-primary btn-sm" style={{ gap: "0.5rem" }}>
              <Plus style={{ width: 14, height: 14 }} />
              Create Department
            </button>
          </div>

          {showCreateDept && (
            <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, marginBottom: "1rem" }}>New Department</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <input
                  type="text"
                  placeholder="Department Name"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8125rem" }}
                />
                <input
                  type="text"
                  placeholder="Code (e.g., WATER)"
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                  style={{ padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8125rem" }}
                />
              </div>
              <input
                type="text"
                placeholder="Description (optional)"
                value={newDept.description}
                onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: "0.8125rem", marginBottom: "0.75rem" }}
              />
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button onClick={() => setShowCreateDept(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button onClick={handleCreateDept} disabled={creatingDept} className="btn btn-primary btn-sm" style={{ gap: "0.5rem" }}>
                  {creatingDept && <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />}
                  Create
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading-overlay" style={{ position: "relative", minHeight: 200 }}><div className="spinner"></div></div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {departments.map((d) => (
                <div key={d._id} className="card" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>{d.name}</h4>
                    <span style={{ fontSize: "0.6875rem", padding: "2px 6px", borderRadius: "4px", background: "var(--bg-secondary)", color: "var(--text-tertiary)", fontFamily: "monospace" }}>
                      {d.code}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.4 }}>
                    {d.description || "No description."}
                  </p>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                    <Users style={{ width: 12, height: 12, display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} />
                    {d.officerCount || 0} officers
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ==================== AUDIT TRAIL TAB ==================== */}
      {activeTab === "audit" && (
        <>
          {loading ? (
            <div className="loading-overlay" style={{ position: "relative", minHeight: 200 }}><div className="spinner"></div></div>
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-secondary)", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                      <th style={{ padding: "0.75rem 1rem" }}>Time</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Agent</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Action</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Complaint</th>
                      <th style={{ padding: "0.75rem 1rem" }}>Actor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)" }}>No audit logs found.</td></tr>
                    ) : auditLogs.map((log) => (
                      <tr key={log._id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>{formatDate(log.createdAt)}</td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem" }}>{log.agent}</td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-primary)" }}>{log.action}</td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                          {log.complaintId?._id ? `#${log.complaintId._id.slice(-8).toUpperCase()}` : "—"}
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                          {log.userId?.displayName || "System"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {auditPagination && auditPagination.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem", alignItems: "center" }}>
              <button onClick={() => setAuditPage((p) => Math.max(1, p - 1))} disabled={auditPage <= 1} className="btn btn-outline btn-sm">
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Page {auditPagination.page} of {auditPagination.pages}</span>
              <button onClick={() => setAuditPage((p) => Math.min(auditPagination.pages, p + 1))} disabled={auditPage >= auditPagination.pages} className="btn btn-outline btn-sm">
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
