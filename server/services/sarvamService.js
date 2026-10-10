const LANG = { en: "en-IN", ta: "ta-IN", hi: "hi-IN" };

const transcribeAudio = async ({ buffer, mimeType, language }) => {
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType || "audio/wav" }), "voice.wav");
  form.append("model", "saaras:v3");
  form.append("mode", "transcribe");
  form.append("language_code", LANG[language] || "unknown");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: { "api-subscription-key": process.env.SARVAM_API_KEY },
      body: form,
      signal: controller.signal,
    });

    const body = await res.text();
    console.log("Sarvam status:", res.status, body.slice(0, 300));

    if (!res.ok) throw new Error(`Sarvam ${res.status}: ${body.slice(0, 200)}`);
    return JSON.parse(body).transcript;
  } finally {
    clearTimeout(timer);
  }
};

module.exports = { transcribeAudio };