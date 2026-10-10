const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    text: { type: String, default: "" },
    language: { type: String, default: "en" },
    photoUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ["Submitted", "In Review", "In Progress", "Resolved", "Escalated", "Rejected", "analyzed", "received"],
      default: "Submitted",
      index: true,
    },
    source: { type: String, default: "citizen" },

    // [longitude, latitude], used for nearby search
    geo: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [80.18, 12.72] },
    },

    aiAnalysis: {
      issueType: { type: String, default: null },
      severity: { type: Number, default: 3 },
      location: { type: String, default: "unknown" },
      englishTranslation: { type: String, default: null },
      photoObservation: { type: String, default: null },
      citizenReply: { type: String, default: null },
      department: { type: String, default: "General Administration" },
      category: { type: String, default: "Civic Issue" },
      urgency: { type: String, default: "Medium" },
      priorityScore: { type: Number, default: 50 },
      actionableSummary: { type: String, default: null },
      issue: { type: String, default: null },
    },
    analyzedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Virtual getter for photo for backwards compatibility
complaintSchema.virtual("photo").get(function () {
  return this.photoUrl;
});

// Ensure virtuals are included in JSON output
complaintSchema.set("toJSON", { virtuals: true });
complaintSchema.set("toObject", { virtuals: true });

complaintSchema.index({ geo: "2dsphere" });

module.exports = mongoose.model("Complaint", complaintSchema);