
const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["weekly", "override", "blocked"],
      default: "weekly",
      required: true
    },

    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      required: function () {
        return this.type === "weekly";
      }
    },

    date: {
      type: Date,
      required: function () {
        return this.type !== "weekly";
      }
    },

    startTime: {
      type: String,
      required: function () {
        return this.type !== "blocked";
      }
    },

    endTime: {
      type: String,
      required: function () {
        return this.type !== "blocked";
      }
    },

    slotDuration: {
      type: Number,
      enum: [30, 45, 60, 90],
      default: 60
    },

    bufferMinutes: {
      type: Number,
      min: 0,
      max: 60,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

availabilitySchema.index({ therapist: 1, dayOfWeek: 1 });
availabilitySchema.index({ therapist: 1, date: 1 });

module.exports = mongoose.model("Availability", availabilitySchema);
