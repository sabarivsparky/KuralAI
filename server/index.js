const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const complaintRoutes = require("./routes/complaintRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const authRoutes = require("./routes/authRoutes");
const officerRoutes = require("./routes/officerRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// --- Security headers (inline, no helmet dependency) ---
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0"); // Modern browsers; CSP is preferred
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(self), geolocation=(self)");
  next();
});

// --- CORS: robust dev & production origin validation ---
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://localhost:5174",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow same-origin requests (origin is null/undefined for non-browser clients)
      if (!origin) {
        return callback(null, true);
      }
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      // In development, allow localhost on any port
      if (
        process.env.NODE_ENV !== "production" &&
        (origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:"))
      ) {
        return callback(null, true);
      }
      callback(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

connectDB();

// --- Health Check Endpoint (PART B Requirement 10) ---
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.json({
    status: dbState === 1 ? "ok" : "degraded",
    app: "KuralAI Backend",
    dbStatus: states[dbState] || "unknown",
    timestamp: new Date().toISOString(),
  });
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/officer", officerRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/test", (req, res) => {
  res.json({
    message: "Complaint routes are loaded",
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "KuralAI backend is running",
    health: "/api/health",
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err.message);
  const status = err.status || 500;
  // Don't leak internal error details in production
  const message =
    status < 500 || process.env.NODE_ENV !== "production"
      ? err.message || "An unexpected server error occurred."
      : "An unexpected server error occurred.";
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`KuralAI server running on port ${PORT}`);
});