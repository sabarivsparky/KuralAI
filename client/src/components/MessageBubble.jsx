const MessageBubble = ({ message, sender, image, note }) => {
  const isUser = sender === "user";

  return (
    <div className={`message-row ${isUser ? "user-row" : "ai-row"}`}>
      <div className={`message-bubble ${isUser ? "user-bubble" : "ai-bubble"}`}>
        {image && <img className="bubble-image" src={image} alt="" />}
        {message && <div style={{ whiteSpace: "pre-line" }}>{message}</div>}
        {note && <small className="bubble-note">{note}</small>}
      </div>
    </div>
  );
};

export default MessageBubble;