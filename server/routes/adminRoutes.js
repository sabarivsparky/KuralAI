const express = require("express");
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const Department = require("../models/Department");
const { requireAuth } = require("../middleware/auth");
const { checkRole, checkActive } = require("../middleware/authorize");

const router = express.Router();

// All admin routes require: auth + active account + admin role
router.use(requireAuth, checkActive, checkRole("admin"));

// --- Valid statuses ---
const ALL_STATUSES = ["Submitted", "In Review", "In Progress", "Resolved", "Escalated", "Rejected"];

/**
 * GET /api/admin/stats
 * System-wide statistics.
 */
router.get("/stats", async (req, res) => {
  try {
    const [
      totalComplaints,
      submitted,
      inReview,
      inProgress,
      resolved,
      rejected,
      escalated,
      totalUsers,
      totalOfficers,
      totalAdmins,
      totalDepartments,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: "Submitted" }),
      Complaint.countDocuments({ status: "In Review" }),
      Complaint.countDocuments({ status: "In Progress" }),
      Complaint.countDocuments({ status: "Resolved" }),
      Complaint.countDocuments({ status: "Rejected" }),
      Complaint.countDocuments({ status: "Escalated" }),
      User.countDocuments({ role: "citizen" }),
      User.countDocuments({ role: "official" }),
      User.countDocuments({ role: "admin" }),
      Department.countDocuments(),
    ]);

    // Complaints by department (top 10)
    const departmentBreakdown = await Complaint.aggregate([
      { $group: { _id: "$aiAnalysis.department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Recent activity (last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentComplaints = await Complaint.countDocuments({
      createdAt: { $gte: oneWeekAgo },
    });
    const recentResolved = await Complaint.countDocuments({
      status: "Resolved",
      updatedAt: { $gte: oneWeekAgo },
    });

    // Average resolution time
    const resolvedComplaints = await Complaint.find({ status: "Resolved" })
      .select("createdAt updatedAt")
      .lean();
    let avgResolutionHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalMs = resolvedComplaints.reduce((sum, c) => {
        return sum + (new Date(c.updatedAt) - new Date(c.createdAt));
      }, 0);
      avgResolutionHours =
        Math.round((totalMs / resolvedComplaints.length / (1000 * 60 * 60)) * 10) / 10;
    }

    res.json({
      complaints: {
        total: totalComplaints,
        submitted,
        inReview,
        inProgress,
        resolved,
        rejected,
        escalated,
        pending: submitted + inReview + inProgress,
      },
      users: {
        citizens: totalUsers,
        officers: totalOfficers,
        admins: totalAdmins,
        total: totalUsers + totalOfficers + totalAdmins,
      },
      departments: totalDepartments,
      departmentBreakdown: departmentBreakdown.map((d) => ({
        department: d._id || "Unassigned",
        count: d.count,
      })),
      recentActivity: {
        complaintsLastWeek: recentComplaints,
        resolvedLastWeek: recentResolved,
      },
      avgResolutionHours,
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    res.status(500).json({ message: "Failed to fetch system statistics" });
  }
});

/**
 * GET /api/admin/complaints
 * All complaints with filtering and pagination.
 * Query: ?status=Submitted&department=Water&page=1&limit=20&sort=createdAt&order=desc&search=keyword
 */
router.get("/complaints", async (req, res) => {
  try {
    const {
      status,
      department,
      page = 1,
      limit = 20,
      sort = "createdAt",
      order = "desc",
      search,
    } = req.query;

    const filter = {};

    if (status && ALL_STATUSES.includes(status)) {
      filter.status = status;
    }

    if (department) {
      filter["aiAnalysis.department"] = { $regex: new RegExp(department, "i") };
    }

    if (search && typeof search === "string" && search.trim()) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { text: { $regex: new RegExp(escaped, "i") } },
        { "aiAnalysis.issueType": { $regex: new RegExp(escaped, "i") } },
        { "aiAnalysis.actionableSummary": { $regex: new RegExp(escaped, "i") } },
      ];
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const allowedSortFields = ["createdAt", "updatedAt", "status", "aiAnalysis.priorityScore"];
    const safeSort = allowedSortFields.includes(sort) ? sort : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate("userId", "displayName email")
        .populate("assignedOfficer", "displayName email")
        .sort({ [safeSort]: sortOrder })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Complaint.countDocuments(filter),
    ]);

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
    console.error("Admin complaints error:", error.message);
    res.status(500).json({ message: "Failed to fetch complaints" });
  }
});

/**
 * PUT /api/admin/complaints/:id/status
 * Admin force status transition (no restrictions).
 * Body: { status: "In Review", note: "admin override reason" }
 */
router.put("/complaints/:id/status", async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ message: "Invalid Complaint ID format." });
    }

    const { status: newStatus, note } = req.body;
    if (!newStatus || !ALL_STATUSES.includes(newStatus)) {
      return res.status(400).json({
        message: "Invalid status. Allowed: " + ALL_STATUSES.join(", "),
      });
    }

    const complaint = await Complaint.findById(rawId);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const previousStatus = complaint.status;
    complaint.status = newStatus;

    if (newStatus === "Resolved" || newStatus === "Rejected") {
      complaint.resolutionNote = note ? note.trim() : null;
    }

    await complaint.save();

    await AuditLog.create({
      complaintId: complaint._id,
      userId: req.user._id,
      agent: `Admin: ${req.user.displayName}`,
      action: `Admin status override: ${previousStatus} → ${newStatus}`,
      previousStatus,
      newStatus,
      details: note || "Admin status override.",
    });

    res.json({ message: `Status updated to "${newStatus}".`, complaint });
  } catch (error) {
    console.error("Admin status update error:", error.message);
    res.status(500).json({ message: "Failed to update complaint status" });
  }
});

