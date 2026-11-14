const Notification = require("../models/Notification");

// Create one in-app notification
const sendNotification = async ({
  recipient,
  recipientModel,
  title,
  message,
  event = "general",
  link = ""
}) => {
  if (!recipient || !recipientModel) {
    return {
      success: false,
      message: "Notification recipient is missing"
    };
  }

  const notification = await Notification.create({
    recipient,
    recipientModel,
    title,
    message,
    event,
    link
  });

  return {
    success: true,
    channel: "in-app",
    notification
  };
};

// Send the same event to the therapist and client
const sendToBoth = async ({
  therapistId,
  clientAccountId,
  therapistTitle,
  therapistMessage,
  clientTitle,
  clientMessage,
  event,
  therapistLink = "/dashboard",
  clientLink = "/client-portal"
}) => {
  const notifications = [];

  if (therapistId) {
    notifications.push(
      sendNotification({
        recipient: therapistId,
        recipientModel: "Therapist",
        title: therapistTitle,
        message: therapistMessage,
        event,
        link: therapistLink
      })
    );
  }

  if (clientAccountId) {
    notifications.push(
      sendNotification({
        recipient: clientAccountId,
        recipientModel: "ClientAccount",
        title: clientTitle,
        message: clientMessage,
        event,
        link: clientLink
      })
    );
  }

  if (notifications.length === 0) {
    return {
      success: false,
      message: "No valid notification recipients were provided"
    };
  }

  return Promise.all(notifications);
};

// Booking confirmation for both sides
const bookingConfirmation = async ({
  therapistId,
  clientAccountId,
  clientName = "A client",
  therapistName = "your therapist"
}) => {
  return sendToBoth({
    therapistId,
    clientAccountId,
    therapistTitle: "New Appointment",
    therapistMessage: `${clientName} has booked an appointment with you.`,
    clientTitle: "Booking Confirmed",
    clientMessage: `Your appointment with ${therapistName} has been confirmed.`,
    event: "booking_confirmation"
  });
};

// Session reminder for both sides
const sessionReminder = async ({
  therapistId,
  clientAccountId,
  clientName = "Your client",
  therapistName = "your therapist"
}) => {
  return sendToBoth({
    therapistId,
    clientAccountId,
    therapistTitle: "Upcoming Session",
    therapistMessage: `You have an upcoming session with ${clientName}.`,
    clientTitle: "Session Reminder",
    clientMessage: `You have an upcoming session with ${therapistName}.`,
    event: "session_reminder"
  });
};

// Follow-up after a session is completed
const postSessionFollowUp = async ({
  therapistId,
  clientAccountId,
  clientName = "Your client",
  therapistName = "your therapist"
}) => {
  return sendToBoth({
    therapistId,
    clientAccountId,
    therapistTitle: "Session Completed",
    therapistMessage: `The session with ${clientName} has been marked as completed.`,
    clientTitle: "Session Completed",
    clientMessage: `Your session with ${therapistName} has been marked as completed.`,
    event: "post_session_followup"
  });
};

module.exports = {
  sendNotification,
  bookingConfirmation,
  sessionReminder,
  postSessionFollowUp
};