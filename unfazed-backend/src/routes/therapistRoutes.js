
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getPublicProfile,
  getMyProfile,
  updateMyProfile,
  getTherapists
} = require("../controllers/therapistController");

const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require("../controllers/notificationController");

// Therapist notification routes
router.get("/notifications", protect, getNotifications);
router.patch("/notifications/read-all", protect, markAllNotificationsRead);
router.patch("/notifications/:id/read", protect, markNotificationRead);

// Therapist profile routes
router.get("/me", protect, getMyProfile);
router.put("/profile", protect, updateMyProfile);
router.get("/directory", getTherapists);

// Keep this route last
router.get("/:slug", getPublicProfile);

module.exports = router;
