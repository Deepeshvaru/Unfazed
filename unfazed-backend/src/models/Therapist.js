const mongoose = require("mongoose");

const therapistSchema = new mongoose.Schema(
  {
    subscriptionTier: {
  type: String,
  enum: ["free", "pro", "premium"],
  default: "free"
},
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password_hash: {
      type: String,
      required: true,
      select: false,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
    },

    bio: {
      type: String,
      default: "",
    },

    specializations: {
      type: [String],
      default: [],
    },

    languages: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Therapist", therapistSchema);