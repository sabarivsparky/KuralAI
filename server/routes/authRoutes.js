const express = require("express");
const mongoose = require("mongoose");
const validator = require("validator");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const Department = require("../models/Department");
const {
  signToken,
  setTokenCookie,
  clearTokenCookie,
  requireAuth,
} = require("../middleware/auth");

const router = express.Router();

// Rate limit login/signup to 30 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { message: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/auth/departments
 * Public endpoint to list active departments for portal selection.
 */
router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find({ isActive: { $ne: false } })
      .select("name code description contactEmail")
      .sort({ name: 1 });
    res.json({ departments });
  } catch (error) {
    console.error("Fetch departments error:", error.message);
    res.status(500).json({ message: "Could not load departments" });
  }
});

/**
 * POST /api/auth/signup
 */
router.post("/signup", authLimiter, async (req, res) => {
  try {
    const { displayName, email, password, preferredLanguage, phone, address } = req.body;

    // --- Validation ---
    if (!displayName || typeof displayName !== "string" || displayName.trim().length < 2) {
      return res.status(400).json({ message: "Display name must be at least 2 characters" });
    }
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email address is required" });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = validator.normalizeEmail(email);

    // --- Check duplicate ---
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    // --- Create user ---
    const user = await User.create({
      displayName: displayName.trim(),
      email: normalizedEmail,
      passwordHash: password, // pre-save hook hashes this
      preferredLanguage: ["en", "ta", "hi"].includes(preferredLanguage)
        ? preferredLanguage
        : "en",
      phone: typeof phone === "string" ? phone.trim() : "",
      address: typeof address === "string" ? address.trim() : "",
    });

    // --- Issue token ---
    const token = signToken(user._id);
    setTokenCookie(res, token);

    res.status(201).json({ user: user.toJSON() });
  } catch (error) {
    console.error("Signup error detail:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }
    res.status(500).json({ message: error.message || "Could not create account" });
  }
});

/**
 * POST /api/auth/login
 */
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password, departmentCode, requiredRole } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email address is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const normalizedEmail = validator.normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).populate("department");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account has been deactivated. Please contact an administrator." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Role verification
    if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
      return res.status(403).json({
        message: `Access denied. This portal is restricted to ${requiredRole} accounts.`,
      });
    }

    let demoDeptId = null;
    // Department verification
    if (departmentCode) {
      if (user.role === "citizen") {
        return res.status(403).json({
          message: "Access denied. Citizen accounts cannot sign in through department officer portals.",
        });
      }

      if (user.role === "official") {
        const targetDept = await Department.findOne({ code: departmentCode.toUpperCase() });
        if (!targetDept) {
          return res.status(400).json({ message: "Specified department does not exist." });
        }

        const isDemo =
          process.env.NODE_ENV !== "production" &&
          process.env.DEMO_OFFICER_MODE === "true" &&
          user.email === "officer@kural.ai";

        const userDeptId = user.department?._id?.toString() || user.department?.toString();
        if (!userDeptId || userDeptId !== targetDept._id.toString()) {
          if (isDemo) {
            demoDeptId = targetDept._id.toString();
            user.department = targetDept._id;
          } else {
            const assignedDeptName = user.department?.name || "another department";
            return res.status(403).json({
              message: `Department Mismatch: Your account is assigned to ${assignedDeptName}, not ${targetDept.name}. Please select your assigned department to sign in.`,
            });
          }
        }
      }
    }

    const token = signToken(user._id, demoDeptId ? { demoDeptId } : {});
    setTokenCookie(res, token);

    let responseUser = user;
    if (demoDeptId) {
      await user.populate("department");
      responseUser = user;
    }
    const jsonUser = responseUser.toJSON();
    if (demoDeptId) {
      jsonUser.isDemoDepartment = true;
    }

    res.json({ user: jsonUser });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Login failed" });
  }
});

/**
 * POST /api/auth/logout
 */
router.post("/logout", (req, res) => {
  clearTokenCookie(res);
  res.json({ message: "Logged out" });
});

/**
 * GET /api/auth/me
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash -__v");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.user.isDemoDepartment && req.user.department) {
      user.department = req.user.department;
    }
    await user.populate("department");
    const jsonUser = user.toJSON();
    if (req.user.isDemoDepartment) {
      jsonUser.isDemoDepartment = true;
    }
    res.json({ user: jsonUser });
  } catch {
    res.json({ user: req.user });
  }
});

/**
 * POST /api/auth/demo/select-department
 * Development-only endpoint allowing the shared demo officer account
 * to switch the active department for portal testing.
 */
router.post("/demo/select-department", requireAuth, async (req, res) => {
  if (process.env.NODE_ENV === "production" || process.env.DEMO_OFFICER_MODE !== "true") {
    return res.status(403).json({ message: "Development demo mode is disabled." });
  }

  if (req.user.email !== "officer@kural.ai" || req.user.role !== "official") {
    return res.status(403).json({
      message: "Demo department switching is restricted to the development demo officer account.",
    });
  }

  const { departmentCode, departmentId } = req.body;
  let targetDept = null;
  if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
    targetDept = await Department.findById(departmentId);
  } else if (departmentCode && typeof departmentCode === "string") {
    targetDept = await Department.findOne({ code: departmentCode.toUpperCase() });
  }

  if (!targetDept || targetDept.isActive === false) {
    return res.status(404).json({ message: "Target department not found or inactive." });
  }

  const token = signToken(req.user._id, { demoDeptId: targetDept._id.toString() });
  setTokenCookie(res, token);

  res.json({
    message: `Switched demo department to ${targetDept.name}`,
    department: targetDept,
  });
});

/**
 * PUT /api/auth/profile
 */
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { displayName, preferredLanguage, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (displayName !== undefined) {
      if (typeof displayName !== "string" || displayName.trim().length < 2) {
        return res.status(400).json({ message: "Display name must be at least 2 characters" });
      }
      user.displayName = displayName.trim();
    }

    if (preferredLanguage !== undefined) {
      if (!["en", "ta", "hi"].includes(preferredLanguage)) {
        return res.status(400).json({ message: "Invalid language preference" });
      }
      user.preferredLanguage = preferredLanguage;
    }

    if (phone !== undefined) {
      user.phone = typeof phone === "string" ? phone.trim() : "";
    }

    if (address !== undefined) {
      user.address = typeof address === "string" ? address.trim() : "";
    }

    await user.save();
    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error("Profile update error:", error.message);
    res.status(500).json({ message: "Could not update profile" });
  }
});

module.exports = router;
