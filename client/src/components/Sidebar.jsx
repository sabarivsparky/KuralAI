import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Search,
  User,
  LogOut,
  Shield,
  Briefcase,
  SlidersHorizontal,
  X,
  BarChart3,
  Users,
  Building2,
  ScrollText,
  ClipboardList,
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const role = user?.role || "citizen";

  // --- Citizen navigation items ---
  const citizenNavItems = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: t("nav.dashboard", "Dashboard"),
    },
    {
      to: "/complaints/new",
      icon: PlusCircle,
      label: t("nav.newComplaint", "File a Complaint"),
    },
    {
      to: "/complaints",
      icon: FileText,
      label: t("nav.myComplaints", "My Complaints"),
    },
    {
      to: "/track",
      icon: Search,
      label: t("nav.track", "Track Complaints"),
    },
    {
      to: "/account",
      icon: User,
      label: t("nav.account", "Account Center"),
    },
  ];

  // --- Officer navigation items ---
  const officerNavItems = [
    {
      to: "/officer/dashboard",
      icon: Briefcase,
      label: t("nav.officerDashboard", "Department Queue"),
    },
    {
      to: "/officer/complaints",
      icon: ClipboardList,
      label: t("nav.officerComplaints", "Assigned Complaints"),
    },
    {
      to: "/officer/stats",
      icon: BarChart3,
      label: t("nav.officerStats", "Dept Statistics"),
    },
    {
      to: "/track",
      icon: Search,
      label: t("nav.track", "Track Complaints"),
    },
    {
      to: "/account",
      icon: User,
      label: t("nav.account", "Account Center"),
    },
  ];

  // --- Admin navigation items ---
  const adminNavItems = [
    {
      to: "/admin/dashboard",
      icon: SlidersHorizontal,
      label: t("nav.adminDashboard", "Admin Dashboard"),
    },
    {
      to: "/admin/complaints",
      icon: ClipboardList,
      label: t("nav.adminComplaints", "All Complaints"),
    },
    {
      to: "/admin/users",
      icon: Users,
      label: t("nav.adminUsers", "User Management"),
    },
    {
      to: "/admin/departments",
      icon: Building2,
      label: t("nav.adminDepts", "Departments"),
    },
    {
      to: "/admin/audit-logs",
      icon: ScrollText,
      label: t("nav.adminAudit", "Audit Trail"),
    },
    {
      to: "/track",
      icon: Search,
      label: t("nav.track", "Track Complaints"),
    },
    {
      to: "/account",
      icon: User,
      label: t("nav.account", "Account Center"),
    },
  ];

  // Select nav items based on role
  let activeNavItems = citizenNavItems;
  let portalLabel = "Citizen Portal";
  if (role === "official") {
    activeNavItems = officerNavItems;
    portalLabel = "Officer Portal";
  } else if (role === "admin") {
    activeNavItems = adminNavItems;
    portalLabel = "Admin Portal";
  }

  // Role badge color
  const roleBadgeColor = {
    citizen: "rgba(255, 255, 255, 0.15)",
    official: "rgba(36, 124, 120, 0.35)",
    admin: "rgba(220, 60, 60, 0.25)",
  };

  const roleDisplayName = {
    citizen: "Citizen",
    official: "Officer",
    admin: "Admin",
  };

  return (
    <aside
      className={`app-sidebar ${isOpen ? "sidebar-mobile-open" : ""}`}
      aria-label="Sidebar Navigation"
    >
      <div>
        <div className="sidebar-header">
          <div className="flex items-center gap-3">
            <div className="brand-icon">
              <Shield style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div className="brand-title">KuralAI</div>
              <div className="brand-tagline">Civic Platform</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            aria-label="Close menu"
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav-list" aria-label={`${portalLabel} routes`}>
          <div style={{
            padding: "0 0.75rem 0.5rem 0.75rem",
            fontSize: "0.6875rem",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "rgba(255, 255, 255, 0.45)",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span>{portalLabel}</span>
            {user && (
              <span style={{
                fontSize: "0.5625rem",
                background: roleBadgeColor[role] || roleBadgeColor.citizen,
                padding: "1px 6px",
                borderRadius: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}>
                {roleDisplayName[role] || role}
              </span>
            )}
          </div>
          {activeNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to.endsWith("/dashboard")}
                onClick={onClose}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon style={{ width: 18, height: 18 }} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        {user ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="user-avatar">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.displayName || "Citizen"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.72)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.email}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-outline-light btn-sm w-full"
              style={{ marginTop: "0.5rem" }}
            >
              <LogOut style={{ width: 14, height: 14 }} />
              <span>{t("nav.logout", "Sign Out")}</span>
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="btn btn-accent w-full">
            {t("nav.login", "Sign In")}
          </NavLink>
        )}
      </div>
    </aside>
  );
}
