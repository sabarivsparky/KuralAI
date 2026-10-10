import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { submitComplaint, transcribeVoice } from "../services/api";
import { blobToWav } from "../utils/toWav";
import {
  Type,
  Mic,
  Camera,
  Upload,
  X,
  RefreshCw,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Globe,
  ArrowRight,
  Shield,
  FileText,
  Sparkles,
} from "lucide-react";

export default function NewComplaintPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active mode from URL (/complaints/new/text, /complaints/new/voice, /complaints/new/photo) or default "text"
  const getModeFromPath = () => {
    const path = location.pathname;
    if (path.includes("/voice")) return "voice";
    if (path.includes("/photo")) return "photo";
    return "text";
  };

  const [mode, setMode] = useState(getModeFromPath());
  const [text, setText] = useState("");
  const [landmark, setLandmark] = useState("");
  const [language, setLanguage] = useState(i18n.language || "en");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  // Submit State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMode(getModeFromPath());
  }, [location.pathname]);

  const changeMode = (newMode) => {
    setMode(newMode);
    setError(null);
    navigate(`/complaints/new/${newMode}`);
  };

  // --- Photo Handling ---
  const handlePhotoSelect = (file) => {
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError("Please select a valid image file (JPEG, PNG, or WebP).");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size must be less than 5 MB.");
      return;
    }

    setError(null);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
  };

  // --- Voice Recording Handling ---
  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);

        if (audioChunksRef.current.length === 0) return;

        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        setAudioUrl(URL.createObjectURL(blob));

        setIsTranscribing(true);
        try {
          const wav = await blobToWav(blob);
          const transcript = await transcribeVoice({ audio: wav, language });
          if (transcript) {
            setText(transcript);
          }
        } catch (err) {
          console.error("Transcription error:", err);
          setError("Could not transcribe voice audio automatically. You can type or edit your details in the description box below.");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      setError("Microphone access denied or unsupported. Please allow microphone access or type your issue instead.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // --- Complaint Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const fullText = [
      text.trim(),
      landmark.trim() ? `Location/Landmark: ${landmark.trim()}` : "",
    ].filter(Boolean).join("\n\n");

    if (!fullText && !photo) {
      setError("Please describe the issue or attach a photo before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitComplaint({
        text: fullText || "Photo Complaint Submission",
        language,
        photo,
      });

      if (result && result.complaint) {
        setSubmittedComplaint(result.complaint);
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (err) {
      console.error("Complaint submission error:", err);
      setError(err.message || "Failed to submit complaint. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Success Screen ---
  if (submittedComplaint) {
    return (
      <div className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem", maxWidth: "680px" }}>
        <div className="card" style={{ padding: "2.5rem", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(5, 150, 105, 0.12)", color: "#047857", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem auto" }}>
            <CheckCircle2 style={{ width: 28, height: 28 }} />
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-navy)", marginBottom: "0.5rem" }}>
            Complaint Submitted Successfully!
          </h2>

          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>
            Your complaint has been registered and assigned for AI department routing and review.
          </p>

          <div style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary)", fontWeight: 600 }}>
              Tracking Reference ID
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: "monospace", color: "var(--color-navy)", marginTop: "0.25rem" }}>
              #{submittedComplaint._id}
            </div>
          </div>

          {submittedComplaint.aiAnalysis && (
            <div style={{ textAlign: "left", background: "var(--color-teal-bg)", border: "1px solid rgba(36, 124, 120, 0.3)", borderRadius: "var(--radius-lg)", padding: "1rem", marginBottom: "1.5rem", fontSize: "0.8125rem", color: "var(--color-text-primary)" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--accent-teal)" }}>
                AI Initial Analysis Response:
              </div>
              <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
                {submittedComplaint.aiAnalysis.citizenReply || "Your complaint has been queued for review by the appropriate department."}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={`/complaints/${submittedComplaint._id}`} className="btn btn-accent flex-1">
              View Status Details
            </Link>
            <Link to="/dashboard" className="btn btn-outline flex-1">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: "1.5rem", paddingBottom: "3rem", maxWidth: "900px" }}>
      {/* Page Heading */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0.75rem", borderRadius: "9999px", background: "var(--color-teal-bg)", color: "var(--accent-teal)", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.5rem" }}>
          <Sparkles style={{ width: 14, height: 14 }} />
          <span>Multilingual AI Intake Engine Active</span>
        </div>
        <h2 className="page-title">
          File a Civic Complaint
        </h2>
        <p className="page-subtitle">
          Choose your preferred reporting method below to describe the issue in Tamil, English, or Hindi.
        </p>
      </div>

      {/* THREE CLEAR REPORTING CHOICES GRID */}
      <div className="reporting-choices-grid">
        {/* Choice 1: Type an Issue */}
        <div
          onClick={() => changeMode("text")}
          className={`choice-card ${mode === "text" ? "active" : ""}`}
        >
          <div className="choice-icon">
            <Type style={{ width: 28, height: 28 }} />
          </div>
          <h3 className="choice-title">1. Type an Issue</h3>
          <p className="choice-desc">
            Describe the civic problem using text. Add optional landmark and photo evidence.
          </p>

          <span className={`btn btn-sm ${mode === "text" ? "btn-accent" : "btn-outline"}`}>
            Select Text Intake
          </span>
        </div>

        {/* Choice 2: Record Voice */}
        <div
          onClick={() => changeMode("voice")}
          className={`choice-card ${mode === "voice" ? "active" : ""}`}
        >
          <div className="choice-icon" style={{ background: "rgba(217, 119, 6, 0.12)", color: "#B45309" }}>
            <Mic style={{ width: 28, height: 28 }} />
          </div>
          <h3 className="choice-title">2. Record Voice</h3>
          <p className="choice-desc">
            Speak into your microphone in Tamil, Hindi, or English. AI automatically transcribes your words.
          </p>

          <span className={`btn btn-sm ${mode === "voice" ? "btn-accent" : "btn-outline"}`}>
            Select Voice Intake
          </span>
        </div>

        {/* Choice 3: Upload a Photo */}
        <div
          onClick={() => changeMode("photo")}
          className={`choice-card ${mode === "photo" ? "active" : ""}`}
        >
          <div className="choice-icon" style={{ background: "rgba(5, 150, 105, 0.12)", color: "#047857" }}>
            <Camera style={{ width: 28, height: 28 }} />
          </div>
          <h3 className="choice-title">3. Upload a Photo</h3>
          <p className="choice-desc">
            Upload photo evidence of potholes, water leaks, or garbage. Gemini Vision analyzes image details.
          </p>

          <span className={`btn btn-sm ${mode === "photo" ? "btn-accent" : "btn-outline"}`}>
            Select Photo Intake
          </span>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
          <AlertCircle style={{ width: 18, height: 18, flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* WORKFLOW INTAKE FORM */}
      <div className="card" style={{ padding: "2rem" }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* PHOTO WORKFLOW SPECIFIC PANEL */}
          {mode === "photo" && (
            <div className="form-group">
              <label className="form-label">Upload Complaint Evidence Photo *</label>

              {photoPreview ? (
                <div className="image-preview-box">
                  <img src={photoPreview} alt="Complaint preview" className="image-preview-img" />
                  <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-sm btn-outline-light"
                      style={{ background: "rgba(11, 25, 48, 0.8)", border: "none" }}
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="btn btn-sm btn-danger"
                    >
                      <X style={{ width: 14, height: 14 }} />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="photo-upload-dropzone"
                >
                  <Upload style={{ width: 36, height: 36, color: "var(--accent-teal)", margin: "0 auto 0.75rem auto" }} />
                  <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-navy)" }}>
                    Click or Drag Photo Here to Upload
                  </h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                    Supported formats: JPEG, PNG, WebP (Max 5 MB)
                  </p>
                  <button
                    type="button"
                    className="btn btn-accent btn-sm"
                    style={{ marginTop: "1rem" }}
                  >
                    Select Photo File
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
              />
            </div>
          )}

          {/* VOICE WORKFLOW SPECIFIC PANEL */}
          {mode === "voice" && (
            <div className="form-group">
              <label className="form-label">Voice Recording Intake *</label>
              <div style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-xl)", padding: "1.5rem", textAlign: "center" }}>
                {isRecording ? (
                  <div>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--color-danger)", margin: "0 auto 0.75rem auto" }} className="animate-pulse" />
                    <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-danger)" }}>
                      Recording Audio... Speak clearly into your mic
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                      Tap Stop when finished speaking.
                    </p>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="btn btn-danger btn-lg"
                      style={{ marginTop: "1rem" }}
                    >
                      <Square style={{ width: 16, height: 16 }} />
                      Stop Recording
                    </button>
                  </div>
                ) : isTranscribing ? (
                  <div>
                    <Loader2 style={{ width: 32, height: 32, color: "var(--accent-teal)", margin: "0 auto 0.5rem auto" }} className="animate-spin" />
                    <h4 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-navy)" }}>
                      Converting voice audio into text via AI...
                    </h4>
                  </div>
                ) : (
                  <div>
                    <Mic style={{ width: 36, height: 36, color: "var(--accent-teal)", margin: "0 auto 0.75rem auto" }} />
                    <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-navy)" }}>
                      {audioUrl ? "Audio Recorded" : "Tap Microphone to Start Voice Recording"}
                    </h4>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.25rem" }}>
                      Speak in Tamil, Hindi, or English.
                    </p>

                    {audioUrl && (
                      <div style={{ margin: "1rem 0" }}>
                        <audio src={audioUrl} controls style={{ margin: "0 auto" }} />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={startRecording}
                      className="btn btn-accent"
                      style={{ marginTop: "0.75rem" }}
                    >
                      <Mic style={{ width: 16, height: 16 }} />
                      <span>{audioUrl ? "Re-record Voice" : "Start Microphone Recording"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMMON INPUT: Description */}
          <div className="form-group">
            <label className="form-label">
              {mode === "voice"
                ? "Review / Edit Transcribed Speech Text *"
                : mode === "photo"
                ? "Grievance Description (Optional with Photo)"
                : "Complaint Details & Description *"}
            </label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                mode === "voice"
                  ? "Transcribed text will appear here automatically. You can edit or add extra details."
                  : "Describe the civic issue clearly (e.g. Broken water pipe leaking near Ward 12 bus stop)..."
              }
              className="form-input"
              style={{ padding: "0.75rem 1rem", minHeight: "110px", resize: "vertical" }}
            />
          </div>

          {/* Form Row: Language & Landmark */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Language Used</label>
              <div className="input-with-icon">
                <Globe className="input-icon" style={{ width: 16, height: 16 }} />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="form-input form-select"
                >
                  <option value="en">English</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Location / Landmark (Optional)</label>
              <div className="input-with-icon">
                <MapPin className="input-icon" style={{ width: 16, height: 16 }} />
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Main Market, Ward 5"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* OPTIONAL PHOTO INPUT FOR TEXT/VOICE MODE */}
          {mode !== "photo" && !photoPreview && (
            <div className="form-group">
              <label className="form-label">Attach Photo Evidence (Optional)</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline flex items-center justify-start gap-2"
                style={{ width: "fit-content" }}
              >
                <Camera style={{ width: 16, height: 16 }} />
                <span>Choose Photo File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
              />
            </div>
          )}

          {/* Submit Button */}
          <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
            <button
              type="submit"
              disabled={submitting || isRecording || isTranscribing}
              className="btn btn-accent btn-lg w-full flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" />
                  <span>Submitting Complaint & Generating AI Routing...</span>
                </>
              ) : (
                <>
                  <Shield style={{ width: 18, height: 18 }} />
                  <span>Review & Submit Complaint</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
