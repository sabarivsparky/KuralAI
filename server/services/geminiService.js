const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Tried in order. Put models in .env as: GEMINI_MODELS=gemini-2.5-flash-lite,gemini-2.5-flash
const MODELS = (process.env.GEMINI_MODELS || "gemini-2.5-flash-lite,gemini-2.5-flash")
  .split(",")
  .map((m) => m.trim());

const askGeminiJSON = async ({ prompt, imagePath, mimeType }) => {
  const parts = [{ text: prompt }];

  if (imagePath) {
    parts.push({
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: fs.readFileSync(imagePath).toString("base64"),
      },
    });
  }

  let lastError;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: { responseMimeType: "application/json", temperature: 0.2 },
      });
      return JSON.parse(response.text);
    } catch (err) {
      console.error(`Model ${model} failed:`, err.message.slice(0, 120));
      lastError = err;
    }
  }
  throw lastError;
};

/**
 * Convenience helper to analyze complaint text via the Listener Agent.
 */
const analyzeComplaint = async (text, options = {}) => {
  const { runListenerAgent } = require("../agents/listener");
  return runListenerAgent({ text, ...options });
};

module.exports = { askGeminiJSON, analyzeComplaint };