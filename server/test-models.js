require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CANDIDATES = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite-preview",
  "gemini-3-flash-preview",
];

(async () => {
  for (const model of CANDIDATES) {
    try {
      const r = await ai.models.generateContent({
        model,
        contents: "Reply with the single word: OK",
      });
      console.log("WORKS   ", model, "->", r.text.trim().slice(0, 20));
    } catch (e) {
      const m = e.message;
      const why = m.includes("429") ? "quota used up" : m.includes("404") ? "not available" : m.slice(0, 60);
      console.log("FAILED  ", model, "->", why);
    }
  }
})();