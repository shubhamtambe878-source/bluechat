import { useEffect } from "react";
import { Plus } from "lucide-react";
import useChatStore from "../store/chatStore";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function StatusRail() {
  const { statuses, setStatuses, setShowStatusComposer, setStatusViewer } = useChatStore();
  const { authUser } = useAuth();

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data } = await api.get("/status/feed");
        setStatuses(data);
      } catch {}
    };
    fetchFeed();
  }, [setStatuses]);

  const myGroup = statuses.find((g) => g.isMe);
  const others = statuses.filter((g) => !g.isMe);

  const openViewer = (group) => {
    setStatusViewer({ user: group.user, statuses: group.statuses, index: 0 });
  };

  return (
    <div className="status-rail">
      <div className="status-rail-scroll">
        <div className="status-item" onClick={() => myGroup ? openViewer(myGroup) : setShowStatusComposer(true)}>
          <div className={`status-ring ${myGroup ? "active" : ""}`}>
            <img
              src={authUser?.avatar || `https://ui-avatars.com/api/?name=${authUser?.name}&background=3b82f6&color=fff`}
              alt="me"
              className="status-avatar"
            />
            <button className="status-add" onClick={(e) => { e.stopPropagation(); setShowStatusComposer(true); }}>
              <Plus size={12} />
            </button>
          </div>
          <span className="status-label">My status</span>
        </div>

        {others.map((g) => (
          <div key={g.user._id} className="status-item" onClick={() => openViewer(g)}>
            <div className={`status-ring ${g.hasUnseen ? "unseen" : "seen"}`}>
              <img
                src={g.user.avatar || `https://ui-avatars.com/api/?name=${g.user.name}&background=3b82f6&color=fff`}
                alt={g.user.name}
                className="status-avatar"
              />
            </div>
            <span className="status-label">{g.user.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
