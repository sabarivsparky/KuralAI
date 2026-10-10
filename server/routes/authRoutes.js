const express = require("express");
const validator = require("validator");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
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
    const { email, password } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email address is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const normalizedEmail = validator.normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id);
    setTokenCookie(res, token);

    res.json({ user: user.toJSON() });
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
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
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
