
const { canAccess } = require("../services/entitlementService");

const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const allowed = await canAccess(req.therapist._id, featureKey);

      if (!allowed) {
        return res.status(403).json({
          message: "This feature requires a subscription upgrade",
          requiredFeature: featureKey
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        message: "Unable to verify subscription access"
      });
    }
  };
};

module.exports = requireFeature;
