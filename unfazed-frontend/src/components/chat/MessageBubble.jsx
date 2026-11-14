
function MessageBubble({ message, currentUserRole = "therapist" }) {
  const isOwnMessage = message?.sender === currentUserRole;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
        margin: "10px 0"
      }}
    >
      <div
        style={{
          maxWidth: "75%",
          padding: "12px 16px",
          borderRadius: "12px",
          background: isOwnMessage ? "#e8e4ff" : "#f1f1f1"
        }}
      >
        <p style={{ margin: "0 0 6px", fontWeight: "600" }}>
          {isOwnMessage
            ? "You"
            : currentUserRole === "therapist"
              ? "Client"
              : "Therapist"}
        </p>

        <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>
          {message?.content}
        </p>

        <small>
          {message?.createdAt
            ? new Date(message.createdAt).toLocaleString()
            : ""}
        </small>
      </div>
    </div>
  );
}

export default MessageBubble;
