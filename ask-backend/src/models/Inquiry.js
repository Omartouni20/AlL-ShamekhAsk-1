const mongoose = require("mongoose");

const InquirySchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, trim: true },

    // Either text or voiceUrl must exist
    text: { type: String, default: "" },
    voiceUrl: { type: String, default: "" },

    status: {
      type: String,
      enum: ["NEW", "ASSIGNED", "IN_PROGRESS", "RELEASED", "REOPENED"],
      default: "NEW"
    },

    assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // release info
    releasedAt: { type: Date, default: null },
    releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    releaseNote: { type: String, default: "" },
    proofImageUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

InquirySchema.index({ status: 1, assignedEmployee: 1, createdAt: -1 });

module.exports = mongoose.model("Inquiry", InquirySchema);
