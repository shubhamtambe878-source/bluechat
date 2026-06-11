import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Search, Paperclip, Smile, Mic, Send,
  Image as ImageIcon, Sparkles, MoreVertical, Archive, X,
} from "lucide-react";
import useChatStore from "../store/chatStore";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import GifPicker from "./GifPicker";
import api from "../utils/api";
import { v4 as uuidv4 } from "uuid";
import EmojiPicker from "emoji-picker-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

export default function ChatWindow() {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const { authUser } = useAuth();
  const { socket } = useSocket();
  const {
    selectedUser, messages, addMessage, setSelectedUser,
    typingUsers, toggleMobileSidebar, onlineUsers,
    setMessages,
  } = useChatStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers[selectedUser?._id]]);

  // Close pickers on outside selection change
  useEffect(() => {
    setShowEmoji(false);
    setShowGif(false);
    setReplyTo(null);
  }, [selectedUser?._id]);

  const handleTyping = (e) => {
    setText(e.target.value);
    socket.current?.emit("typing:start", { receiverId: selectedUser._id });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.current?.emit("typing:stop", { receiverId: selectedUser._id });
    }, 1500);
  };

  const emitMessage = (payload) => {
    const tempId = uuidv4();
    const optimistic = {
      _id: tempId,
      sender: { _id: authUser._id, name: authUser.name, avatar: authUser.avatar },
      ...payload,
      status: "sending",
      createdAt: new Date().toISOString(),
      replyTo,
    };
    addMessage(optimistic);
    socket.current?.emit("message:send", {
      receiverId: selectedUser._id,
      ...payload,
      replyTo: replyTo?._id,
      tempId,
    });
    setText("");
    setReplyTo(null);
    socket.current?.emit("typing:stop", { receiverId: selectedUser._id });
  };

  const sendMessage = useCallback(() => {
    if (!text.trim()) return;
    emitMessage({ text });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, selectedUser, authUser, replyTo]);

  const sendGif = (gifUrl) => {
    emitMessage({ mediaUrl: gifUrl, mediaType: "gif" });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post(`/messages/upload`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      emitMessage({
        mediaUrl: data.url,
        mediaType: data.type,
        fileName: file.name,
      });
    } catch (err) {
      toast.error("Upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleArchive = async () => {
    try {
      // Find conversation containing selectedUser
      const { data: convs } = await api.get("/users/conversations");
      const conv = convs.find((c) => c.participants.some((p) => p._id === selectedUser._id));
      if (!conv) return toast.error("No conversation yet");
      await api.put(`/users/archive/${conv._id}`);
      toast.success("Conversation archived");
      setSelectedUser(null);
      setShowMenu(false);
    } catch (err) {
      toast.error("Failed to archive");
    }
  };

  const isOnline = onlineUsers.has(selectedUser._id);
  const isTyping = typingUsers[selectedUser._id];

  return (
    <div className="chat-window">
      <div className="chat-header">
        <button className="icon-btn mobile-only" onClick={() => setSelectedUser(null)}>
          <ArrowLeft size={20} />
        </button>
        <div className="chat-header-user">
          <div className="avatar-wrapper">
            <img
              src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.name}&background=3b82f6&color=fff`}
              alt={selectedUser.name}
              className="avatar-md"
            />
            {isOnline && <span className="online-dot" />}
          </div>
          <div>
            <p className="chat-header-name">{selectedUser.name}</p>
            <p className="chat-header-status">
              {isTyping ? "typing..." :
                isOnline ? "Online" :
                selectedUser.lastSeen ?
                  `last seen ${formatDistanceToNow(new Date(selectedUser.lastSeen), { addSuffix: true })}` :
                  "Offline"}
            </p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn"><Search size={18} /></button>
          <div className="menu-wrapper">
            <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}>
              <MoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="menu-dropdown">
                <button onClick={handleArchive}>
                  <Archive size={14} /> Archive chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-emoji">👋</div>
            <p>Say hi to {selectedUser.name}!</p>
          </div>
        ) : messages.map((msg, i) => (
          <MessageBubble
            key={msg._id || i}
            message={msg}
            isOwn={(msg.sender?._id || msg.sender) === authUser._id}
            onReply={() => setReplyTo(msg)}
            onDelete={async (id) => {
              try {
                await api.delete(`/messages/${id}`);
                setMessages(messages.map((m) => m._id === id ? { ...m, isDeleted: true, text: "This message was deleted" } : m));
              } catch {}
            }}
          />
        ))}
        {isTyping && <TypingIndicator user={selectedUser} />}
        <div ref={messagesEndRef} />
      </div>

      {replyTo && (
        <div className="reply-preview">
          <div className="reply-content">
            <span className="reply-label">↩ Replying to {replyTo.sender?.name || "yourself"}</span>
            <p className="reply-text">
              {replyTo.text?.substring(0, 80) || (replyTo.mediaType ? `[${replyTo.mediaType}]` : "")}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} className="icon-btn"><X size={16} /></button>
        </div>
      )}

      <div className="chat-input-area">
        {showEmoji && (
          <div className="picker-wrapper">
            <EmojiPicker
              onEmojiClick={(e) => setText((prev) => prev + e.emoji)}
              theme="light"
              height={350}
              width={320}
            />
          </div>
        )}
        {showGif && (
          <div className="picker-wrapper">
            <GifPicker
              onSelect={sendGif}
              onClose={() => setShowGif(false)}
            />
          </div>
        )}

        <div className="chat-input-bar">
          <button className="icon-btn" onClick={() => { setShowEmoji(!showEmoji); setShowGif(false); }}>
            <Smile size={20} />
          </button>
          <button className="icon-btn" onClick={() => { setShowGif(!showGif); setShowEmoji(false); }} title="GIFs">
            <Sparkles size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: "none" }}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
          />
          <button className="icon-btn" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? <span className="spinner-mini" /> : <Paperclip size={20} />}
          </button>
          <input
            type="text"
            value={text}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="message-input"
          />
          <button
            className={`send-btn ${text.trim() ? "active" : ""}`}
            onClick={sendMessage}
            disabled={!text.trim()}
          >
            {text.trim() ? <Send size={18} /> : <Mic size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
