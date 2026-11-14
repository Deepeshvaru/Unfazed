
const Therapist = require("../models/Therapist");
const Lead = require("../models/Lead");

const distributeLead = async (slug, leadData) => {
  const therapist = await Therapist.findOne({ slug });

  if (!therapist) {
    throw new Error("Therapist profile not found");
  }

  const lead = await Lead.create({
    therapist: therapist._id,
    name: leadData.name,
    email: leadData.email,
    phone: leadData.phone || "",
    message: leadData.message || ""
  });

  return lead;
};

module.exports = { distributeLead };
