const { askGeminiJSON } = require("../services/geminiService");

const LANG = { en: "English", ta: "Tamil", hi: "Hindi" };

const runListenerAgent = async ({ text, language, imagePath, mimeType }) => {
  const prompt = `
You are the Listener Agent of KuralAI, a civic complaint assistant for Indian cities.
The citizen submitted the following grievance in ${LANG[language] || "English"}:
"""${text}"""
${imagePath ? "A photo is attached as evidence." : ""}

Return ONLY a single valid JSON object with these keys:
{
  "issueType": one of ["drain_overflow", "pothole", "garbage", "streetlight", "water_leak", "road_damage", "other"],
  "severity": integer 1-5 (5 = life/health emergency or hazardous),
  "location": "place mentioned in text or unknown",
  "englishTranslation": "one clear, concise English translation sentence for the municipal officer",
  "photoObservation": "what the photo shows in one sentence, or 'no photo'",
  "citizenReply": "a short polite response in ${LANG[language] || "English"} confirming receipt and department routing without committing to a specific date",
  "department": "assigned department (e.g., 'Public Works Department (PWD)', 'Water Supply & Sewerage Board (CMWSSB)', 'Tamil Nadu Electricity Board (TNEB)', 'Sanitation & Waste Management', 'Traffic & Roads', 'General Administration')",
  "category": "category (e.g., 'Road Infrastructure', 'Water & Sanitation', 'Power & Streetlights', 'Public Health', 'Traffic')",
  "urgency": "one of ['Low', 'Medium', 'High', 'Critical']",
  "priorityScore": integer 1-100 calculated from severity, health risk, and disruption,
  "actionableSummary": "1 sentence specifying the problem, location, and requested resolution action",
  "issue": "A short, professional title (4-7 words) summarizing the civic problem"
}
Do not invent unstated facts. Return ONLY JSON.`;

  try {
    const analysis = await askGeminiJSON({ prompt, imagePath, mimeType });
    return { success: true, language, analysis };
  } catch (error) {
    console.error("Listener Agent failed:", error.message);
    return {
      success: false,
      language,
      analysis: {
        issueType: "other",
        severity: 3,
        location: "unknown",
        englishTranslation: text,
        photoObservation: imagePath ? "photo received" : "no photo",
        citizenReply: "Your complaint has been received and will be reviewed by an officer.",
        department: "General Administration",
        category: "Civic Issue",
        urgency: "Medium",
        priorityScore: 50,
        actionableSummary: `Review reported issue: ${text?.substring(0, 60) || "Civic Complaint"}`,
        issue: text ? text.substring(0, 40) + "..." : "Civic Complaint",
      },
      error: error.message,
    };
  }
};

module.exports = { runListenerAgent };