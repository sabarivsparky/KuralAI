import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  Shield,
  Mic,
  Camera,
  Layers,
  Building,
  Search,
  ArrowRight,
  Sparkles,
  Menu,
  X,
  LogOut,
  FileCheck2,
  Clock,
  LayoutDashboard,
  Users,
  Building2,
  SlidersHorizontal,
} from "lucide-react";

export default function LandingPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [trackId, setTrackId] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackId.trim()) {
      navigate(`/track?id=${encodeURIComponent(trackId.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="landing-page-wrapper">
      {/* --- HEADER --- */}
      <header className="site-header" role="banner">
        <div className="container header-inner">
          {/* Brand Logo & Wordmark */}
          <Link to="/" className="header-brand" aria-label="KuralAI Home">
            <div className="brand-icon">
              <Shield style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div className="brand-title">KuralAI</div>
              <div className="brand-tagline">Civic AI Platform</div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" aria-label="Main Navigation">
            <Link to="/" className="nav-link active">{t("nav.home", "Home")}</Link>
            <Link to="/complaints/new" className="nav-link">{t("landing.reportIssueBtn", "Report Issue")}</Link>
            <Link to="/track" className="nav-link">{t("landing.trackComplaintBtn", "Track Complaint")}</Link>
            <Link to="/complaints" className="nav-link">{t("nav.myComplaints", "Directory")}</Link>
          </nav>

          {/* Header Action Buttons (Language Selector + Auth) */}
          <div className="header-actions header-actions-desktop">
            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="btn btn-accent btn-sm">
                  <LayoutDashboard style={{ width: 14, height: 14 }} />
                  <span>{t("nav.dashboard", "Dashboard")}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-light btn-sm"
                  title={t("nav.logout", "Sign Out")}
                  aria-label={t("nav.logout", "Sign Out")}
                >
                  <LogOut style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-outline-light btn-sm">{t("portals.citizenChoice", "Citizens")}</Link>
                <Link to="/departments" className="btn btn-outline-light btn-sm">{t("portals.deptChoice", "Departments")}</Link>
                <Link to="/admin/login" className="btn btn-accent btn-sm">{t("portals.adminChoice", "Admin")}</Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-hamburger-btn"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer" role="dialog" aria-modal="true">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">{t("nav.home", "Home")}</Link>
            <Link to="/complaints/new" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">{t("landing.reportIssueBtn", "Report Issue")}</Link>
            <Link to="/track" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">{t("landing.trackComplaintBtn", "Track Complaint")}</Link>
            <Link to="/complaints" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">{t("nav.myComplaints", "Directory")}</Link>

            <div style={{ paddingTop: "1rem" }} className="flex flex-col gap-2">
              <div style={{ marginBottom: "0.5rem" }}>
                <LanguageSwitcher />
              </div>

              {user ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn btn-accent w-full">
                  {t("nav.dashboard", "Dashboard")}
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline-light w-full">
                    {t("portals.citizenTitle", "People / Citizens Portal")}
                  </Link>
                  <Link to="/departments" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline-light w-full">
                    {t("portals.departmentsTitle", "Municipal Departments")}
                  </Link>
                  <Link to="/admin/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-accent w-full">
                    {t("portals.adminTitle", "Administrator Portal")}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-pill">
            <Sparkles style={{ width: 14, height: 14 }} />
            <span>{t("landing.badge", "AI-Driven Multilingual Civic Platform")}</span>
          </div>

          <h1 className="hero-title">
            {t("landing.heroTitle", "Empowering Every Citizen Voice for Rapid")}{" "}
            <span className="hero-highlight">{t("landing.heroTitleHighlight", "Civic Action")}</span>
          </h1>

          <p className="hero-subtitle">
            {t("landing.heroSubtitle", "Report local grievances in Tamil, English, or Hindi using voice notes, photos, or text. Our Gemini AI automatically routes, prioritizes, and tracks resolution progress.")}
          </p>

          <div className="hero-actions">
            <Link to="/complaints/new" className="btn btn-accent btn-lg">
              <Mic style={{ width: 18, height: 18 }} />
              <span>{t("landing.reportIssueBtn", "Report an Issue")}</span>
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>

            <Link to="/track" className="btn btn-outline-light btn-lg">
              <Search style={{ width: 16, height: 16 }} />
              <span>{t("landing.trackComplaintBtn", "Track Complaint")}</span>
            </Link>
          </div>

          {/* Compact Tracking Form Bar */}
          <div className="hero-search-card">
            <form onSubmit={handleTrackSubmit} className="search-form-row">
              <Search style={{ width: 18, height: 18, color: "var(--color-text-secondary)", marginLeft: "8px" }} />
              <input
                type="text"
                placeholder={t("landing.searchPlaceholder", "Enter Complaint ID to check status...")}
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                className="search-input-field"
                aria-label={t("landing.searchPlaceholder", "Enter Complaint ID to check status...")}
              />
              <button type="submit" className="btn btn-accent btn-sm">
                {t("landing.trackNowBtn", "Track Now")}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* --- PORTAL SELECTION SECTION --- */}
      <section className="portal-selection-section" style={{ padding: "3.5rem 0", background: "var(--bg-secondary, #F4F6F9)", borderBottom: "1px solid var(--border-primary)" }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: "2.25rem", textAlign: "center" }}>
            <h2 className="section-title" style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-navy)" }}>
              {t("landing.portalsSectionTitle", "Access Your KuralAI Portal")}
            </h2>
            <p className="section-subtitle" style={{ color: "var(--color-text-secondary)", maxWidth: 620, margin: "0 auto" }}>
              {t("landing.portalsSectionSubtitle", "Dedicated, secure gateways for citizens, municipal agency officers, and city administrators.")}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1.5rem" }}>
            {/* Card 1: People / Citizens */}
            <div className="card hover-shadow" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--border-primary)" }}>
              <div>
                <div style={{ width: 48, height: 48, borderRadius: "10px", background: "rgba(43, 122, 120, 0.12)", color: "var(--color-teal)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                  <Users style={{ width: 24, height: 24 }} />
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-navy)", marginBottom: "0.5rem" }}>
                  {t("portals.citizenTitle", "People / Citizens")}
                </h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                  {t("portals.citizenDesc", "Report civic issues in Tamil, English, or Hindi via voice or photo. Track real-time progress to resolution.")}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <Link to="/login" className="btn btn-primary" style={{ flex: 1, textAlign: "center" }}>
                  {t("nav.login", "Sign In")}
                </Link>
                <Link to="/signup" className="btn btn-outline" style={{ flex: 1, textAlign: "center" }}>
                  {t("nav.signup", "Register")}
                </Link>
              </div>
            </div>

            {/* Card 2: Departments */}
            <div className="card hover-shadow" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--border-primary)" }}>
              <div>
                <div style={{ width: 48, height: 48, borderRadius: "10px", background: "rgba(36, 124, 120, 0.12)", color: "var(--color-teal)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                  <Building2 style={{ width: 24, height: 24 }} />
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-navy)", marginBottom: "0.5rem" }}>
                  {t("portals.departmentsTitle", "Municipal Departments")}
                </h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                  {t("portals.departmentsDesc", "Water, Roads, Electricity, Sanitation, and Public Works. Staff sign in to manage assigned queues.")}
                </p>
              </div>
              <Link to="/departments" className="btn btn-primary w-full" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <span>{t("portals.selectDeptBtn", "Select Department")}</span>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
            </div>

            {/* Card 3: Administrator */}
            <div className="card hover-shadow" style={{ padding: "2rem", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FFFFFF", borderRadius: "12px", border: "1px solid var(--border-primary)" }}>
              <div>
                <div style={{ width: 48, height: 48, borderRadius: "10px", background: "rgba(23, 37, 84, 0.1)", color: "var(--color-navy)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                  <SlidersHorizontal style={{ width: 24, height: 24 }} />
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-navy)", marginBottom: "0.5rem" }}>
                  {t("portals.adminTitle", "Administrator")}
                </h3>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                  {t("portals.adminDesc", "City-wide analytics, department oversight, officer role assignments, and verifiable audit trails.")}
                </p>
              </div>
              <Link to="/admin/login" className="btn btn-outline w-full" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", borderColor: "var(--color-navy)", color: "var(--color-navy)" }}>
                <span>{t("portals.adminLoginBtn", "Admin Portal Login")}</span>
                <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID SECTION --- */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t("landing.sectionFeaturesTitle", "Designed for Citizens and Smart Governance")}</h2>
            <p className="section-subtitle">
              {t("landing.sectionFeaturesSubtitle", "End-to-end technology pipeline that translates spoken grievances into actionable, routed department tickets.")}
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Mic style={{ width: 22, height: 22 }} />
              </div>
              <h3 className="feature-card-title">{t("landing.featVoiceTitle", "Multilingual Voice & Text")}</h3>
              <p className="feature-card-desc">
                {t("landing.featVoiceDesc", "Express your grievance naturally in Tamil, Hindi, or English. Integrated Sarvam STT transcribes speech into clear data.")}
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Camera style={{ width: 22, height: 22 }} />
              </div>
              <h3 className="feature-card-title">{t("landing.featPhotoTitle", "Photo & Evidence Attachment")}</h3>
              <p className="feature-card-desc">
                {t("landing.featPhotoDesc", "Upload photos of potholes, drainage leaks, or streetlights. Gemini Vision analyzes image content automatically.")}
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Layers style={{ width: 22, height: 22 }} />
              </div>
              <h3 className="feature-card-title">{t("landing.featClassTitle", "Smart Issue Classification")}</h3>
              <p className="feature-card-desc">
                {t("landing.featClassDesc", "AI evaluates severity scores (1-5), urgency levels, and disruption impact to prioritize urgent public safety risks.")}
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Building style={{ width: 22, height: 22 }} />
              </div>
              <h3 className="feature-card-title">{t("landing.featRoutingTitle", "Automated Department Routing")}</h3>
              <p className="feature-card-desc">
                {t("landing.featRoutingDesc", "Complaints are dispatched to the right agency (PWD, Water Board, Electricity Board, Sanitation) without manual delay.")}
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Clock style={{ width: 22, height: 22 }} />
              </div>
              <h3 className="feature-card-title">{t("landing.featTrackingTitle", "Real-Time Complaint Tracking")}</h3>
              <p className="feature-card-desc">
                {t("landing.featTrackingDesc", "Track the exact status of your complaint with a unique tracking ID from submission to review and resolution.")}
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <FileCheck2 style={{ width: 22, height: 22 }} />
              </div>
              <h3 className="feature-card-title">{t("landing.featAuditTitle", "Audit Logs & Verification")}</h3>
              <p className="feature-card-desc">
                {t("landing.featAuditDesc", "Every stage update and official action is logged transparently in an immutable audit history for full accountability.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t("landing.howItWorksTitle", "How KuralAI Works")}</h2>
            <p className="section-subtitle">{t("landing.howItWorksSubtitle", "Simple 3-step process to get civic issues resolved fast.")}</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">{t("landing.step1Title", "Speak or Type Your Issue")}</h3>
              <p className="step-desc">
                {t("landing.step1Desc", "Record a voice note or type in Tamil, Hindi, or English. Attach a photo if available.")}
              </p>
            </div>

            <div className="step-card">
              <div className="step-number" style={{ backgroundColor: "#2B7A78" }}>2</div>
              <h3 className="step-title">{t("landing.step2Title", "AI Analyzes & Routes")}</h3>
              <p className="step-desc">
                {t("landing.step2Desc", "Gemini AI classifies the issue, calculates urgency, and assigns the correct department ticket.")}
              </p>
            </div>

            <div className="step-card">
              <div className="step-number" style={{ backgroundColor: "#1B8A6B" }}>3</div>
              <h3 className="step-title">{t("landing.step3Title", "Track to Resolution")}</h3>
              <p className="step-desc">
                {t("landing.step3Desc", "Monitor status updates and officer progress online using your tracking ID.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="site-footer" role="contentinfo">
        <div className="container footer-inner">
          <div className="flex items-center gap-2" style={{ color: "#FFFFFF" }}>
            <Shield style={{ width: 18, height: 18, color: "#3AAFA9" }} />
            <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>KuralAI Civic Platform</span>
          </div>

          <p>© 2026 KuralAI. {t("landing.footerTagline", "Empowering Citizens with Multilingual AI Technology.")}</p>

          <div className="flex items-center gap-4">
            <Link to="/track" className="nav-link">{t("nav.track", "Tracker")}</Link>
            <Link to="/login" className="nav-link">{t("nav.login", "Sign In")}</Link>
            <Link to="/signup" className="nav-link">{t("nav.signup", "Register")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
