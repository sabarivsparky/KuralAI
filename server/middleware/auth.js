const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  console.error("FATAL: JWT_SECRET is not set in production");
  process.exit(1);
}

// In development, use a random secret per server restart (not a known string).
// This is safer than a hardcoded fallback that could be used to forge tokens.
const EFFECTIVE_SECRET = JWT_SECRET || crypto.randomBytes(32).toString("hex");
if (!JWT_SECRET) {
  console.warn("WARNING: JWT_SECRET not set — using random ephemeral secret. Sessions will not survive server restarts.");
}

const TOKEN_NAME = "kurai_token";
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Create a signed JWT for a given user ID with optional claims.
 */
const signToken = (userId, extraClaims = {}) => {
  return jwt.sign({ id: userId, ...extraClaims }, EFFECTIVE_SECRET, {
    expiresIn: TOKEN_MAX_AGE,
  });
};

/**
 * Configure the HTTP-only auth cookie on a response.
 */
const setTokenCookie = (res, token) => {
  res.cookie(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: TOKEN_MAX_AGE * 1000, // ms
    path: "/",
  });
};

/**
 * Clear the auth cookie.
 */
const clearTokenCookie = (res) => {
  res.clearCookie(TOKEN_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
};

/**
 * Helper to safely resolve demo department for demo officer account.
 */
const applyDemoDepartment = async (user, demoDeptId) => {
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.DEMO_OFFICER_MODE === "true" &&
    user &&
    user.email === "officer@kural.ai" &&
    user.role === "official" &&
    demoDeptId
  ) {
    const Department = require("../models/Department");
    const demoDept = await Department.findById(demoDeptId);
    if (demoDept && demoDept.isActive !== false) {
      user.department = demoDept._id;
      user.isDemoDepartment = true;
    }
  }
};

/**
 * Middleware: require authentication.
 * Attaches req.user (full Mongoose document) on success.
 * Returns 401 on failure.
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.[TOKEN_NAME];
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, EFFECTIVE_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash -__v");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    await applyDemoDepartment(user, decoded.demoDeptId);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired, please log in again" });
    }
    return res.status(401).json({ message: "Invalid authentication" });
  }
};

/**
 * Middleware: optional authentication.
 * Attaches req.user if a valid token is present, otherwise continues without it.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.[TOKEN_NAME];
    if (!token) return next();

    const decoded = jwt.verify(token, EFFECTIVE_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash -__v");
    if (user) {
      await applyDemoDepartment(user, decoded.demoDeptId);
      req.user = user;
    }
    next();
  } catch {
    // Invalid token — continue as unauthenticated
    next();
  }
};

module.exports = {
  signToken,
  setTokenCookie,
  clearTokenCookie,
  requireAuth,
  optionalAuth,
  TOKEN_NAME,
};
