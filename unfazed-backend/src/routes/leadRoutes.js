
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const requireFeature = require("../middleware/entitlementMiddleware");
const {
  createLead,
  getLeads,
  updateLead
} = require("../controllers/leadController");

// Public lead submission
router.post("/", createLead);

// Therapist-only lead management (Pro/Premium)
router.get(
  "/",
  protect,
  requireFeature("leadManagement"),
  getLeads
);

router.put(
  "/:id",
  protect,
  requireFeature("leadManagement"),
  updateLead
);

module.exports = router;
