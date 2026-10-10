const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
    },

    agent: {
      type: String,
      required: true,
    },

    action: {
      type: String,
      required: true,
    },

    details: {
  type: mongoose.Schema.Types.Mixed,
  default: {},
},
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);