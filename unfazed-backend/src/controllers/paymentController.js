
const Razorpay = require("razorpay");
const crypto = require("crypto");

const Payment = require("../models/Payment");
const Package = require("../models/Package");
const Client = require("../models/Client");
const ClientPackage = require("../models/ClientPackage");
const Therapist = require("../models/Therapist");
const generateInvoice = require("../services/invoiceService");

// Razorpay configuration
const razorpay = () => {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    throw new Error("Razorpay test API keys are not configured");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

// Activate a purchased client package
const activateClientPackage = async (payment) => {
  const existing = await ClientPackage.findOne({
    payment: payment._id
  });

  if (existing) return existing;

  const item = await Package.findById(payment.package);

  if (!item) {
    throw new Error("Package record not found");
  }

  const expiryDate = new Date();
  expiryDate.setDate(
    expiryDate.getDate() + item.validityDays
  );

  try {
    return await ClientPackage.findOneAndUpdate(
      { payment: payment._id },
      {
        $setOnInsert: {
          therapist: payment.therapist,
          client: payment.client,
          package: item._id,
          payment: payment._id,
          totalSessions: item.sessionsCount,
          expiryDate
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );
  } catch (error) {
    if (error.code === 11000) {
      return await ClientPackage.findOne({
        payment: payment._id
      });
    }

    throw error;
  }
};

// ==========================================
// THERAPIST PACKAGE MANAGEMENT
// ==========================================

// Create a package
exports.createPackage = async (req, res) => {
  try {
    const {
      name,
      description,
      sessionsCount,
      price,
      validityDays
    } = req.body;

    if (!name || !sessionsCount || !price) {
      return res.status(400).json({
        message: "Name, sessions and price are required"
      });
    }

    const item = await Package.create({
      therapist: req.therapist._id,
      name,
      description,
      sessionsCount,
      price,
      validityDays
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get therapist packages
exports.getPackages = async (req, res) => {
  try {
    const packages = await Package.find({
      therapist: req.therapist._id
    }).sort({ createdAt: -1 });

    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a package
exports.updatePackage = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "description",
      "sessionsCount",
      "price",
      "validityDays",
      "isActive"
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const item = await Package.findOneAndUpdate(
      {
        _id: req.params.id,
        therapist: req.therapist._id
      },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        message: "Package not found"
      });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// INDIVIDUAL PAYMENT REQUESTS
// ==========================================

// Therapist creates a payment request for a client
exports.createPaymentRequest = async (req, res) => {
  try {
    const { clientId, amount, description } = req.body;
    const numericAmount = Number(amount);

    if (
      !clientId ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0 ||
      !description?.trim()
    ) {
      return res.status(400).json({
        message: "Client, valid amount and description are required"
      });
    }

    const client = await Client.findOne({
      _id: clientId,
      therapist: req.therapist._id
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found"
      });
    }

    const payment = await Payment.create({
      therapist: req.therapist._id,
      client: client._id,
      paymentType: "request",
      description: description.trim(),
      amount: numericAmount,
      currency: "INR",
      status: "pending"
    });

    res.status(201).json({
      message: "Payment request created successfully",
      payment
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Client views their payment requests
exports.getClientPaymentRequests = async (req, res) => {
  try {
    const account = req.clientAccount;

    if (!account) {
      return res.status(401).json({
        message: "Client authentication required"
      });
    }

    const clients = await Client.find({
      account: account._id
    }).select("_id");

    const clientIds = clients.map(
      (item) => item._id
    );

    const requests = await Payment.find({
      client: { $in: clientIds },
      paymentType: "request"
    })
      .populate("therapist", "name slug")
      .populate("client", "name email")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Client creates Razorpay order for a payment request
exports.createClientRequestOrder = async (req, res) => {
  try {
    const { requestId } = req.body;
    const account = req.clientAccount;

    if (!account) {
      return res.status(401).json({
        message: "Client authentication required"
      });
    }

    if (!requestId) {
      return res.status(400).json({
        message: "Payment request ID is required"
      });
    }

    const payment = await Payment.findOne({
      _id: requestId,
      paymentType: "request",
      status: "pending"
    });

    if (!payment) {
      return res.status(404).json({
        message: "Pending payment request not found"
      });
    }

    const client = await Client.findOne({
      _id: payment.client,
      therapist: payment.therapist,
      account: account._id
    });

    if (!client) {
      return res.status(403).json({
        message: "You are not authorized to pay this request"
      });
    }

    const order = await razorpay().orders.create({
      amount: Math.round(payment.amount * 100),
      currency: payment.currency || "INR",
      receipt: `request_${Date.now()}`
    });

    payment.razorpayOrderId = order.id;
    payment.receipt = order.receipt;
    await payment.save();

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      description: payment.description
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ==========================================
// THERAPIST PACKAGE PAYMENT
// ==========================================

// Create Razorpay order for a package
exports.createOrder = async (req, res) => {
  try {
    const { packageId, clientId } = req.body;

    const item = await Package.findOne({
      _id: packageId,
      therapist: req.therapist._id,
      isActive: true
    });

    if (!item) {
      return res.status(404).json({
        message: "Active package not found"
      });
    }

    const client = await Client.findOne({
      _id: clientId,
      therapist: req.therapist._id
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found"
      });
    }

    const order = await razorpay().orders.create({
      amount: Math.round(item.price * 100),
      currency: "INR",
      receipt: `pkg_${Date.now()}`
    });

    await Payment.create({
      therapist: req.therapist._id,
      client: client._id,
      package: item._id,
      amount: item.price,
      currency: "INR",
      razorpayOrderId: order.id,
      receipt: order.receipt,
      status: "pending"
    });

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify therapist-created package payment
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Payment details are incomplete"
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      therapist: req.therapist._id
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment order not found"
      });
    }

    if (payment.status === "success") {
      const clientPackage = payment.package
        ? await activateClientPackage(payment)
        : null;

      return res.json({
        message: "Payment already verified",
        payment,
        clientPackage
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const received = Buffer.from(razorpay_signature);
    const expected = Buffer.from(expectedSignature);

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      payment.status = "failed";
      await payment.save();

      return res.status(400).json({
        message: "Invalid payment signature"
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = "success";
    await payment.save();

    const clientPackage = payment.package
      ? await activateClientPackage(payment)
      : null;

    res.json({
      message: "Payment verified successfully",
      payment,
      clientPackage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// PAYMENT HISTORY AND CLIENT PACKAGES
// ==========================================

// Therapist payment history
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      therapist: req.therapist._id
    })
      .populate("client", "name email")
      .populate("package", "name")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Therapist client package records
exports.getClientPackages = async (req, res) => {
  try {
    const records = await ClientPackage.find({
      therapist: req.therapist._id
    })
      .populate("client", "name email")
      .populate("package", "name price sessionsCount")
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// RAZORPAY WEBHOOK
// ==========================================

exports.razorpayWebhook = async (req, res) => {
  try {
    const signature =
      req.headers["x-razorpay-signature"];

    if (
      !signature ||
      !process.env.RAZORPAY_WEBHOOK_SECRET
    ) {
      return res.status(400).send(
        "Missing webhook signature"
      );
    }

    const expected = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_WEBHOOK_SECRET
      )
      .update(req.body)
      .digest("hex");

    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(
        receivedBuffer,
        expectedBuffer
      )
    ) {
      return res.status(400).send(
        "Invalid webhook signature"
      );
    }

    const event = JSON.parse(req.body.toString());

    if (
      event.event === "payment.captured" ||
      event.event === "payment.failed"
    ) {
      const orderId =
        event.payload.payment.entity.order_id;

      const paymentId =
        event.payload.payment.entity.id;

      const payment = await Payment.findOne({
        razorpayOrderId: orderId
      });

      if (!payment) {
        return res.status(404).send(
          "Payment record not found"
        );
      }

      if (event.event === "payment.captured") {
        if (payment.status === "pending") {
          payment.razorpayPaymentId = paymentId;
          payment.status = "success";
          await payment.save();
        }

        // Only package purchases activate a client package
        if (
          payment.status === "success" &&
          payment.package
        ) {
          await activateClientPackage(payment);
        }
      }

      if (
        event.event === "payment.failed" &&
        payment.status === "pending"
      ) {
        payment.status = "failed";
        await payment.save();
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);

    res.status(500).json({
      message: "Webhook processing failed"
    });
  }
};

// ==========================================
// PUBLIC THERAPIST PACKAGES
// ==========================================

// Get active packages for public booking page
exports.getPublicPackages = async (req, res) => {
  try {
    const therapist = await Therapist.findOne({
      slug: req.params.slug
    }).select("_id");

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found"
      });
    }

    const packages = await Package.find({
      therapist: therapist._id,
      isActive: true
    }).select(
      "name description sessionsCount price validityDays"
    );

    res.json({ packages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// CLIENT PACKAGE PURCHASE
// ==========================================

// Create Razorpay order for logged-in client
exports.createClientOrder = async (req, res) => {
  try {
    const { packageId, slug } = req.body;

    if (!packageId || !slug) {
      return res.status(400).json({
        message: "Package and therapist are required"
      });
    }

    const therapist = await Therapist.findOne({
      slug
    }).select("_id");

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found"
      });
    }

    const item = await Package.findOne({
      _id: packageId,
      therapist: therapist._id,
      isActive: true
    });

    if (!item) {
      return res.status(404).json({
        message: "Active package not found"
      });
    }

    const account = req.clientAccount;

    if (!account) {
      return res.status(401).json({
        message: "Client authentication required"
      });
    }

    // Find or create client's CRM record
    let client = await Client.findOne({
      therapist: therapist._id,
      account: account._id
    });

    if (!client) {
      client = await Client.create({
        therapist: therapist._id,
        account: account._id,
        name: account.name,
        email: account.email
      });
    }

    const order = await razorpay().orders.create({
      amount: Math.round(item.price * 100),
      currency: "INR",
      receipt: `client_pkg_${Date.now()}`
    });

    await Payment.create({
      therapist: therapist._id,
      client: client._id,
      package: item._id,
      amount: item.price,
      currency: "INR",
      razorpayOrderId: order.id,
      receipt: order.receipt,
      status: "pending"
    });

    res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      packageName: item.name
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify payment made by logged-in client
exports.verifyClientPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Payment details are incomplete"
      });
    }

    const account = req.clientAccount;

    if (!account) {
      return res.status(401).json({
        message: "Client authentication required"
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment order not found"
      });
    }

    const client = await Client.findOne({
      _id: payment.client,
      therapist: payment.therapist,
      account: account._id
    });

    if (!client) {
      return res.status(403).json({
        message: "You are not authorized to verify this payment"
      });
    }

    // Make verification safe to retry
    if (payment.status === "success") {
      let clientPackage = null;

      if (payment.package) {
        clientPackage = await activateClientPackage(payment);
      }

      return res.json({
        message: "Payment already verified",
        payment,
        clientPackage
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    const received = Buffer.from(razorpay_signature);
    const expected = Buffer.from(expectedSignature);

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        message: "Invalid payment signature"
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = "success";
    await payment.save();

    let clientPackage = null;

    // Payment requests do not activate packages
    if (payment.package) {
      clientPackage = await activateClientPackage(payment);
    }

    res.json({
      message: payment.package
        ? "Payment successful and package activated"
        : "Payment request paid successfully",
      payment,
      clientPackage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get packages purchased by logged-in client
exports.getMyClientPackages = async (req, res) => {
  try {
    const account = req.clientAccount;

    if (!account) {
      return res.status(401).json({
        message: "Client authentication required"
      });
    }

    const clients = await Client.find({
      account: account._id
    }).select("_id");

    const clientIds = clients.map(
      (client) => client._id
    );

    const records = await ClientPackage.find({
      client: { $in: clientIds }
    })
      .populate("therapist", "name slug")
      .populate("client", "name email")
      .populate(
        "package",
        "name description price sessionsCount validityDays"
      )
      .sort({ createdAt: -1 });

    res.json({ packages: records });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// INVOICE DOWNLOAD
// ==========================================

exports.downloadInvoice = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      therapist: req.therapist._id
    })
      .populate("therapist", "name email")
      .populate("client", "name email")
      .populate("package", "name");

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found"
      });
    }

    if (payment.status !== "success") {
      return res.status(400).json({
        message: "Invoice is available only for successful payments"
      });
    }

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="UNF-${payment._id}.pdf"`
    );

    generateInvoice(payment, res);
  } catch (error) {
    console.error("Invoice generation error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Unable to generate invoice"
      });
    }
  }
};
// Client downloads their own invoice
exports.downloadClientInvoice = async (req, res) => {
  try {
    const account = req.clientAccount;

    if (!account) {
      return res.status(401).json({
        message: "Client authentication required"
      });
    }

    const payment = await Payment.findById(req.params.id)
      .populate("therapist", "name email")
      .populate("client", "name email")
      .populate("package", "name");

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found"
      });
    }

    // Verify payment belongs to logged-in client
    const client = await Client.findOne({
      _id: payment.client?._id,
      therapist: payment.therapist?._id,
      account: account._id
    });

    if (!client) {
      return res.status(403).json({
        message: "You are not authorized to download this invoice"
      });
    }

    if (payment.status !== "success") {
      return res.status(400).json({
        message: "Invoice is available only for successful payments"
      });
    }

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="UNF-${payment._id}.pdf"`
    );

    generateInvoice(payment, res);

  } catch (error) {
    console.error("Client invoice error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Unable to generate invoice"
      });
    }
  }
};