/**
 * GET /api/admin/users
 * User management list with filtering.
 * Query: ?role=citizen&page=1&limit=20&search=name
 */
router.get("/users", async (req, res) => {
  try {
    const {
      role,
      page = 1,
      limit = 20,
      search,
    } = req.query;

    const filter = {};
    if (role && ["citizen", "official", "admin"].includes(role)) {
      filter.role = role;
    }
    if (search && typeof search === "string" && search.trim()) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { displayName: { $regex: new RegExp(escaped, "i") } },
        { email: { $regex: new RegExp(escaped, "i") } },
      ];
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash -__v")
        .populate("department", "name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/**
 * PUT /api/admin/users/:id/role
 * Assign or change a user's role and department.
 * Body: { role: "official", departmentId: "..." }
 */
router.put("/users/:id/role", async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ message: "Invalid User ID format." });
    }

    // Prevent admin from modifying their own role
    if (rawId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot modify your own role." });
    }

    const { role, departmentId } = req.body;
    if (!role || !["citizen", "official", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Valid role required: citizen, official, admin.",
      });
    }

    const targetUser = await User.findById(rawId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousRole = targetUser.role;
    targetUser.role = role;

    // Assign or clear department
    if (role === "official") {
      if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json({
          message: "A valid department ID is required when assigning the officer role.",
        });
      }
      const dept = await Department.findById(departmentId);
      if (!dept) {
        return res.status(404).json({ message: "Department not found." });
      }
      targetUser.department = dept._id;
    } else {
      targetUser.department = null;
    }

    await targetUser.save();

    res.json({
      message: `User role updated: ${previousRole} → ${role}`,
      user: targetUser.toJSON(),
    });
  } catch (error) {
    console.error("Admin role update error:", error.message);
    res.status(500).json({ message: "Failed to update user role" });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Activate or deactivate a user account.
 * Body: { isActive: false }
 */
router.put("/users/:id/status", async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ message: "Invalid User ID format." });
    }

    if (rawId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot deactivate your own account." });
    }

    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be a boolean." });
    }

    const targetUser = await User.findById(rawId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    res.json({
      message: `User account ${isActive ? "activated" : "deactivated"}.`,
      user: targetUser.toJSON(),
    });
  } catch (error) {
    console.error("Admin user status error:", error.message);
    res.status(500).json({ message: "Failed to update user status" });
  }
});

// ==================== Department Management ====================

/**
 * GET /api/admin/departments
 * List all departments.
 */
router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 }).lean();

    // Count officers per department
    const deptWithCounts = await Promise.all(
      departments.map(async (dept) => {
        const officerCount = await User.countDocuments({
          department: dept._id,
          role: "official",
        });
        return { ...dept, officerCount };
      })
    );

    res.json({ departments: deptWithCounts });
  } catch (error) {
    console.error("Admin departments error:", error.message);
    res.status(500).json({ message: "Failed to fetch departments" });
  }
});

/**
 * POST /api/admin/departments
 * Create a new department.
 * Body: { name: "Water Supply", code: "WATER", description: "...", contactEmail: "..." }
 */
router.post("/departments", async (req, res) => {
  try {
    const { name, code, description, contactEmail } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ message: "Department name is required (min 2 chars)." });
    }
    if (!code || typeof code !== "string" || code.trim().length < 2) {
      return res.status(400).json({ message: "Department code is required (min 2 chars)." });
    }

    const existing = await Department.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name.trim()}$`, "i") } },
        { code: code.trim().toUpperCase() },
      ],
    });
    if (existing) {
      return res.status(400).json({ message: "A department with this name or code already exists." });
    }

    const dept = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description ? description.trim() : "",
      contactEmail: contactEmail ? contactEmail.trim() : "",
    });

    res.status(201).json({ department: dept });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Duplicate department name or code." });
    }
    console.error("Admin department create error:", error.message);
    res.status(500).json({ message: "Failed to create department" });
  }
});

/**
 * PUT /api/admin/departments/:id
 * Update department details.
 */
router.put("/departments/:id", async (req, res) => {
  try {
    const rawId = (req.params.id || "").trim();
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ message: "Invalid Department ID." });
    }

    const dept = await Department.findById(rawId);
    if (!dept) {
      return res.status(404).json({ message: "Department not found." });
    }

    const { name, description, contactEmail, isActive } = req.body;
    if (name !== undefined) dept.name = name.trim();
    if (description !== undefined) dept.description = description.trim();
    if (contactEmail !== undefined) dept.contactEmail = contactEmail.trim();
    if (typeof isActive === "boolean") dept.isActive = isActive;

    await dept.save();
    res.json({ department: dept });
  } catch (error) {
    console.error("Admin department update error:", error.message);
    res.status(500).json({ message: "Failed to update department" });
  }
});

/**
 * GET /api/admin/audit-logs
 * System-wide audit trail with filtering.
 * Query: ?complaintId=...&page=1&limit=50
 */
router.get("/audit-logs", async (req, res) => {
  try {
    const { complaintId, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (complaintId && mongoose.Types.ObjectId.isValid(complaintId)) {
      filter.complaintId = complaintId;
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("userId", "displayName role")
        .populate("complaintId", "text status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    console.error("Admin audit logs error:", error.message);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

module.exports = router;
