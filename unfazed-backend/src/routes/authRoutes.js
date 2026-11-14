
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  registerClient,
  loginClient,
  getClientMe,
  updateClientProfile,
updateClientPassword
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const { clientProtect } = require("../middleware/authMiddleware");

const { body } = require("express-validator");

// Therapist registration
router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required"),

    body("email")
      .isEmail()
      .withMessage("Enter a valid email"),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
  ],
  register
);

// Therapist login
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Enter a valid email"),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
  ],
  login
);

// Get logged-in therapist

router.get("/me", protect, getMe);

router.post("/client/register", registerClient);
router.post("/client/login", loginClient);
router.get("/client/me", clientProtect, getClientMe);
router.put(
  "/client/profile",
  clientProtect,
  updateClientProfile
);

router.put(
  "/client/password",
  clientProtect,
  updateClientPassword
);

module.exports = router;
