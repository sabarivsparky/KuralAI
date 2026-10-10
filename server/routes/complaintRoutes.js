const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const Complaint = require("../models/Complaint");
const AuditLog = require("../models/AuditLog");
const { runListenerAgent } = require("../agents/listener");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// --- Multer configuration with file size and type restrictions ---
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed."));
    }
  },
});

// --- Complaint text length limits ---
const MAX_TEXT_LENGTH = 5000;
const VALID_LANGUAGES = ["en", "ta", "hi"];

// POST / — submit a complaint (authenticated users get their complaint linked)
router.post("/", optionalAuth, upload.single("photo"), async (req, res) => {
  try {
    const { text = "", language = "en", lat, lng } = req.body;

    // Validate text length
    if (typeof text !== "string" || text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ message: `Complaint text must be under ${MAX_TEXT_LENGTH} characters.` });
    }

    if (!text.trim() && !req.file) {
      return res.status(400).json({ message: "Send text or a photo" });
    }

    // Validate language
    const safeLang = VALID_LANGUAGES.includes(language) ? language : "en";

    // Validate GeoJSON coordinates if provided
    let geoData = undefined;
    if (lat !== undefined && lng !== undefined) {
      const numLat = Number(lat);
      const numLng = Number(lng);
      if (
        !Number.isFinite(numLat) || !Number.isFinite(numLng) ||
        numLat < -90 || numLat > 90 ||
        numLng < -180 || numLng > 180
      ) {
        return res.status(400).json({ message: "Invalid GPS coordinates." });
      }
      geoData = { type: "Point", coordinates: [numLng, numLat] };
    }

    const result = await runListenerAgent({
      text: text.trim(),
      language: safeLang,
      imagePath: req.file?.path,
      mimeType: req.file?.mimetype,
    });

    const complaint = await Complaint.create({
      userId: req.user?._id || null,
      text,
      language: safeLang,
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      status: "Submitted",
      department: result.departmentId || null,
      aiAnalysis: result.analysis,
      analyzedAt: new Date(),
      ...(geoData && { geo: geoData }),
    });

    await AuditLog.create({
      complaintId: complaint._id,
      agent: "Listener Agent",
      action: result.success ? "Complaint Analyzed & Submitted" : "Submitted with Fallback Analysis",
      details: result.analysis?.citizenReply || "Complaint registered in KuralAI platform.",
    });

    res.status(201).json({ complaint, listener: result });
  } catch (error) {
    // Handle Multer file-size/type errors
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Uploaded file is too large. Maximum 5 MB." });
    }
    if (error.message && error.message.includes("images are allowed")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Error processing complaint:", error);
    res.status(500).json({ message: "Failed to process complaint" });
  }
});

// GET / — list complaints for the authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    const items = await Complaint.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(items);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
});

// GET /stats — complaint statistics for the authenticated user
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const [total, pending, inProgress, resolved] = await Promise.all([
      Complaint.countDocuments({ userId }),
      Complaint.countDocuments({ userId, status: "Submitted" }),
      Complaint.countDocuments({ userId, status: { $in: ["In Review", "In Progress"] } }),
      Complaint.countDocuments({ userId, status: "Resolved" }),
    ]);
    res.json({
      total,
      submitted: total,
      pending,
      inProgress,
      resolved,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

// GET /track/:id — Public tracking lookup endpoint (does NOT require login)
router.get("/track/:id", async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(404).json({ message: "Invalid Complaint ID format. Please check your 24-character tracking ID." });
    }
    // Public tracking: exclude userId (private) from response
    const complaint = await Complaint.findById(rawId).select("-userId");
    if (!complaint) {
      return res.status(404).json({ message: "No complaint record found with this ID." });
    }
    const logs = await AuditLog.find({ complaintId: rawId }).sort({ createdAt: 1 });
    res.json({ complaint, logs });
  } catch (error) {
    console.error("Error tracking complaint:", error);
    res.status(500).json({ message: "Failed to track complaint" });
  }
});

// GET /:id — single complaint detail (scoped to authenticated user only)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(404).json({ message: "Invalid Complaint ID format." });
    }

    if (req.user) {
      // Authenticated: only return complaints owned by this user
      const complaint = await Complaint.findOne({
        _id: rawId,
        userId: req.user._id,
      });
      if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      return res.json(complaint);
    }

    // Unauthenticated: return public view without userId
    const complaint = await Complaint.findById(rawId).select("-userId");
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    res.json(complaint);
  } catch (error) {
    console.error("Error fetching complaint:", error);
    res.status(500).json({ message: "Failed to fetch complaint" });
  }
});

// GET /:id/log — audit logs for a complaint
router.get("/:id/log", optionalAuth, async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(404).json({ message: "Invalid Complaint ID format." });
    }
    const logs = await AuditLog.find({ complaintId: rawId }).sort({ createdAt: 1 });
    res.json(logs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

module.exports = router;