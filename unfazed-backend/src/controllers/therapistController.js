
const Therapist = require("../models/Therapist");

// Get public therapist profile using slug
const getPublicProfile = async (req, res) => {
  try {
    const therapist = await Therapist.findOne({
      slug: req.params.slug.toLowerCase()
    }).select("name slug bio specializations languages");

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist profile not found"
      });
    }

    res.status(200).json({ therapist });
  } catch (error) {
    res.status(500).json({
      message: "Could not load therapist profile"
    });
  }
};

// Get logged-in therapist profile
const getMyProfile = async (req, res) => {
  try {
   const therapist = await Therapist.findById(req.therapist._id)
      .select("-password_hash");

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found"
      });
    }

    res.status(200).json({ therapist });
  } catch (error) {
    res.status(500).json({
      message: "Could not load your profile"
    });
  }
};

// Update logged-in therapist profile
const updateMyProfile = async (req, res) => {
  try {
    const { name, bio, specializations, languages } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Valid name is required"
        });
      }
      updates.name = name.trim();
    }

    if (bio !== undefined) {
      if (typeof bio !== "string") {
        return res.status(400).json({
          message: "Bio must be text"
        });
      }
      updates.bio = bio.trim();
    }

    if (specializations !== undefined) {
      if (!Array.isArray(specializations)) {
        return res.status(400).json({
          message: "Specializations must be an array"
        });
      }
      updates.specializations = specializations;
    }

    if (languages !== undefined) {
      if (!Array.isArray(languages)) {
        return res.status(400).json({
          message: "Languages must be an array"
        });
      }
      updates.languages = languages;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid profile fields provided"
      });
    }

    const therapist = await Therapist.findByIdAndUpdate(
    req.therapist._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password_hash");

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found"
      });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      therapist
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not update profile"
    });
  }
};

const getTherapists = async (req, res) => {
  try {
    const {
      search = "",
      specialization = "",
      page = 1,
      limit = 12
    } = req.query;

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(
      Math.max(parseInt(limit, 10) || 12, 1),
      50
    );

    const filter = {};

    if (search.trim()) {
      const escapedSearch = search.trim().replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { bio: { $regex: escapedSearch, $options: "i" } }
      ];
    }

    if (specialization.trim()) {
      filter.specializations = {
        $regex: specialization.trim().replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        ),
        $options: "i"
      };
    }

    const [therapists, total] = await Promise.all([
      Therapist.find(filter)
        .select("name slug bio specializations languages")
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),

      Therapist.countDocuments(filter)
    ]);

    res.status(200).json({
      therapists,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not load therapists"
    });
  }
};

module.exports = {
  getPublicProfile,
  getMyProfile,
  updateMyProfile,
  getTherapists
};
