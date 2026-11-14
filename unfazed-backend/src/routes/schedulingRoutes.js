
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const clientProtect = require("../middleware/authMiddleware").clientProtect;

const {
  setAvailability,
  setOverride,
  blockAvailability,
  getAvailability,
  getPublicAvailability,
  bookPublicSession,
  bookClientSession,
  bookSession,
  getSessions,
  updateSession,
  deleteAvailability
} = require("../controllers/schedulingController");

// Public booking and availability
router.get("/public/:slug/availability", getPublicAvailability);
router.post("/public/:slug/book", bookPublicSession);

// Logged-in client booking
router.post("/client/:slug/book", clientProtect, bookClientSession);

// Therapist-only routes
router.use(protect);

router.post("/availability", setAvailability);
router.post("/availability/override", setOverride);
router.post("/availability/block", blockAvailability);
router.get("/availability", getAvailability);
router.delete("/availability/:id", deleteAvailability);

router.post("/book", bookSession);
router.get("/sessions", getSessions);
router.put("/sessions/:id", updateSession);
module.exports = router;
