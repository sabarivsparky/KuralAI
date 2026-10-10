import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { complaintAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import UrgencyBadge from "../components/UrgencyBadge";
import {
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  PlusCircle,
  Search,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [complaintList, statsData] = await Promise.all([
        complaintAPI.getAll().catch(() => []),
        complaintAPI.stats().catch(() => null),
      ]);

      const items = Array.isArray(complaintList) ? complaintList : [];
      setComplaints(items);

      if (statsData) {
        setStats(statsData);
      } else {
        // Fallback computation
        setStats({
          total: items.length,
          pending: items.filter((c) => c.status === "Submitted").length,
          inProgress: items.filter((c) => c.status === "In Progress" || c.status === "In Review").length,
          resolved: items.filter((c) => c.status === "Resolved").length,
        });
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Could not load dashboard information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const recentComplaints = complaints.slice(0, 5);

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="welcome-card">
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            Welcome back, {user?.displayName || "Citizen"}!
          </h2>
          <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.75)" }}>
            Track, submit, and monitor civic complaint resolutions in real time.
          </p>
        </div>

        <Link to="/complaints/new" className="btn btn-accent btn-lg">
          <PlusCircle style={{ width: 18, height: 18 }} />
          <span>File a Complaint</span>
        </Link>
      </div>

      {/* Metrics Summary Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: "rgba(37, 99, 235, 0.12)", color: "#1D4ED8" }}>
            <FileText style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div className="metric-count">{loading ? "-" : stats.total}</div>
            <div className="metric-title">{t("dashboard.totalComplaints", "Total Submitted")}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: "rgba(217, 119, 6, 0.12)", color: "#B45309" }}>
            <Clock style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div className="metric-count">{loading ? "-" : stats.pending}</div>
            <div className="metric-title">{t("dashboard.pending", "Under Review")}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: "rgba(79, 70, 229, 0.12)", color: "#4338CA" }}>
            <RefreshCw style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div className="metric-count">{loading ? "-" : stats.inProgress}</div>
            <div className="metric-title">{t("dashboard.inProgress", "In Progress")}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: "rgba(5, 150, 105, 0.12)", color: "#047857" }}>
            <CheckCircle2 style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div className="metric-count">{loading ? "-" : stats.resolved}</div>
            <div className="metric-title">{t("dashboard.resolved", "Resolved")}</div>
          </div>
        </div>
      </div>

      {/* Recent Activity / Complaints Table */}
      <div style={{ marginTop: "2rem" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
          <h3 className="section-heading">
            {t("dashboard.recentTitle", "Recent Complaints")}
          </h3>

          <Link to="/complaints" className="auth-link flex items-center gap-1" style={{ color: "var(--accent-teal)" }}>
            <span>{t("dashboard.viewAll", "View All Complaints")}</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>

        {loading ? (
          <div className="empty-state-box">
            <Loader2 style={{ width: 28, height: 28, color: "var(--accent-teal)" }} className="animate-spin" />
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
              Fetching your complaint records...
            </p>
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <AlertCircle style={{ width: 18, height: 18 }} />
            <span>{error}</span>
          </div>
        ) : recentComplaints.length === 0 ? (
          <div className="empty-state-box">
            <Sparkles style={{ width: 40, height: 40, color: "var(--accent-teal)", margin: "0 auto 1rem auto" }} />
            <h4 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              No Complaints Filed Yet
            </h4>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", maxWidth: "420px", margin: "0.5rem auto 1.5rem auto" }}>
              Have a civic problem like potholes, water leaks, or streetlights in your area? Report it easily using voice, text, or photo.
            </p>
            <Link to="/complaints/new" className="btn btn-accent">
              <PlusCircle style={{ width: 16, height: 16 }} />
              <span>File Your First Complaint</span>
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tracking ID & Issue</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {item.aiAnalysis?.issue || item.text?.substring(0, 45) || "Civic Complaint"}
                      </div>
                      <div className="tracking-id-label">#{item._id}</div>
                    </td>
                    <td>
                      <span className="category-pill">
                        {item.aiAnalysis?.category || item.category || "General"}
                      </span>
                    </td>
                    <td>
                      <UrgencyBadge severity={item.aiAnalysis?.urgency || "Medium"} />
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link to={`/complaints/${item._id}`} className="btn btn-outline btn-sm">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
