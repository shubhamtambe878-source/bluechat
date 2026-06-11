import { useState } from "react";
import { format } from "date-fns";
import { Check, CheckCheck, Reply, Trash2 } from "lucide-react";

export default function MessageBubble({ message, isOwn, onReply, onDelete }) {
  const [showActions, setShowActions] = useState(false);

  const renderStatus = () => {
    if (!isOwn) return null;
    if (message.status === "sending") return <span className="msg-status">🕐</span>;
    if (message.status === "sent") return <Check size={14} className="msg-status" />;
    if (message.status === "delivered") return <CheckCheck size={14} className="msg-status" />;
    if (message.status === "read") return <CheckCheck size={14} className="msg-status read" />;
    return null;
  };

  const renderContent = () => {
    if (message.isDeleted) {
      return <span className="deleted-msg">🚫 This message was deleted</span>;
    }
    if (message.mediaType === "gif") {
      return <img src={message.mediaUrl} alt="gif" className="msg-gif" />;
    }
    if (message.mediaType === "image") {
      return (
        <img
          src={message.mediaUrl}
          alt="shared"
          className="msg-image"
          onClick={() => window.open(message.mediaUrl, "_blank")}
        />
      );
    }
    if (message.mediaType === "video") {
      return <video src={message.mediaUrl} controls className="msg-video" />;
    }
    if (message.mediaType === "audio") {
      return <audio src={message.mediaUrl} controls className="msg-audio" />;
    }
    if (message.mediaType === "file") {
      return (
        <a href={message.mediaUrl} download={message.fileName} className="msg-file" target="_blank" rel="noreferrer">
          📄 {message.fileName || "Download file"}
        </a>
      );
    }
    return <p className="msg-text">{message.text}</p>;
  };

  return (
    <div
      className={`message-wrapper ${isOwn ? "own" : "other"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`message-bubble ${isOwn ? "bubble-own" : "bubble-other"} ${message.mediaType === "gif" || message.mediaType === "image" ? "bubble-media" : ""}`}>
        {message.replyTo && (
          <div className="reply-context">
            <span className="reply-sender">{message.replyTo.sender?.name || "Reply"}</span>
            <p className="reply-text">
              {message.replyTo.text?.substring(0, 60) || (message.replyTo.mediaType ? `[${message.replyTo.mediaType}]` : "")}
            </p>
          </div>
        )}

        {renderContent()}

        <div className="msg-meta">
          <span className="msg-time">
            {message.createdAt ? format(new Date(message.createdAt), "HH:mm") : ""}
          </span>
          {renderStatus()}
        </div>
      </div>

      {showActions && !message.isDeleted && (
        <div className="message-actions">
          <button className="action-btn" onClick={onReply} title="Reply">
            <Reply size={14} />
          </button>
          {isOwn && (
            <button className="action-btn" onClick={() => onDelete?.(message._id)} title="Delete">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
