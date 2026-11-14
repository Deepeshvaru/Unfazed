const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Therapist",
    required: true,
    index: true
  },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  sessionsCount: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 1 },
  validityDays: { type: Number, default: 90, min: 1 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Package", packageSchema);