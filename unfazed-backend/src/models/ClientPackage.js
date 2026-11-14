
const mongoose = require("mongoose");

const clientPackageSchema = new mongoose.Schema({
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Therapist",
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client",
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Package",
    required: true
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    required: true,
    unique: true
  },
  totalSessions: {
    type: Number,
    required: true
  },
  usedSessions: {
    type: Number,
    default: 0,
    min: 0
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ["active", "completed", "expired"],
    default: "active"
  }
}, { timestamps: true });

module.exports = mongoose.model("ClientPackage", clientPackageSchema);
