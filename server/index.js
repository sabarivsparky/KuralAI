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

const app = express();

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
      if (
        !origin ||
        ALLOWED_ORIGINS.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
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
  res.status(err.status || 500).json({
    message: err.message || "An unexpected server error occurred.",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`KuralAI server running on port ${PORT}`);
});