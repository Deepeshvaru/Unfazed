
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const clientProtect =
  require("../middleware/authMiddleware").clientProtect;

const requireFeature = require("../middleware/entitlementMiddleware");

const {
  addClient,
  getClients,
  getClient,
  updateClient,
  submitIntake,
  deleteClient,
  getClientPortal
} = require("../controllers/clientController");

const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require("../controllers/notificationController");

// Client notification routes
router.get("/notifications", clientProtect, getNotifications);
router.patch(
  "/notifications/read-all",
  clientProtect,
  markAllNotificationsRead
);
router.patch(
  "/notifications/:id/read",
  clientProtect,
  markNotificationRead
);

// Public client portal (authenticated client)
router.get("/portal", clientProtect, getClientPortal);

// Therapist-protected routes
router.use(protect);

router.post("/", requireFeature("clientManagement"), addClient);
router.get("/", getClients);
router.get("/:id", getClient);
router.put("/:id", updateClient);
router.put("/:id/intake", submitIntake);
router.delete("/:id", deleteClient);

module.exports = router;
