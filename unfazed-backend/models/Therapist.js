
const mongoose = require("mongoose");

const therapistSchema = new mongoose.Schema(
  {
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
    password: {
      type: String,
      required: true,
      select: false,
    },
    specialization: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    tierKey: {
      type: String,
      default: "free",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Therapist", therapistSchema);
