
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Therapist = require("../models/Therapist");
const SubscriptionTierConfig = require("../models/SubscriptionTierConfig");
const Payment = require("../models/Payment");

// Razorpay configuration
const razorpay = () => {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    throw new Error("Razorpay API keys are not configured");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

// GET: Fetch all available plans
const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionTierConfig.find().sort({
      price: 1
    });

    res.status(200).json(plans);
  } catch (error) {
    console.error("Get plans error:", error);

    res.status(500).json({
      message: "Unable to fetch plans"
    });
  }
};

// GET: Fetch logged-in therapist's subscription
const getMySubscription = async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.therapist._id);

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found"
      });
    }

    const tier = therapist.subscriptionTier || "free";

    const plan = await SubscriptionTierConfig.findOne({
      name: tier
    });

    res.status(200).json({
      subscriptionTier: tier,
      plan
    });
  } catch (error) {
    console.error("Get subscription error:", error);

    res.status(500).json({
      message: "Unable to fetch subscription"
    });
  }
};

// POST: Create Razorpay order for Pro or Premium
const createSubscriptionOrder = async (req, res) => {
  try {
    const { tier } = req.body;

    const plan = await SubscriptionTierConfig.findOne({
      name: tier
    });

    if (!plan) {
      return res.status(400).json({
        message: "Invalid subscription plan"
      });
    }

    if (plan.name === "free" || plan.price <= 0) {
      return res.status(400).json({
        message: "Free plan does not require payment"
      });
    }

    const amountPaise = Math.round(plan.price * 100);

    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({
        message: "Invalid plan price"
      });
    }

    const receipt = `sub_${Date.now()}_${req.therapist._id
      .toString()
      .slice(-6)}`;

    const order = await razorpay().orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        therapistId: req.therapist._id.toString(),
        subscriptionTier: plan.name
      }
    });

    await Payment.create({
      therapist: req.therapist._id,
      paymentType: "subscription",
      description: `Subscription: ${plan.name}`,
      amount: plan.price,
      currency: "INR",
      razorpayOrderId: order.id,
      receipt,
      status: "pending"
    });

    res.status(201).json({
      message: "Subscription order created",
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: {
        name: plan.name,
        price: plan.price
      }
    });
  } catch (error) {
    console.error("Create subscription order error:", error);

    res.status(500).json({
      message: "Unable to create subscription order"
    });
  }
};

// POST: Verify payment and activate the paid plan
const verifySubscriptionPayment = async (req, res) => {
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
        message: "Payment verification details are missing"
      });
    }

    const payment = await Payment.findOne({
      therapist: req.therapist._id,
      razorpayOrderId: razorpay_order_id,
      paymentType: "subscription"
    });

    if (!payment) {
      return res.status(404).json({
        message: "Subscription payment record not found"
      });
    }

    // Make repeated verification requests safe
    if (payment.status === "success") {
      if (payment.razorpayPaymentId !== razorpay_payment_id) {
        return res.status(400).json({
          message: "Payment does not match this order"
        });
      }

      return res.status(200).json({
        message: "Subscription payment already verified",
        subscriptionTier: payment.description.replace(
          "Subscription: ",
          ""
        )
      });
    }

    if (payment.status !== "pending") {
      return res.status(400).json({
        message: "This payment cannot be verified"
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(razorpay_signature);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        message: "Payment signature verification failed"
      });
    }

    // Confirm payment details directly with Razorpay
const razorpayPayment = await razorpay().payments.fetch(
  razorpay_payment_id
);

const expectedAmount = Math.round(payment.amount * 100);

if (
  razorpayPayment.order_id !== razorpay_order_id ||
  razorpayPayment.amount !== expectedAmount ||
  razorpayPayment.currency !== "INR" ||
  razorpayPayment.status !== "captured"
) {
  return res.status(400).json({
    message: "Payment is not successfully captured"
  });
}

    const tier = payment.description.replace(
      "Subscription: ",
      ""
    );

    const plan = await SubscriptionTierConfig.findOne({
      name: tier
    });

    if (!plan || plan.name === "free") {
      return res.status(400).json({
        message: "Subscription plan is invalid"
      });
    }

    const therapist = await Therapist.findById(
      req.therapist._id
    );

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found"
      });
    }

    // Record successful payment and activate the plan
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.status = "success";
    await payment.save();

    therapist.subscriptionTier = plan.name;
    await therapist.save();

    res.status(200).json({
      message: "Payment verified and subscription activated",
      subscriptionTier: therapist.subscriptionTier
    });
  } catch (error) {
    console.error("Verify subscription payment error:", error);

    res.status(500).json({
      message: "Unable to verify subscription payment"
    });
  }
};

// PUT: Allow free plan selection only.
// Paid plans must go through Razorpay verification.
const changeSubscription = async (req, res) => {
  try {
    const { tier } = req.body;

    if (tier !== "free") {
      return res.status(400).json({
        message: "Paid plans can only be activated after successful payment"
      });
    }

    const freePlan = await SubscriptionTierConfig.findOne({
      name: "free"
    });

    if (!freePlan) {
      return res.status(404).json({
        message: "Free plan configuration not found"
      });
    }

    const therapist = await Therapist.findByIdAndUpdate(
      req.therapist._id,
      { subscriptionTier: "free" },
      { new: true, runValidators: true }
    );

    if (!therapist) {
      return res.status(404).json({
        message: "Therapist not found"
      });
    }

    res.status(200).json({
      message: "Free plan activated",
      subscriptionTier: therapist.subscriptionTier
    });
  } catch (error) {
    console.error("Change subscription error:", error);

    res.status(500).json({
      message: "Unable to change subscription"
    });
  }
};

module.exports = {
  getPlans,
  getMySubscription,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  changeSubscription
};
