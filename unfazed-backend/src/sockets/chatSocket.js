
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const Message = require("../models/Message");
const Client = require("../models/Client");
const ClientAccount = require("../models/Client").ClientAccount;
const Therapist = require("../models/Therapist");

const {
  sendNotification
} = require("../services/notificationService");

const initializeChat = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });
  

  // Authenticate therapists and clients
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role === "client") {
        const account = await ClientAccount.findById(decoded.id);

        if (!account) {
          return next(new Error("Client account not found"));
        }

        socket.userRole = "client";
        socket.clientAccountId = account._id.toString();
      } else {
        socket.userRole = "therapist";
        socket.therapistId = decoded.id;
      }

      next();
    } catch (error) {
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`${socket.userRole} connected`);

    // Join a therapist-client conversation
    socket.on("joinClientRoom", async (clientId) => {
      try {
        let client;
        let therapistId;

        if (socket.userRole === "therapist") {
          client = await Client.findOne({
            _id: clientId,
            therapist: socket.therapistId
          });

          therapistId = socket.therapistId;
        } else {
          client = await Client.findOne({
            _id: clientId,
            account: socket.clientAccountId,
            status: "active"
          });

          if (client) {
            therapistId = client.therapist.toString();
          }
        }

        if (!client) {
          return socket.emit("chatError", "Client not found or access denied");
        }

        const room = `${therapistId}_${clientId}`;

        // Leave previous conversation rooms
        for (const joinedRoom of [...socket.rooms]) {
          if (joinedRoom !== socket.id) {
            socket.leave(joinedRoom);
          }
        }

        socket.join(room);

        const messages = await Message.find({
          therapist: therapistId,
          client: clientId
        })
          .sort({ createdAt: 1 })
          .limit(100);

        // Mark messages from the other participant as read
        const senderToMarkRead =
          socket.userRole === "therapist" ? "client" : "therapist";

        await Message.updateMany(
          {
            therapist: therapistId,
            client: clientId,
            sender: senderToMarkRead,
            read: false
          },
          { $set: { read: true } }
        );

        socket.to(room).emit("messagesRead", {
  clientId,
  reader: socket.userRole
});

        socket.emit("chatHistory", messages);
        socket.emit("joinedRoom", { clientId });

      } catch (error) {
        console.error("Chat room error:", error.message);
        socket.emit("chatError", "Unable to load conversation");
      }
    });

    // Send a message
    socket.on("sendMessage", async (data) => {
      try {
        const { clientId, content } = data || {};

        if (
          !clientId ||
          typeof content !== "string" ||
          !content.trim() ||
          content.trim().length > 5000
        ) {
          return socket.emit(
            "chatError",
            "A valid message is required (maximum 5000 characters)"
          );
        }

        let client;
        let therapistId;

        if (socket.userRole === "therapist") {
          client = await Client.findOne({
            _id: clientId,
            therapist: socket.therapistId
          });

          therapistId = socket.therapistId;
        } else {
          client = await Client.findOne({
            _id: clientId,
            account: socket.clientAccountId,
            status: "active"
          });

          if (client) {
            therapistId = client.therapist.toString();
          }
        }

        if (!client) {
          return socket.emit("chatError", "Client not found or access denied");
        }

        const room = `${therapistId}_${clientId}`;

        if (!socket.rooms.has(room)) {
          return socket.emit(
            "chatError",
            "Join the conversation first"
          );
        }

        const message = await Message.create({
          therapist: therapistId,
          client: clientId,
          sender: socket.userRole,
          content: content.trim()
        });

        io.to(room).emit("newMessage", message);
        // Notify the other participant about the new message
// Notify the other participant using in-app notifications
try {
  if (socket.userRole === "therapist") {
    // Therapist sent a message, so notify the client
    if (client.account) {
      await sendNotification({
        recipient: client.account,
        recipientModel: "ClientAccount",
        title: "New Message",
        message: "Your therapist has sent you a new message.",
        event: "new_chat_message",
        link: "/client-portal"
      });
    }
  } else {
    // Client sent a message, so notify the therapist
    await sendNotification({
      recipient: therapistId,
      recipientModel: "Therapist",
      title: "New Message",
      message: "Your client has sent you a new message.",
      event: "new_chat_message",
      link: "/dashboard"
    });
  }
} catch (notificationError) {
  console.error(
    "Chat notification failed:",
    notificationError.message
  );
}

      } catch (error) {
        console.error("Message error:", error.message);
        socket.emit("chatError", "Message could not be sent");
      }
    });

        // Typing indicators
    socket.on("typing", async (clientId) => {
      try {
        let client;
        let therapistId;

        if (socket.userRole === "therapist") {
          client = await Client.findOne({
            _id: clientId,
            therapist: socket.therapistId
          });

          therapistId = socket.therapistId;
        } else {
          client = await Client.findOne({
            _id: clientId,
            account: socket.clientAccountId,
            status: "active"
          });

          if (client) {
            therapistId = client.therapist.toString();
          }
        }

        if (!client) return;

        const room = `${therapistId}_${clientId}`;

        if (socket.rooms.has(room)) {
          socket.to(room).emit("userTyping", {
            clientId,
            role: socket.userRole
          });
        }
      } catch (error) {
        console.error("Typing indicator error:", error.message);
      }
    });

    socket.on("stopTyping", async (clientId) => {
      try {
        let client;
        let therapistId;

        if (socket.userRole === "therapist") {
          client = await Client.findOne({
            _id: clientId,
            therapist: socket.therapistId
          });

          therapistId = socket.therapistId;
        } else {
          client = await Client.findOne({
            _id: clientId,
            account: socket.clientAccountId,
            status: "active"
          });

          if (client) {
            therapistId = client.therapist.toString();
          }
        }

        if (!client) return;

        const room = `${therapistId}_${clientId}`;

        if (socket.rooms.has(room)) {
          socket.to(room).emit("userStoppedTyping", {
            clientId,
            role: socket.userRole
          });
        }
      } catch (error) {
        console.error("Stop typing error:", error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`${socket.userRole} disconnected`);
    });
  });

  return io;
};

module.exports = initializeChat;
