import { useState, useRef } from "react";
import { X, ImageIcon, Type, Send } from "lucide-react";
import useChatStore from "../store/chatStore";
import api from "../utils/api";
import toast from "react-hot-toast";

const BG_OPTIONS = ["#3b82f6", "#2563eb", "#1e3a8a", "#7c3aed", "#ec4899", "#0ea5e9", "#14b8a6"];

export default function StatusComposer() {
  const { showStatusComposer, setShowStatusComposer, statuses, setStatuses } = useChatStore();
  const [text, setText] = useState("");
  const [bg, setBg] = useState(BG_OPTIONS[0]);
  const [mode, setMode] = useState("text");
  const [mediaUrl, setMediaUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  if (!showStatusComposer) return null;

  const close = () => {
    setShowStatusComposer(false);
    setText(""); setMediaUrl(null); setMode("text");
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/status/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMediaUrl(data.url);
      setMode("image");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const post = async () => {
    if (mode === "text" && !text.trim()) return toast.error("Add some text");
    if (mode === "image" && !mediaUrl) return toast.error("Add an image");
    try {
      const { data } = await api.post("/status", {
        text,
        mediaUrl,
        mediaType: mode === "image" ? "image" : "text",
        background: bg,
      });
      // Optimistically add to my group
      const mine = statuses.find((g) => g.isMe);
      if (mine) {
        mine.statuses.unshift(data);
        setStatuses([...statuses]);
      } else {
        setStatuses([{ isMe: true, user: data.user, statuses: [data], hasUnseen: false }, ...statuses]);
      }
      toast.success("Status posted! It will disappear in 24h");
      close();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    }
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal status-composer" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Post status</h3>
          <button className="icon-btn" onClick={close}><X size={18} /></button>
        </div>

        <div className="composer-tabs">
          <button className={`tab ${mode === "text" ? "active" : ""}`} onClick={() => setMode("text")}>
            <Type size={14} /> Text
          </button>
          <button className={`tab ${mode === "image" ? "active" : ""}`} onClick={() => fileRef.current?.click()}>
            <ImageIcon size={14} /> {uploading ? "Uploading..." : "Image"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        </div>

        <div className="status-preview" style={{ background: mode === "text" ? bg : "#000" }}>
          {mode === "image" && mediaUrl ? (
            <img src={mediaUrl} alt="status" className="status-preview-img" />
          ) : (
            <p className="status-preview-text">{text || "Type your status..."}</p>
          )}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={mode === "image" ? "Add a caption..." : "What's on your mind?"}
          className="composer-textarea"
          maxLength={300}
        />

        {mode === "text" && (
          <div className="bg-picker">
            {BG_OPTIONS.map((color) => (
              <div
                key={color}
                className={`bg-swatch ${bg === color ? "active" : ""}`}
                style={{ background: color }}
                onClick={() => setBg(color)}
              />
            ))}
          </div>
        )}

        <button className="btn-primary full" onClick={post}>
          <Send size={16} /> Post status
        </button>
      </div>
    </div>
  );
}
