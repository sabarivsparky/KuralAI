import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { complaintAPI } from "../services/api";
import StatusBadge from "../components/StatusBadge";
import UrgencyBadge from "../components/UrgencyBadge";
import {
  Search,
  Filter,
  PlusCircle,
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  Building,
  Sparkles,
} from "lucide-react";

export default function ComplaintsPage() {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await complaintAPI.getAll();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load complaints list", err);
      setError("Unable to load complaints. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(
    new Set(
      complaints
        .map((c) => c.aiAnalysis?.category || c.category)
        .filter(Boolean)
    )
  );

  const filtered = complaints.filter((c) => {
    const textMatch =
      !search ||
      c.text?.toLowerCase().includes(search.toLowerCase()) ||
      c._id?.toLowerCase().includes(search.toLowerCase()) ||
      c.aiAnalysis?.issue?.toLowerCase().includes(search.toLowerCase()) ||
      c.aiAnalysis?.department?.toLowerCase().includes(search.toLowerCase());

    const statusMatch =
      statusFilter === "ALL" || c.status === statusFilter;

    const cat = c.aiAnalysis?.category || c.category;
    const categoryMatch =
      categoryFilter === "ALL" || cat === categoryFilter;

    return textMatch && statusMatch && categoryMatch;
  });

  return (
    <div style={{ paddingBottom: "3rem" }}>
      {/* Page Heading Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h2 className="page-title">
            {t("nav.myComplaints", "My Complaints Directory")}
          </h2>
          <p className="page-subtitle">
            View status updates, department assignments, and resolution audit trails for all filed grievances.
          </p>
        </div>

        <Link to="/complaints/new" className="btn btn-accent">
          <PlusCircle style={{ width: 16, height: 16 }} />
          <span>{t("dashboard.fileNew", "File New Complaint")}</span>
        </Link>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="input-with-icon flex-1 w-full">
            <Search style={{ width: 16, height: 16 }} className="input-icon" />
            <input
              type="text"
              placeholder="Search by ID, issue keyword, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              aria-label="Search complaints"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="input-with-icon flex-1 sm:flex-none">
              <Filter style={{ width: 14, height: 14 }} className="input-icon" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input form-select"
                aria-label="Filter by status"
              >
                <option value="ALL">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="In Review">In Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Escalated">Escalated</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {categories.length > 0 && (
              <div className="input-with-icon flex-1 sm:flex-none">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="form-input form-select"
                  aria-label="Filter by category"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="empty-state-box">
          <Loader2 style={{ width: 32, height: 32, color: "var(--accent-teal)" }} className="animate-spin" />
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            Fetching your complaint records...
          </p>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <AlertCircle style={{ width: 18, height: 18 }} />
          <span>{error}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-box">
          <FileText style={{ width: 40, height: 40, color: "var(--color-text-secondary)", margin: "0 auto 1rem auto" }} />
          <h4 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            No Matching Complaints Found
          </h4>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", maxWidth: "400px", margin: "0.5rem auto 1.5rem auto" }}>
            Try adjusting your search criteria or report a new complaint.
          </p>
          <Link to="/complaints/new" className="btn btn-accent btn-sm">
            <PlusCircle style={{ width: 14, height: 14 }} />
            <span>{t("dashboard.fileNew", "File New Complaint")}</span>
          </Link>
        </div>
      ) : (
        <div className="feature-grid">
          {filtered.map((item) => (
            <div key={item._id} className="card flex flex-col justify-between" style={{ padding: "1.25rem" }}>
              <div>
                <div className="flex items-center justify-between gap-2" style={{ marginBottom: "0.75rem" }}>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <UrgencyBadge severity={item.aiAnalysis?.urgency || "Medium"} />
                  </div>
                  <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--color-text-secondary)" }}>
                    #{item._id.substring(item._id.length - 8)}
                  </span>
                </div>

                <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.5rem", lineHeight: 1.3 }}>
                  {item.aiAnalysis?.issue || item.text?.substring(0, 60) || "Civic Grievance Report"}
                </h4>

                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: "1rem" }}>
                  {item.text || item.englishTranslation || "No description provided."}
                </p>

                <div className="flex flex-col gap-1.5" style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
                  <div className="flex items-center gap-1.5">
                    <Building style={{ width: 14, height: 14, color: "var(--accent-teal)" }} />
                    <span>{item.aiAnalysis?.department || "General Administration"}</span>
                  </div>

                  {item.aiAnalysis?.category && (
                    <div className="flex items-center gap-1.5">
                      <Sparkles style={{ width: 14, height: 14, color: "var(--accent-teal)" }} />
                      <span>{item.aiAnalysis.category}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Calendar style={{ width: 14, height: 14, color: "var(--color-text-secondary)" }} />
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <Link to={`/complaints/${item._id}`} className="btn btn-outline btn-sm w-full text-center">
                View Full Details &amp; AI Audit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
