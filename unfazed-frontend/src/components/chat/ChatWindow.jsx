
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import MessageBubble from "./MessageBubble";

const SOCKET_URL = "https://unfazed-ykl6.onrender.com";

function ChatWindow({
  clientId,
  clientName,
  role = "therapist",
  therapistName
}) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [typingRole, setTypingRole] = useState("");

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!clientId) return;

    const token = localStorage.getItem("unfazedToken");

    if (!token) {
      setError("Please log in again.");
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token }
    });

    socketRef.current = socket;
    setMessages([]);
    setError("");
    setTypingRole("");

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinClientRoom", clientId);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setTypingRole("");
    });

    socket.on("connect_error", (err) => {
      setConnected(false);
      setError(err.message || "Unable to connect to chat.");
    });

    socket.on("chatHistory", (history) => {
      setMessages(history);
    });

    socket.on("newMessage", (newMessage) => {
      setMessages((previous) => {
        if (previous.some((item) => item._id === newMessage._id)) {
          return previous;
        }

        return [...previous, newMessage];
      });
    });

    socket.on("messagesRead", ({ reader }) => {
      if (reader !== role) {
        setMessages((previous) =>
          previous.map((item) =>
            item.sender === role
              ? { ...item, read: true }
              : item
          )
        );
      }
    });

    socket.on("userTyping", ({ role: senderRole }) => {
      if (senderRole !== role) {
        setTypingRole(senderRole);
      }
    });

    socket.on("userStoppedTyping", ({ role: senderRole }) => {
      if (senderRole !== role) {
        setTypingRole("");
      }
    });

    socket.on("chatError", (errorMessage) => {
      setError(errorMessage);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [clientId, role]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingRole]);

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (!socketRef.current || !connected) return;

    if (value.trim()) {
      socketRef.current.emit("typing", clientId);
    } else {
      socketRef.current.emit("stopTyping", clientId);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!message.trim() || !connected) return;

    socketRef.current.emit("sendMessage", {
      clientId,
      content: message.trim()
    });

    socketRef.current.emit("stopTyping", clientId);
    setMessage("");
    setTypingRole("");
  };

  const handleInputBlur = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit("stopTyping", clientId);
    }
  };

  if (!clientId) {
    return (
      <p className="chat-empty-selection">
        Select a client to open their conversation.
      </p>
    );
  }

  const heading =
    role === "client"
      ? `Chat with ${therapistName || "Therapist"}`
      : `Chat with ${clientName || "Client"}`;

  return (
    <section className="chat-window">
      <div className="chat-window-header">
        <div>
          <h2>{heading}</h2>
          <p className={`chat-connection-status ${connected ? "is-connected" : ""}`}>
            <span className="chat-status-dot" />
            {connected ? "Connected" : "Connecting..."}
          </p>
        </div>
      </div>

      {error && (
        <p className="chat-error" role="alert">
          {error}
        </p>
      )}

      <div className="chat-messages-area">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <span className="chat-empty-icon">✉</span>
            <h3>No messages yet</h3>
            <p>Start the conversation by sending a message.</p>
          </div>
        ) : (
          messages.map((item) => (
            <div className="chat-message-row" key={item._id}>
              <MessageBubble
                message={item}
                currentUserRole={role}
              />

              {item.sender === role && item.read && (
                <small className="chat-seen-label">Seen</small>
              )}
            </div>
          ))
        )}

        {typingRole && (
          <p className="chat-typing-indicator">
            {typingRole === "client" ? "Client" : "Therapist"} is typing...
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      <form className="chat-message-form" onSubmit={handleSubmit}>
        <input
          className="chat-message-input"
          type="text"
          value={message}
          onChange={handleMessageChange}
          onBlur={handleInputBlur}
          placeholder="Type a message..."
          disabled={!connected}
        />

        <button
          className="chat-send-button"
          type="submit"
          disabled={!connected || !message.trim()}
        >
          Send
        </button>
      </form>
    </section>
  );
}

export default ChatWindow;
