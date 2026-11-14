
const SessionNote = require("../models/SessionNote");
const Client = require("../models/Client");
const Session = require("../models/Session");

const { canAccess } = require("../services/entitlementService");

// Create a clinical note
exports.createNote = async (req, res) => {
  try {
  const {
  client,
  session,
  title,
  content,
  visibility,
  templateType = "basic"
} = req.body;

    if (!client || !session || !title || !content) {
      return res.status(400).json({
        message: "Client, session, title and content are required"
      });
    }

    if (visibility && !["private", "shared"].includes(visibility)) {
      return res.status(400).json({ message: "Invalid visibility" });
    }

    if (!["basic", "soap", "progress"].includes(templateType)) {
  return res.status(400).json({
    message: "Invalid note template type"
  });
}

    const clientExists = await Client.findOne({
      _id: client,
      therapist: req.therapist._id
    });

    if (!clientExists) {
      return res.status(404).json({ message: "Client not found" });
    }

    const sessionExists = await Session.findOne({
  _id: session,
  therapist: req.therapist._id
});

if (!sessionExists) {
  return res.status(404).json({ message: "Session not found" });
}

if (
  sessionExists.client &&
  sessionExists.client.toString() !== client
) {
  return res.status(400).json({
    message: "Session belongs to another client"
  });
}

if (
  !sessionExists.client &&
  sessionExists.clientEmail !== clientExists.email
) {
  return res.status(400).json({
    message: "Session email does not match this client"
  });
}

// Check subscription template access
// Check subscription template access through Entitlement Service
const templateAllowed = await canAccess(
  req.therapist._id,
  "noteTemplate",
  templateType
);

if (!templateAllowed) {
  return res.status(403).json({
    message: "This note template requires a subscription upgrade",
    requiredTemplate: templateType,
    upgradeRequired: true
  });
}
const note = await SessionNote.create({
  therapist: req.therapist._id,
  client,
  session,
  title,
  content,
  templateType,
  visibility: visibility || "private"
});

    res.status(201).json({
      message: "Clinical note created successfully",
      note
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all clinical notes
exports.getNotes = async (req, res) => {
  try {
    const notes = await SessionNote.find({
      therapist: req.therapist._id
    })
      .populate("client", "name email")
      .populate("session", "date startTime endTime status")
      .sort({ createdAt: -1 });

    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single clinical note
exports.getNote = async (req, res) => {
  try {
    const note = await SessionNote.findOne({
      _id: req.params.id,
      therapist: req.therapist._id
    })
      .populate("client", "name email")
      .populate("session", "date startTime endTime status");

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a clinical note

// Update a clinical note
exports.updateNote = async (req, res) => {
  try {
    const { title, content, visibility, templateType } = req.body;

    if (
      visibility !== undefined &&
      !["private", "shared"].includes(visibility)
    ) {
      return res.status(400).json({ message: "Invalid visibility" });
    }

    if (
      templateType !== undefined &&
      !["basic", "soap", "progress"].includes(templateType)
    ) {
      return res.status(400).json({ message: "Invalid note template type" });
    }

    const note = await SessionNote.findOne({
      _id: req.params.id,
      therapist: req.therapist._id
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Check access to the template being saved
    const selectedTemplate = templateType || note.templateType || "basic";

    const templateAllowed = await canAccess(
      req.therapist._id,
      "noteTemplate",
      selectedTemplate
    );

    if (!templateAllowed) {
      return res.status(403).json({
        message: "This note template requires a subscription upgrade",
        requiredTemplate: selectedTemplate,
        upgradeRequired: true
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: "Title cannot be empty" });
      }
      note.title = title.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({ message: "Content cannot be empty" });
      }
      note.content = content;
    }

    if (visibility !== undefined) note.visibility = visibility;
    if (templateType !== undefined) note.templateType = templateType;

    await note.save();

    res.status(200).json({
      message: "Clinical note updated successfully",
      note
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a clinical note
exports.deleteNote = async (req, res) => {
  try {
    const note = await SessionNote.findOneAndDelete({
      _id: req.params.id,
      therapist: req.therapist._id
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json({
      message: "Clinical note deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
