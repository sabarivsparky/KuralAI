const express = require("express");
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const AuditLog = require("../models/AuditLog");
const Department = require("../models/Department");
const { requireAuth } = require("../middleware/auth");
const { checkRole, checkActive, checkDepartment } = require("../middleware/authorize");

const router = express.Router();

// All officer routes require: auth + active account + official role + department
router.use(requireAuth, checkActive, checkRole("official", "admin"), checkDepartment);

// --- Valid status transitions for officers ---
const OFFICER_TRANSITIONS = {
  Submitted: ["In Review", "Rejected"],
  "In Review": ["In Progress", "Rejected", "Escalated"],
  "In Progress": ["Resolved", "Rejected", "Escalated"],
  Escalated: ["In Review", "In Progress"],
};

/**
 * GET /api/officer/complaints
 * Department-scoped complaint queue.
 * Query params: ?status=Submitted&page=1&limit=20&sort=createdAt&order=desc
 */
router.get("/complaints", async (req, res) => {
  try {
    const dept = await Department.findById(req.user.department);
    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    const {
      status,
      page = 1,
      limit = 20,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Primary: match by department ObjectId; Fallback: legacy regex on aiAnalysis.department string
    const filter = {
      $or: [
        { department: dept._id },
        { department: null, "aiAnalysis.department": { $regex: new RegExp(`^${dept.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "i") } },
      ],
    };

    if (status) {
      if (status === "Submitted") {
        filter.status = { $in: ["Submitted", "received", "analyzed", "analysis-fallback"] };
      } else {
        filter.status = status;
      }
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const allowedSortFields = ["createdAt", "updatedAt", "status", "aiAnalysis.priorityScore"];
    const safeSort = allowedSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate("assignedOfficer", "displayName email")
        .populate("department", "name code")
        .sort({ [safeSort]: sortOrder })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    // Normalize legacy status strings on lean objects
    complaints.forEach((c) => {
      if (["received", "analyzed", "analysis-fallback"].includes(c.status)) {
        c.status = "Submitted";
      }
    });

    res.json({
      complaints,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    console.error("Officer complaints fetch error:", error.message);
    res.status(500).json({ message: "Failed to fetch department complaints" });
  }
});

/**
 * GET /api/officer/stats
 * Department-level statistics.
 */
router.get("/stats", async (req, res) => {
  try {
    const dept = await Department.findById(req.user.department);
    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    const filter = {
      $or: [
        { department: dept._id },
        { department: null, "aiAnalysis.department": { $regex: new RegExp(`^${dept.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, "i") } },
      ],
    };

    const [total, submitted, inReview, inProgress, resolved, rejected, escalated] =
      await Promise.all([
        Complaint.countDocuments(filter),
        Complaint.countDocuments({
          ...filter,
          status: { $in: ["Submitted", "received", "analyzed", "analysis-fallback"] },
        }),
        Complaint.countDocuments({ ...filter, status: "In Review" }),
        Complaint.countDocuments({ ...filter, status: "In Progress" }),
        Complaint.countDocuments({ ...filter, status: "Resolved" }),
        Complaint.countDocuments({ ...filter, status: "Rejected" }),
        Complaint.countDocuments({ ...filter, status: "Escalated" }),
      ]);

    // Average resolution time (for resolved complaints)
    const resolvedComplaints = await Complaint.find({
      ...filter,
      status: "Resolved",
    }).select("createdAt updatedAt").lean();

    let avgResolutionMs = 0;
    if (resolvedComplaints.length > 0) {
      const totalMs = resolvedComplaints.reduce((sum, c) => {
        return sum + (new Date(c.updatedAt) - new Date(c.createdAt));
      }, 0);
      avgResolutionMs = totalMs / resolvedComplaints.length;
    }

    res.json({
      department: dept.name,
      total,
      submitted,
      inReview,
      inProgress,
      resolved,
      rejected,
      escalated,
      pending: submitted + inReview + inProgress,
      avgResolutionHours: Math.round(avgResolutionMs / (1000 * 60 * 60) * 10) / 10,
    });
  } catch (error) {
    console.error("Officer stats error:", error.message);
    res.status(500).json({ message: "Failed to fetch department statistics" });
  }
});

/**
 * GET /api/officer/complaints/:id
 * Single complaint detail (department-scoped).
 */
router.get("/complaints/:id", async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(404).json({ message: "Invalid Complaint ID format." });
    }

    const dept = await Department.findById(req.user.department);
    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    const complaint = await Complaint.findById(rawId)
      .populate("assignedOfficer", "displayName email")
      .populate("userId", "displayName email phone");

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Verify complaint belongs to this department
    const deptMatch =
      (complaint.department && complaint.department.toString() === dept._id.toString()) ||
      (!complaint.department &&
        complaint.aiAnalysis?.department &&
        complaint.aiAnalysis.department.toLowerCase().includes(dept.name.toLowerCase()));

    if (!deptMatch) {
      return res.status(403).json({
        message: "This complaint does not belong to your department.",
      });
    }

    if (complaint && ["received", "analyzed", "analysis-fallback"].includes(complaint.status)) {
      complaint.status = "Submitted";
    }

    const logs = await AuditLog.find({ complaintId: rawId })
      .populate("userId", "displayName role")
      .sort({ createdAt: 1 });

    res.json({ complaint, logs });
  } catch (error) {
    console.error("Officer complaint detail error:", error.message);
    res.status(500).json({ message: "Failed to fetch complaint details" });
  }
});

