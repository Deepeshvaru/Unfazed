
const Lead = require("../models/Lead");
const { distributeLead } = require("../services/leadDistributionService");

const createLead = async (req, res) => {
  try {
    const { slug, name, email, phone, message } = req.body;

    if (!slug || !name || !email) {
      return res.status(400).json({
        message: "Slug, name and email are required"
      });
    }

    const lead = await distributeLead(slug, {
      name,
      email,
      phone,
      message
    });

    res.status(201).json({
      message: "Lead submitted successfully",
      lead
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const getLeads = async (req, res) => {
  try {
    const leads = await Lead.find({
      therapist: req.therapist._id
    }).sort({ createdAt: -1 });

    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch leads" });
  }
};

const updateLead = async (req, res) => {
  try {
    const allowedStatuses = ["new", "contacted", "converted", "closed"];

    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid lead status" });
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, therapist: req.therapist._id },
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ message: "Unable to update lead" });
  }
};

module.exports = { createLead, getLeads, updateLead };
