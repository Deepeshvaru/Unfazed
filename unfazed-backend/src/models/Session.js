
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true
    },

    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null
    },

    availability: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Availability",
      default: null
    },

    clientName: {
      type: String,
      required: true,
      trim: true
    },

    clientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    date: {
      type: Date,
      required: true
    },

    startTime: {
      type: String,
      required: true
    },

    endTime: {
      type: String,
      required: true
    },

    bufferMinutes: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "no-show"],
      default: "pending"
    },

    // Tracks which client package was charged for this appointment.
    deductedClientPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClientPackage",
      default: null
    },

    // Tracks when the package session was deducted.
    packageDeductedAt: {
      type: Date,
      default: null
    },

    reminderSentAt: {
      type: Date,
      default: null
    },

    sessionType: {
      type: String,
      enum: ["online", "in-person"],
      default: "online"
    },

    notes: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

sessionSchema.index({
  therapist: 1,
  date: 1,
  startTime: 1
});

module.exports = mongoose.model("Session", sessionSchema);
