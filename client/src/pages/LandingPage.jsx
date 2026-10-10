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
      <header className="site-header">
        <div className="container header-inner">
          {/* Brand Logo & Wordmark */}
          <Link to="/" className="header-brand">
            <div className="brand-icon">
              <Shield style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div className="brand-title">KuralAI</div>
              <div className="brand-tagline">Civic AI Platform</div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav">
            <Link to="/" className="nav-link active">Home</Link>
            <Link to="/complaints/new" className="nav-link">Report Issue</Link>
            <Link to="/track" className="nav-link">Track Complaint</Link>
            <Link to="/complaints" className="nav-link">Results & Directory</Link>
          </nav>

          {/* Header Action Buttons (Single Language Selector) */}
          <div className="header-actions header-actions-desktop">
            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/dashboard" className="btn btn-accent btn-sm">
                  <LayoutDashboard style={{ width: 14, height: 14 }} />
                  <span>Dashboard</span>
                </Link>
                <button onClick={handleLogout} className="btn btn-outline-light btn-sm" title="Sign Out">
                  <LogOut style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-outline-light btn-sm">Sign In</Link>
                <Link to="/signup" className="btn btn-accent btn-sm">Register</Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button (Hidden on Desktop >=768px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-hamburger-btn"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Home</Link>
            <Link to="/complaints/new" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Report Issue</Link>
            <Link to="/track" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Track Complaint</Link>
            <Link to="/complaints" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Results & Directory</Link>

            <div style={{ paddingTop: "1rem" }} className="flex flex-col gap-2">
              <div style={{ marginBottom: "0.5rem" }}>
                <LanguageSwitcher />
              </div>

              {user ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn btn-accent w-full">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline-light w-full">
                    Sign In
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn btn-accent w-full">
                    Register Account
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
            <span>AI-Driven Multilingual Civic Platform</span>
          </div>

          <h1 className="hero-title">
            Empowering Every Citizen Voice for Rapid <span className="hero-highlight">Civic Action</span>
          </h1>

          <p className="hero-subtitle">
            Report local grievances in Tamil, English, or Hindi using voice notes, photos, or text. Our Gemini AI automatically routes, prioritizes, and tracks resolution progress.
          </p>

          <div className="hero-actions">
            <Link to="/complaints/new" className="btn btn-accent btn-lg">
              <Mic style={{ width: 18, height: 18 }} />
              <span>Report an Issue</span>
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>

            <Link to="/track" className="btn btn-outline-light btn-lg">
              <Search style={{ width: 16, height: 16 }} />
              <span>Track Complaint</span>
            </Link>
          </div>

          {/* Compact Tracking Form Bar */}
          <div className="hero-search-card">
            <form onSubmit={handleTrackSubmit} className="search-form-row">
              <Search style={{ width: 18, height: 18, color: "var(--color-text-secondary)", marginLeft: "8px" }} />
              <input
                type="text"
                placeholder="Enter Complaint ID to check status..."
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                className="search-input-field"
              />
              <button type="submit" className="btn btn-accent btn-sm">
                Track Now
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID SECTION --- */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Designed for Citizens and Smart Governance</h2>
            <p className="section-subtitle">
              End-to-end technology pipeline that translates spoken grievances into actionable, routed department tickets.
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Mic style={{ width: 22, height: 22 }} />
              </div>
              <h3 className="feature-card-title">Multilingual Voice & Text</h3>
              <p className="feature-card-desc">
                Express your grievance naturally in Tamil, Hindi, or English. Integrated Sarvam STT transcribes speech into clear data.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Camera style={{ width: 22, height: 22 }} />
              </div>
              <h3 className="feature-card-title">Photo & Evidence Attachment</h3>
              <p className="feature-card-desc">
                Upload photos of potholes, drainage leaks, or streetlights. Gemini Vision analyzes image content automatically.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Layers style={{ width: 22, height: 22 }} />
              </div>
              <h3 className="feature-card-title">Smart Issue Classification</h3>
              <p className="feature-card-desc">
                AI evaluates severity scores (1-5), urgency levels, and disruption impact to prioritize urgent public safety risks.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Building style={{ width: 22, height: 22 }} />
              </div>
              <h3 className="feature-card-title">Automated Department Routing</h3>
              <p className="feature-card-desc">
                Complaints are dispatched to the right agency (PWD, Water Board, Electricity Board, Sanitation) without manual delay.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Clock style={{ width: 22, height: 22 }} />
              </div>
              <h3 className="feature-card-title">Real-Time Complaint Tracking</h3>
              <p className="feature-card-desc">
                Track the exact status of your complaint with a unique tracking ID from submission to review and resolution.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <FileCheck2 style={{ width: 22, height: 22 }} />
              </div>
              <h3 className="feature-card-title">Audit Logs & Verification</h3>
              <p className="feature-card-desc">
                Every stage update and official action is logged transparently in an immutable audit history for full accountability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How KuralAI Works</h2>
            <p className="section-subtitle">Simple 3-step process to get civic issues resolved fast.</p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Speak or Type Your Issue</h3>
              <p className="step-desc">
                Record a voice note or type in Tamil, Hindi, or English. Attach a photo if available.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number" style={{ backgroundColor: "#2B7A78" }}>2</div>
              <h3 className="step-title">AI Analyzes & Routes</h3>
              <p className="step-desc">
                Gemini AI classifies the issue, calculates urgency, and assigns the correct department ticket.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number" style={{ backgroundColor: "#1B8A6B" }}>3</div>
              <h3 className="step-title">Track to Resolution</h3>
              <p className="step-desc">
                Monitor status updates and officer progress online using your tracking ID.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="flex items-center gap-2" style={{ color: "#FFFFFF" }}>
            <Shield style={{ width: 18, height: 18, color: "#3AAFA9" }} />
            <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>KuralAI Civic Platform</span>
          </div>

          <p>© 2026 KuralAI. Empowering Citizens with Multilingual AI Technology.</p>

          <div className="flex items-center gap-4">
            <Link to="/track" className="nav-link">Tracker</Link>
            <Link to="/login" className="nav-link">Sign In</Link>
            <Link to="/signup" className="nav-link">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
