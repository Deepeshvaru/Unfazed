
const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Therapist",
    required: true,
    index: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClientAccount",
    default: null,
    index: true
  },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, default: "" },
  age: { type: Number, min: 1, max: 120 },
  gender: { type: String, default: "" },
  occupation: { type: String, default: "" },
  presentingConcern: { type: String, default: "" },
  relevantHistory: { type: String, default: "" },
  therapyGoals: { type: String, default: "" },
  consentGiven: { type: Boolean, default: false },
  consentAt: { type: Date, default: null },
  intakeSubmittedAt: { type: Date, default: null },
  notes: { type: String, default: "" },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  }
}, { timestamps: true });

clientSchema.index({ therapist: 1, email: 1 });
clientSchema.index({ therapist: 1, status: 1 });

const Client = mongoose.models.Client ||
  mongoose.model("Client", clientSchema);

// Global client login account

const clientAccountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true,
    select: false
  },
  phone: {
    type: String,
    default: ""
  },
  gender: {
    type: String,
    enum: ["", "Male", "Female", "Other", "Prefer not to say"],
    default: ""
  }
}, { timestamps: true });

const ClientAccount = mongoose.models.ClientAccount ||
  mongoose.model("ClientAccount", clientAccountSchema);

// Existing Client imports continue working
module.exports = Client;
module.exports.ClientAccount = ClientAccount;
