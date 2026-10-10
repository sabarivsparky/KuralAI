import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import { User, Mail, Globe, Phone, MapPin, Save, CheckCircle2, AlertCircle, Loader2, Shield } from "lucide-react";

export default function AccountPage() {
  const { t, i18n } = useTranslation();
  const { user, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [preferredLanguage, setPreferredLanguage] = useState(
    user?.preferredLanguage || i18n.language || "en"
  );
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      await updateProfile({
        displayName,
        preferredLanguage,
        phone,
        address,
      });

      // Update i18n language
      if (preferredLanguage) {
        i18n.changeLanguage(preferredLanguage);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Profile update error", err);
      setError(err.message || "Failed to update profile details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="account-page-container">
      <div className="page-header-row flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h2 className="page-title">{t("account.pageTitle", "My Account")}</h2>
          <p className="page-subtitle">
            {t("account.pageSubtitle", "Manage your personal details, language preferences, and contact information.")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="category-pill flex items-center gap-1.5" style={{ background: "var(--color-teal-bg)", color: "var(--accent-teal)", fontWeight: 700, textTransform: "capitalize" }}>
            <Shield style={{ width: 14, height: 14 }} />
            <span>Role: {user?.role || "Citizen"}</span>
          </span>
        </div>
      </div>

      <div className="card" style={{ maxWidth: "680px" }}>
        {success && (
          <div className="alert alert-success" style={{ marginBottom: "1.5rem" }}>
            <CheckCircle2 style={{ width: 20, height: 20 }} />
            <span>{t("account.successMsg", "Profile details updated successfully!")}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
            <AlertCircle style={{ width: 20, height: 20 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="account-form">
          <div className="form-group">
            <label className="form-label">{t("account.emailLabel", "Email Address (Read Only)")}</label>
            <div className="input-with-icon">
              <Mail className="input-icon" style={{ width: 18, height: 18 }} />
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="form-input"
                style={{ cursor: "not-allowed", backgroundColor: "var(--color-bg)", color: "var(--color-text-secondary)" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("account.fullNameLabel", "Full Name")}</label>
            <div className="input-with-icon">
              <User className="input-icon" style={{ width: 18, height: 18 }} />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("account.prefLangLabel", "Preferred Interface Language")}</label>
            <div className="input-with-icon">
              <Globe className="input-icon" style={{ width: 18, height: 18 }} />
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="form-input form-select"
              >
                <option value="en">English</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("account.phoneLabel", "Phone Number")}</label>
            <div className="input-with-icon">
              <Phone className="input-icon" style={{ width: 18, height: 18 }} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t("account.addressLabel", "Address / Locality")}</label>
            <div className="input-with-icon">
              <MapPin className="input-icon" style={{ width: 18, height: 18 }} />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ward 12, Anna Nagar, Chennai"
                className="form-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ marginTop: "1rem" }}
          >
            {saving ? (
              <>
                <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                <span>{t("account.savingBtn", "Saving...")}</span>
              </>
            ) : (
              <>
                <Save style={{ width: 16, height: 16 }} />
                <span>{t("account.saveBtn", "Save Profile Changes")}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
