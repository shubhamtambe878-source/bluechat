import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import useChatStore from "../store/chatStore";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import api from "../utils/api";

export default function StatusViewer() {
  const { statusViewer, setStatusViewer, statuses, setStatuses } = useChatStore();
  const { authUser } = useAuth();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!statusViewer) return;
    setProgress(0);
    const status = statusViewer.statuses[statusViewer.index];
    if (status && status.user._id !== authUser._id) {
      api.post(`/status/${status._id}/view`).catch(() => {});
    }
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          next();
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusViewer?.index, statusViewer?.user?._id]);

  if (!statusViewer) return null;

  const status = statusViewer.statuses[statusViewer.index];

  const next = () => {
    if (statusViewer.index + 1 < statusViewer.statuses.length) {
      setStatusViewer({ ...statusViewer, index: statusViewer.index + 1 });
    } else {
      setStatusViewer(null);
    }
  };
  const prev = () => {
    if (statusViewer.index > 0) {
      setStatusViewer({ ...statusViewer, index: statusViewer.index - 1 });
    }
  };
  const close = () => setStatusViewer(null);

  const deleteStatus = async () => {
    try {
      await api.delete(`/status/${status._id}`);
      const remaining = statusViewer.statuses.filter((s) => s._id !== status._id);
      if (remaining.length === 0) {
        setStatuses(statuses.filter((g) => g.user._id !== statusViewer.user._id));
        close();
      } else {
        setStatusViewer({ ...statusViewer, statuses: remaining, index: Math.max(0, statusViewer.index - 1) });
      }
    } catch {}
  };

  const isMine = status.user._id === authUser._id;

  return (
    <div className="status-viewer-backdrop" onClick={close}>
      <div className="status-viewer" onClick={(e) => e.stopPropagation()}>
        <div className="status-progress-bar">
          {statusViewer.statuses.map((_, i) => (
            <div key={i} className="progress-segment">
              <div className="progress-fill" style={{
                width: i < statusViewer.index ? "100%" : i === statusViewer.index ? `${progress}%` : "0%",
              }} />
            </div>
          ))}
        </div>

        <div className="status-viewer-header">
          <img
            src={status.user.avatar || `https://ui-avatars.com/api/?name=${status.user.name}&background=3b82f6&color=fff`}
            alt={status.user.name}
            className="avatar-sm"
          />
          <div>
            <p className="user-name light">{status.user.name}</p>
            <p className="user-handle light">
              {formatDistanceToNow(new Date(status.createdAt), { addSuffix: true })}
            </p>
          </div>
          {isMine && (
            <button className="icon-btn light" onClick={deleteStatus}>
              <Trash2 size={18} />
            </button>
          )}
          <button className="icon-btn light" onClick={close}>
            <X size={20} />
          </button>
        </div>

        <div className="status-viewer-content" style={{ background: status.mediaType === "image" ? "#000" : status.background }}>
          {status.mediaType === "image" ? (
            <img src={status.mediaUrl} alt="status" className="status-image" />
          ) : (
            <p className="status-viewer-text">{status.text}</p>
          )}
          {status.mediaType === "image" && status.text && (
            <p className="status-caption">{status.text}</p>
          )}
        </div>

        <button className="status-nav left" onClick={prev}><ChevronLeft size={28} /></button>
        <button className="status-nav right" onClick={next}><ChevronRight size={28} /></button>

        {isMine && status.viewers?.length > 0 && (
          <div className="status-viewers">
            👁️ {status.viewers.length} viewed
          </div>
        )}
      </div>
    </div>
  );
}
