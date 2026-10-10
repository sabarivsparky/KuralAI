import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "../contexts/AuthContext";
import { Menu, PlusCircle, Shield, LogOut } from "lucide-react";

export default function Header({ onMenuToggle }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return t("nav.dashboard", "Dashboard");
    if (path.startsWith("/complaints/new")) return t("nav.newComplaint", "File a Complaint");
    if (path.startsWith("/complaints/")) return t("detail.originalSubmission", "Complaint Details");
    if (path.startsWith("/complaints")) return t("nav.myComplaints", "My Complaints");
    if (path.startsWith("/track")) return t("nav.track", "Track Complaints");
    if (path.startsWith("/account")) return t("nav.account", "Account Center");
    if (path.startsWith("/portals/officer")) return t("portals.officerPortalTitle", "Department Officer Portal");
    if (path.startsWith("/portals/admin")) return t("portals.adminPortalTitle", "Civic Administration Portal");
    return t("appTitle", "KuralAI Portal");
  };

  return (
    <header className="app-top-bar" role="banner">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Trigger */}
        <button
          className="mobile-hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Toggle Navigation Menu"
          aria-expanded="false"
        >
          <Menu style={{ width: 20, height: 20 }} />
        </button>

        <h1 className="app-top-bar-title">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Language Selector */}
        <LanguageSwitcher />

        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/account"
              className="user-profile-pill"
              title="My Account"
              aria-label="Account Settings"
            >
              <div className="user-avatar" aria-hidden="true">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="user-name-text">
                {user.displayName || "Citizen"}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="btn btn-outline btn-sm"
              title={t("nav.logout", "Sign Out")}
              aria-label={t("nav.logout", "Sign Out")}
            >
              <LogOut style={{ width: 14, height: 14 }} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn btn-outline btn-sm">
              {t("nav.login", "Sign In")}
            </Link>
            <Link to="/signup" className="btn btn-accent btn-sm">
              {t("nav.signup", "Register")}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
