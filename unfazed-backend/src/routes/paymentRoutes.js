
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const clientProtect =
  require("../middleware/authMiddleware").clientProtect;

const {
  createPackage,
  getPackages,
  updatePackage,
  createOrder,
  verifyPayment,
  getPayments,
  getClientPackages,
  razorpayWebhook,
  getPublicPackages,
  createClientOrder,
  verifyClientPayment,
  getMyClientPackages,
  downloadInvoice,
  downloadClientInvoice,
  createPaymentRequest,
  getClientPaymentRequests,
  createClientRequestOrder
} = require("../controllers/paymentController");

// Webhook
router.post("/webhook", razorpayWebhook);

// Public therapist packages
router.get("/public/packages/:slug", getPublicPackages);

// Client routes
router.post("/client/create-order", clientProtect, createClientOrder);
router.post("/client/verify", clientProtect, verifyClientPayment);

router.get("/client/my-packages", clientProtect, getMyClientPackages);

router.get(
  "/client/requests",
  clientProtect,
  getClientPaymentRequests
);

router.post(
  "/client/requests/create-order",
  clientProtect,
  createClientRequestOrder
);

// Client invoice download
router.get(
  "/client/invoice/:id",
  clientProtect,
  downloadClientInvoice
);

// Therapist authentication
router.use(protect);

// Therapist invoice download
router.get("/invoice/:id", downloadInvoice);

// Package management
router.post("/packages", createPackage);
router.get("/packages", getPackages);
router.put("/packages/:id", updatePackage);

// Payment requests
router.post("/requests", createPaymentRequest);

// Package payments
router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);

// Payment history
router.get("/history", getPayments);
router.get("/client-packages", getClientPackages);

module.exports = router;
