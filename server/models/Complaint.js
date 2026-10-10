const mongoose = require("mongoose");

const LEGACY_STATUS_MAP = {
  analyzed: "Submitted",
  received: "Submitted",
};

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
      enum: [
        "Submitted",
        "In Review",
        "In Progress",
        "Resolved",
        "Escalated",
        "Rejected",
        // Kept for backward compatibility with existing DB records
        "analyzed",
        "received",
      ],
      default: "Submitted",
      set: (val) => {
        if (!val) return "Submitted";
        if (typeof val === "string") {
          const lower = val.toLowerCase();
          if (LEGACY_STATUS_MAP[lower]) return LEGACY_STATUS_MAP[lower];
        }
        return val;
      },
      index: true,
    },
    source: { type: String, default: "citizen" },

    // Department assignment (resolved ObjectId for reliable queue filtering)
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },

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

    // Officer assignment
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Internal officer notes (not visible to citizen)
    officerNotes: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true, maxlength: 2000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Resolution/rejection note (visible to citizen)
    resolutionNote: {
      type: String,
      default: null,
      maxlength: 2000,
    },
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