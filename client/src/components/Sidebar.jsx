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
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
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

  return (
    <aside className={`app-sidebar ${isOpen ? "sidebar-mobile-open" : ""}`}>
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

        <nav className="sidebar-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/dashboard"}
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
