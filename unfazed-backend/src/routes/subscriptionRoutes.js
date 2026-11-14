
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getPlans,
  getMySubscription,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  changeSubscription
} = require("../controllers/subscriptionController");

router.get("/plans", getPlans);

router.get("/me", protect, getMySubscription);

router.post("/create-order", protect, createSubscriptionOrder);

router.post("/verify-payment", protect, verifySubscriptionPayment);

router.put("/change", protect, changeSubscription);

module.exports = router;
