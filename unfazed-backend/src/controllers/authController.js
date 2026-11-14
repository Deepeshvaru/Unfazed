
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const Therapist = require("../models/Therapist");
const generateSlug = require("../utils/generateSlug");
const ClientAccount = require("../models/Client").ClientAccount;
const Client = require("../models/Client");
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// Remove sensitive information before sending therapist data
const safeTherapist = (therapist) => {
  const data = therapist.toObject();
  delete data.password_hash;
  return data;
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;

    const existing = await Therapist.findOne({ email });

    if (existing) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    const baseSlug = generateSlug(name) || "therapist";
    let slug = baseSlug;
    let counter = 1;

    while (await Therapist.exists({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const therapist = await Therapist.create({
      name,
      email,
      password_hash,
      slug
    });

    res.status(201).json({
      message: "Registration successful",
      token: signToken(therapist._id),
      therapist: safeTherapist(therapist)
    });

  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const email = req.body.email.trim().toLowerCase();
    const { password } = req.body;

    const therapist = await Therapist.findOne({ email })
      .select("+password_hash");

    const isMatch =
      therapist && await bcrypt.compare(password, therapist.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    res.json({
      message: "Login successful",
      token: signToken(therapist._id),
      therapist: safeTherapist(therapist)
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    therapist: safeTherapist(req.therapist)
  });
};

// POST /api/auth/client/register
const registerClient = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await ClientAccount.findOne({
      email: normalizedEmail
    });

    if (existing) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const client = await ClientAccount.create({
      name: name.trim(),
      email: normalizedEmail,
      password_hash,
      phone: phone || ""
    });

    const token = jwt.sign(
      { id: client._id, role: "client" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "Client registration successful",
      token,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone
      }
    });

  } catch (error) {
    next(error);
  }
};

// POST /api/auth/client/login
const loginClient = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const client = await ClientAccount.findOne({
      email: email.trim().toLowerCase()
    }).select("+password_hash");

    if (
      !client ||
      !(await bcrypt.compare(password, client.password_hash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { id: client._id, role: "client" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Client login successful",
      token,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone
      }
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/auth/client/me
const getClientMe = async (req, res) => {
  res.json({
    client: {
      id: req.clientAccount._id,
      name: req.clientAccount.name,
      email: req.clientAccount.email,
      phone: req.clientAccount.phone
    }
  });
};


// PUT /api/auth/client/profile
const updateClientProfile = async (req, res, next) => {
  try {
    const { name, phone, gender } = req.body;
    
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Name is required"
      });
    }
    
    const allowedGenders = [
      "",
      "Male",
      "Female",
      "Other",
      "Prefer not to say"
    ];
    
    if (
      gender !== undefined &&
      !allowedGenders.includes(gender)
    ) {
      return res.status(400).json({
        message: "Invalid gender selection"
      });
    }
    
    const updates = {
      name: name.trim(),
      phone: typeof phone === "string" ? phone.trim() : ""
    };
    
    if (gender !== undefined) {
      updates.gender = gender;
    }
    
    const account = await ClientAccount.findByIdAndUpdate(
      req.clientAccount._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!account) {
      return res.status(404).json({
        message: "Client account not found"
      });
    }

    // Keep the client's name and phone consistent
    // across their linked therapist records.
    await Client.updateMany(
      { account: account._id },
      {
        $set: {
          name: account.name,
          phone: account.phone
        }
      }
    );
    
    res.json({
      message: "Profile updated successfully",
      client: {
        id: account._id,
        name: account.name,
        email: account.email,
        phone: account.phone,
        gender: account.gender
      }
    });
  } catch (error) {
    next(error);
  }
};


// PUT /api/auth/client/password
const updateClientPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current and new passwords are required"
      });
    }
    
    if (
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return res.status(400).json({
        message: "New password must be at least 8 characters"
      });
    }
    
    const account = await ClientAccount.findById(
      req.clientAccount._id
    ).select("+password_hash");
    
    if (!account) {
      return res.status(404).json({
        message: "Client account not found"
      });
    }
    
    const isMatch = await bcrypt.compare(
      currentPassword,
      account.password_hash
    );
    
    if (!isMatch) {
      return res.status(401).json({
        message: "Current password is incorrect"
      });
    }
    
    account.password_hash = await bcrypt.hash(newPassword, 10);
    await account.save();
    
    res.json({
      message: "Password updated successfully"
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  register,
  login,
  getMe,
  registerClient,
  loginClient,
  getClientMe,
  updateClientProfile,
  updateClientPassword
};
