
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Therapist",
    required: true,
    index: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Client"
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Package"
  },
 paymentType: {
  type: String,
  enum: ["package", "request", "subscription"],
  default: "package"
},
  description: {
    type: String,
    default: ""
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: "INR"
  },
  razorpayOrderId: {
    type: String,
    unique: true,
    sparse: true
  },
  razorpayPaymentId: {
    type: String
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed", "refunded"],
    default: "pending"
  },
  receipt: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);
