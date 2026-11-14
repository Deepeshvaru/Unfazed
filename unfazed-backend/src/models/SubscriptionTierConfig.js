
const mongoose = require("mongoose");

const subscriptionTierConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ["free", "pro", "premium"]
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    features: {
      type: [String],
      default: []
    },

    limits: {
      maxClients: {
        type: Number,
        default: 10
      }
    },

    noteTemplates: {
      type: [String],
      default: ["basic"]
    },

    analyticsLevel: {
      type: String,
      enum: ["basic", "advanced"],
      default: "basic"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SubscriptionTierConfig",
  subscriptionTierConfigSchema
);