/**
 * PUT /api/officer/complaints/:id/status
 * Transition complaint status.
 * Body: { status: "In Review", note: "optional reason" }
 */
router.put("/complaints/:id/status", async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ message: "Invalid Complaint ID format." });
    }

    const { status: newStatus, note } = req.body;
    if (!newStatus || typeof newStatus !== "string") {
      return res.status(400).json({ message: "New status is required." });
    }

    const complaint = await Complaint.findById(rawId);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Verify department ownership
    const dept = await Department.findById(req.user.department);
    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    const deptMatch =
      (complaint.department && complaint.department.toString() === dept._id.toString()) ||
      (!complaint.department &&
        complaint.aiAnalysis?.department &&
        complaint.aiAnalysis.department.toLowerCase().includes(dept.name.toLowerCase()));
    if (!deptMatch) {
      return res.status(403).json({
        message: "This complaint does not belong to your department.",
      });
    }

    // Validate status transition
    const currentStatus = complaint.status;
    const allowed = OFFICER_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      return res.status(400).json({
        message: `Cannot transition from "${currentStatus}" to "${newStatus}".`,
        allowedTransitions: allowed || [],
      });
    }

    // Validate note for rejection/resolution
    if (
      (newStatus === "Rejected" || newStatus === "Resolved") &&
      (!note || typeof note !== "string" || note.trim().length < 5)
    ) {
      return res.status(400).json({
        message: `A note (min 5 characters) is required when ${newStatus === "Rejected" ? "rejecting" : "resolving"} a complaint.`,
      });
    }

    const previousStatus = complaint.status;
    complaint.status = newStatus;

    // Assign officer if first time picking up
    if (!complaint.assignedOfficer) {
      complaint.assignedOfficer = req.user._id;
    }

    // Store resolution note
    if (newStatus === "Resolved" || newStatus === "Rejected") {
      complaint.resolutionNote = note ? note.trim() : null;
    }

    await complaint.save();

    // Audit log
    await AuditLog.create({
      complaintId: complaint._id,
      userId: req.user._id,
      agent: `Officer: ${req.user.displayName}`,
      action: `Status changed: ${previousStatus} → ${newStatus}`,
      previousStatus,
      newStatus,
      details: note ? note.trim() : `Status updated by officer.`,
    });

    res.json({
      message: `Complaint status updated to "${newStatus}".`,
      complaint,
    });
  } catch (error) {
    console.error("Officer status update error:", error.message);
    res.status(500).json({ message: "Failed to update complaint status" });
  }
});

/**
 * POST /api/officer/complaints/:id/note
 * Add internal officer note.
 * Body: { text: "investigation note..." }
 */
router.post("/complaints/:id/note", async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ message: "Invalid Complaint ID format." });
    }

    const { text } = req.body;
    if (!text || typeof text !== "string" || text.trim().length < 2) {
      return res.status(400).json({ message: "Note text is required (min 2 characters)." });
    }
    if (text.length > 2000) {
      return res.status(400).json({ message: "Note must be under 2000 characters." });
    }

    const complaint = await Complaint.findById(rawId);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Verify department ownership
    const dept = await Department.findById(req.user.department);
    if (!dept) {
      return res.status(404).json({ message: "Department not found" });
    }

    const deptMatch =
      (complaint.department && complaint.department.toString() === dept._id.toString()) ||
      (!complaint.department &&
        complaint.aiAnalysis?.department &&
        complaint.aiAnalysis.department.toLowerCase().includes(dept.name.toLowerCase()));
    if (!deptMatch) {
      return res.status(403).json({
        message: "This complaint does not belong to your department.",
      });
    }

    complaint.officerNotes.push({
      userId: req.user._id,
      text: text.trim(),
    });
    await complaint.save();

    // Audit log
    await AuditLog.create({
      complaintId: complaint._id,
      userId: req.user._id,
      agent: `Officer: ${req.user.displayName}`,
      action: "Officer note added",
      details: text.trim().substring(0, 200),
    });

    res.json({
      message: "Note added successfully.",
      notes: complaint.officerNotes,
    });
  } catch (error) {
    console.error("Officer note error:", error.message);
    res.status(500).json({ message: "Failed to add note" });
  }
});

module.exports = router;
