
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "recipientModel",
      index: true
    },

    recipientModel: {
      type: String,
      required: true,
      enum: ["Therapist", "ClientAccount"]
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    event: {
      type: String,
      default: "general"
    },

    link: {
      type: String,
      default: ""
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true
    },

    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

notificationSchema.index({
  recipient: 1,
  recipientModel: 1,
  createdAt: -1
});

module.exports = mongoose.model("Notification", notificationSchema);
