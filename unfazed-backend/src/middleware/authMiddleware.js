
const jwt = require("jsonwebtoken");
const Therapist = require("../models/Therapist");

const protect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Not authorized, no token"
    });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const therapist = await Therapist.findById(decoded.id);

    if (!therapist) {
      return res.status(401).json({
        message: "Therapist no longer exists"
      });
    }

    req.therapist = therapist;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, token invalid"
    });
  }
};

const clientProtect = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Client authentication required"
    });
  }

  try {
    const decoded = jwt.verify(
      header.split(" ")[1],
      process.env.JWT_SECRET
    );

    if (decoded.role !== "client") {
      return res.status(401).json({
        message: "Invalid client token"
      });
    }

    const ClientAccount = require("../models/Client").ClientAccount;
    const account = await ClientAccount.findById(decoded.id);

    if (!account) {
      return res.status(401).json({
        message: "Client account not found"
      });
    }

    req.clientAccount = account;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired client token"
    });
  }
};

module.exports = protect;
module.exports.protect = protect;
module.exports.clientProtect = clientProtect;
