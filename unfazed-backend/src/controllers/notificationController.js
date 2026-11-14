
const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// Identify the authenticated user
function getRecipient(req) {
  if (req.therapist?._id) {
    return {
      recipient: req.therapist._id,
      recipientModel: "Therapist"
    };
  }

  if (req.clientAccount?._id) {
    return {
      recipient: req.clientAccount._id,
      recipientModel: "ClientAccount"
    };
  }

  return null;
}

// Get notifications for the logged-in user
exports.getNotifications = async (req, res) => {
  try {
    const user = getRecipient(req);

    if (!user) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    const notifications = await Notification.find(user)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      ...user,
      isRead: false
    });

    return res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      message: "Unable to fetch notifications"
    });
  }
};

// Mark one notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const user = getRecipient(req);
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid notification ID"
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        ...user
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      },
      {
        new: true
      }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    return res.json({
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    return res.status(500).json({
      message: "Unable to update notification"
    });
  }
};

// Mark all notifications as read
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const user = getRecipient(req);

    if (!user) {
      return res.status(401).json({
        message: "Authentication required",
        therapistFound: Boolean(req.therapist),
        clientFound: Boolean(req.clientAccount)
      });
    }

    const result = await Notification.updateMany(
      {
        ...user,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    console.log("Mark all notifications result:", {
      user,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

    return res.status(200).json({
      message: "All notifications marked as read",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Mark all notifications read error:", error);

    return res.status(500).json({
      message: "Unable to update notifications",
      error: error.message
    });
  }
};