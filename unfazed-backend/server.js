
const express = require("express");
const cors = require("cors");
const http = require("http");
require("dotenv").config();

const connectDB = require("./src/config/db");
const initializeChat = require("./src/sockets/chatSocket");
const { razorpayWebhook } = require("./src/controllers/paymentController");
const Session = require("./src/models/Session");

const {
  sessionReminder
} = require("./src/services/notificationService");
const app = express();


let reminderCheckRunning = false;

const checkSessionReminders = async () => {
  if (reminderCheckRunning) return;

  reminderCheckRunning = true;

  try {
    const now = new Date();

    // Include sessions from yesterday onwards
    const yesterday = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - 1
      )
    );

    const sessions = await Session.find({
      status: "confirmed",
      reminderSentAt: null,
      date: { $gte: yesterday }
    }).select("clientName clientEmail date startTime");

    for (const session of sessions) {
      const dateString = session.date.toISOString().slice(0, 10);

      // Session dates and times use Indian Standard Time
      const sessionStart = new Date(
        `${dateString}T${session.startTime}:00+05:30`
      );

      const reminderTime = new Date(
        sessionStart.getTime() - 24 * 60 * 60 * 1000
      );

      // Send once the 24-hour reminder time has arrived
      if (now >= reminderTime && now < sessionStart) {
        const result = await sessionReminder({
          name: session.clientName,
          email: session.clientEmail
        });

        if (result.success) {
          await Session.updateOne(
            {
              _id: session._id,
              reminderSentAt: null
            },
            {
              $set: { reminderSentAt: new Date() }
            }
          );
        }
      }
    }
  } catch (error) {
    console.error("Session reminder error:", error.message);
  } finally {
    reminderCheckRunning = false;
  }
};


// Webhook must come before express.json()
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  razorpayWebhook
);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/therapists", require("./src/routes/therapistRoutes"));
app.use("/api/scheduling", require("./src/routes/schedulingRoutes"));
app.use("/api/clients", require("./src/routes/clientRoutes"));
app.use("/api/payments", require("./src/routes/paymentRoutes"));
app.use("/api/notes", require("./src/routes/noteRoutes"));
app.use("/api/analytics", require("./src/routes/analyticsRoutes"));
const errorHandler = require("./src/middleware/errorHandler");
app.use("/api/leads", require("./src/routes/leadRoutes"));
app.use("/api/subscriptions", require("./src/routes/subscriptionRoutes"));
app.use(errorHandler);

// Test route
app.get("/", (req, res) => {
  res.send("Unfazed API is running");
});

// Create HTTP server and initialize Socket.io
const server = http.createServer(app);
const io = initializeChat(server);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

   server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Socket.io chat server initialized");

  // Check reminders immediately and every minute
  checkSessionReminders();

  setInterval(checkSessionReminders, 60 * 1000);

  console.log("Session reminder scheduler initialized");
});
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
