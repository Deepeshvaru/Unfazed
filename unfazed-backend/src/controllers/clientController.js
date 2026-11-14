
const Client = require("../models/Client");
const Session = require("../models/Session");
const Payment = require("../models/Payment");
const SessionNote = require("../models/SessionNote");
const SubscriptionTierConfig = require("../models/SubscriptionTierConfig");
const { canAccess } = require("../services/entitlementService");

// Add a client
exports.addClient = async (req, res) => {
  try {
    const { name, email, phone, age, gender, occupation, notes } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({
        message: "Client name and email are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
// Check subscription client limit through Entitlement Service
const activeClientCount = await Client.countDocuments({
  therapist: req.therapist._id,
  status: "active"
});

const allowed = await canAccess(
  req.therapist._id,
  "activeClientLimit",
  activeClientCount
);

if (!allowed) {
  return res.status(403).json({
    message: "Your subscription client limit has been reached. Please upgrade your plan.",
    currentClients: activeClientCount,
    upgradeRequired: true
  });
}


    const existing = await Client.findOne({
      therapist: req.therapist._id,
      email: normalizedEmail
    });

    if (existing) {
      return res.status(409).json({ message: "Client already exists" });
    }

    const client = await Client.create({
      therapist: req.therapist._id,
      name: name.trim(),
      email: normalizedEmail,
      phone,
      age,
      gender,
      occupation,
      notes
    });

    res.status(201).json({
      message: "Client added successfully",
      client
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Client already exists" });
    }

    res.status(500).json({ message: error.message });
  }
};

// Get clients with search, filtering and sorting
exports.getClients = async (req, res) => {
  try {
    const {
      search = "",
      status,
      sortBy = "createdAt",
      order = "desc",
      page = 1,
      limit = 20
    } = req.query;

    const allowedSortFields = ["name", "email", "createdAt", "status"];

    const safeSort = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const safeOrder = order === "asc" ? 1 : -1;
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filter = { therapist: req.therapist._id };

    if (status && ["active", "inactive"].includes(status)) {
      filter.status = status;
    }

    if (search.trim()) {
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
        { phone: { $regex: escapedSearch, $options: "i" } }
      ];
    }

    const [clients, total] = await Promise.all([
      Client.find(filter)
        .sort({ [safeSort]: safeOrder })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),

      Client.countDocuments(filter)
    ]);

    res.json({
      clients,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get one client with appointment and payment history
exports.getClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      therapist: req.therapist._id
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const [sessions, payments] = await Promise.all([
      Session.find({
        therapist: req.therapist._id,
        client: client._id
      }).sort({ date: -1, startTime: -1 }),

      Payment.find({
        therapist: req.therapist._id,
        client: client._id
      }).sort({ createdAt: -1 })
    ]);

    res.json({ client, sessions, payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update client details
exports.updateClient = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "email",
      "phone",
      "age",
      "gender",
      "occupation",
      "notes",
      "status"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.email) {
      updates.email = updates.email.trim().toLowerCase();
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      return res.status(400).json({ message: "Client name cannot be empty" });
    }

    if (updates.email !== undefined && !updates.email) {
      return res.status(400).json({ message: "Client email cannot be empty" });
    }

    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.id,
        therapist: req.therapist._id
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({ message: "Client updated successfully", client });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Another client already uses this email" });
    }

    res.status(500).json({ message: error.message });
  }
};

// Submit intake information and record consent
exports.submitIntake = async (req, res) => {
  try {
    const {
      age,
      gender,
      occupation,
      presentingConcern,
      relevantHistory,
      therapyGoals,
      consentGiven
    } = req.body;

    if (consentGiven !== true) {
      return res.status(400).json({
        message: "Consent must be explicitly provided before submitting intake"
      });
    }

    if (!presentingConcern?.trim()) {
      return res.status(400).json({
        message: "Please provide the presenting concern"
      });
    }

    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.id,
        therapist: req.therapist._id
      },
      {
        $set: {
          age,
          gender,
          occupation,
          presentingConcern: presentingConcern.trim(),
          relevantHistory: relevantHistory || "",
          therapyGoals: therapyGoals || "",
          consentGiven: true,
          consentAt: new Date(),
          intakeSubmittedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({
      message: "Intake submitted and consent recorded",
      client
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a client only if there is no linked history
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      therapist: req.therapist._id
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const [sessionCount, paymentCount] = await Promise.all([
      Session.countDocuments({
        therapist: req.therapist._id,
        client: client._id
      }),
      Payment.countDocuments({
        therapist: req.therapist._id,
        client: client._id
      })
    ]);

    if (sessionCount > 0 || paymentCount > 0) {
      return res.status(409).json({
        message: "This client has appointment or payment history. Mark the client inactive instead."
      });
    }

    await client.deleteOne();

    res.json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getClientPortal = async (req, res) => {
  try {
    const clients = await Client.find({
      account: req.clientAccount._id,
      status: "active"
    }).select("_id therapist name email phone");

    const clientIds = clients.map(client => client._id);

    if (clientIds.length === 0) {
      return res.json({
        clients: [],
        appointments: [],
        sharedNotes: [],
        payments: []
      });
    }

    const [appointments, sharedNotes, payments] = await Promise.all([
      Session.find({ client: { $in: clientIds } })
        .select("client therapist date startTime endTime status")
        .populate("therapist", "name slug")
        .sort({ date: -1 }),

      SessionNote.find({
        client: { $in: clientIds },
        visibility: "shared"
      })
        .select("client session title content createdAt")
        .populate("session", "date startTime endTime")
        .sort({ createdAt: -1 }),

      Payment.find({
        client: { $in: clientIds }
      })
        .select("amount currency status receipt createdAt")
        .sort({ createdAt: -1 })
    ]);

    res.json({
      clients,
      appointments,
      sharedNotes,
      payments
    });
  } catch (error) {
    console.error("Client portal error:", error);
    res.status(500).json({
      message: "Could not load client portal"
    });
  }
};
