const express = require("express");
const multer = require("multer");
const { transcribeAudio } = require("../services/sarvamService");

const router = express.Router();

const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10 MB limit for voice notes
const VALID_LANGUAGES = ["en", "ta", "hi"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_SIZE },
  fileFilter: (req, file, cb) => {
    // Accept audio mimetypes or generic audio recording octet streams
    if (file.mimetype.startsWith("audio/") || file.mimetype === "application/octet-stream" || file.mimetype === "video/webm") {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed for voice transcription."));
    }
  },
});

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio received" });
    }

    const safeLanguage = VALID_LANGUAGES.includes(req.body.language)
      ? req.body.language
      : "en";

    const text = await transcribeAudio({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      language: safeLanguage,
    });

    res.json({ text });
  } catch (error) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Audio file too large. Maximum size is 10 MB." });
    }
    if (error.message && error.message.includes("Only audio files")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Voice transcription failed:", error.message);
    const isDev = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Transcription failed. Please try again or type your complaint.",
      ...(isDev && { error: error.message }),
    });
  }
});

module.exports = router;