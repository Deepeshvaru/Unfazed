
const Therapist = require("../models/Therapist");
const SubscriptionTierConfig = require("../models/SubscriptionTierConfig");

const getTierConfig = async (therapistId) => {
  const therapist = await Therapist.findById(therapistId);

  if (!therapist) {
    return null;
  }

  const tierName = therapist.subscriptionTier || "free";

  return SubscriptionTierConfig.findOne({
    name: tierName
  });
};

const canAccess = async (therapistId, featureKey, value = null) => {
  const tierConfig = await getTierConfig(therapistId);

  if (!tierConfig) {
    return false;
  }

  // Check normal feature flags
  if (featureKey === "clientManagement") {
    return tierConfig.features.includes("clientManagement");
  }

  // Check active-client limit
  if (featureKey === "activeClientLimit") {
    const maxClients = tierConfig.limits?.maxClients ?? 10;

    return maxClients === -1 || value < maxClients;
  }

  // Check note template access
  if (featureKey === "noteTemplate") {
    return (tierConfig.noteTemplates || ["basic"]).includes(value);
  }

  // Check analytics access
  if (featureKey === "advancedAnalytics") {
    return tierConfig.analyticsLevel === "advanced";
  }

  return tierConfig.features.includes(featureKey);
};

module.exports = {
  canAccess,
  getTierConfig
};
