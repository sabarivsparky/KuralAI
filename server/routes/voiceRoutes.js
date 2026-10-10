const express = require("express");
const multer = require("multer");
const { transcribeAudio } = require("../services/sarvamService");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio received" });
    }

    console.log("Audio received:", req.file.mimetype, req.file.size, "bytes");

    const text = await transcribeAudio({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      language: req.body.language,
    });

    res.json({ text });
  } catch (error) {
    console.error("Voice transcription failed:", error.message);
    res.status(500).json({ message: "Transcription failed", error: error.message });
  }
});

module.exports = router;