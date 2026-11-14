
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

// Razorpay webhook must receive the raw body
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Unfazed API is running successfully!",
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/therapists", require("./routes/therapistRoutes"));
app.use("/api/clients", require("./routes/clientRoutes"));
app.use("/api/scheduling", require("./routes/schedulingRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

module.exports = app;
