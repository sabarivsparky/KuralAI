const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const Complaint = require("../models/Complaint");
const AuditLog = require("../models/AuditLog");
const { runListenerAgent } = require("../agents/listener");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// POST / — submit a complaint (authenticated users get their complaint linked)
router.post("/", optionalAuth, upload.single("photo"), async (req, res) => {
  try {
    const { text = "", language = "en", lat, lng } = req.body;

    if (!text.trim() && !req.file) {
      return res.status(400).json({ message: "Send text or a photo" });
    }

    const result = await runListenerAgent({
      text,
      language,
      imagePath: req.file?.path,
      mimeType: req.file?.mimetype,
    });

    const complaint = await Complaint.create({
      userId: req.user?._id || null,
      text,
      language,
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      status: "Submitted",
      aiAnalysis: result.analysis,
      analyzedAt: new Date(),
      ...(lat && lng && {
        geo: { type: "Point", coordinates: [Number(lng), Number(lat)] },
      }),
    });

    await AuditLog.create({
      complaintId: complaint._id,
      agent: "Listener Agent",
      action: result.success ? "Complaint Analyzed & Submitted" : "Submitted with Fallback Analysis",
      details: result.analysis?.citizenReply || "Complaint registered in KuralAI platform.",
    });

    res.status(201).json({ complaint, listener: result });
  } catch (error) {
    console.error("Error processing complaint:", error);
    res.status(500).json({ message: "Failed to process complaint", error: error.message });
  }
});

// GET / — list complaints for the authenticated user (or all if query parameter public=true)
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

// GET /:id — single complaint detail (scoped to user, or fallback by ID if matching)
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(404).json({ message: "Invalid Complaint ID format." });
    }

    let complaint;
    if (req.user) {
      complaint = await Complaint.findOne({
        _id: rawId,
        userId: req.user._id,
      });
    }

    // Fallback search if not found by userId (e.g. tracking by ID)
    if (!complaint) {
      complaint = await Complaint.findById(rawId);
    }

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