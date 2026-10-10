require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

(async () => {
  const pager = await ai.models.list();
  for await (const m of pager) {
    if ((m.supportedActions || []).includes("generateContent")) {
      console.log(m.name);
    }
  }
})().catch((e) => console.error("Failed:", e.message));