import { useState, useEffect } from "react";
import { Search, UserPlus, LogOut, Archive, MessageSquare, Bell, Settings } from "lucide-react";
import useChatStore from "../store/chatStore";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { format } from "date-fns";
import StatusRail from "./StatusRail";
import FriendsModal from "./FriendsModal";

export default function Sidebar() {
  const [search, setSearch] = useState("");
  const { authUser, logout } = useAuth();
  const {
    conversations, archivedConversations, selectedUser, setSelectedUser,
    setMessages, onlineUsers, view, setView,
    setShowNewChat, incomingRequests, setIncomingRequests,
    setConversations, setArchivedConversations,
  } = useChatStore();

  const reloadConversations = async () => {
    try {
      const [active, arch] = await Promise.all([
        api.get("/users/conversations"),
        api.get("/users/conversations?archived=true"),
      ]);
      setConversations(Array.isArray(active.data) ? active.data : []);
      setArchivedConversations(Array.isArray(arch.data) ? arch.data : []);
    } catch (err) {
      console.error("Failed to reload conversations:", err);
    }
  };

  useEffect(() => {
    const fetchIncoming = async () => {
      try {
        const { data } = await api.get("/friends/requests/incoming");
        setIncomingRequests(data);
      } catch {}
    };
    fetchIncoming();
  }, [setIncomingRequests]);

  const list = view === "archived" ? archivedConversations : conversations;
  const filtered = (Array.isArray(list) ? list : []).filter((c) => {
    const other = c.participants.find((p) => p._id !== authUser._id);
    return other?.name?.toLowerCase().includes(search.toLowerCase())
      || other?.username?.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = async (otherUser) => {
    setSelectedUser(otherUser);
    try {
      const { data } = await api.get(`/messages/${otherUser._id}`);
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setMessages([]);
    }
  };

  const handleArchiveToggle = async (e, conv) => {
    e.stopPropagation();
    try {
      await api.put(`/users/archive/${conv._id}`);
      await reloadConversations();
    } catch {}
  };

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-user">
          <img
            src={authUser?.avatar || `https://ui-avatars.com/api/?name=${authUser?.name}&background=3b82f6&color=fff`}
            alt="me"
            className="avatar-sm"
          />
          <div className="user-meta">
            <p className="user-name">{authUser?.name}</p>
            <p className="user-handle">@{authUser?.username}</p>
          </div>
        </div>
        <div className="sidebar-actions">
          <button onClick={() => setShowNewChat(true)} className="icon-btn" title="Find friends / New chat">
            <UserPlus size={18} />
          </button>
          <button onClick={() => setView("requests")} className="icon-btn icon-btn-badge" title="Friend requests">
            <Bell size={18} />
            {incomingRequests.length > 0 && (
              <span className="notif-dot">{incomingRequests.length}</span>
            )}
          </button>
          <button onClick={logout} className="icon-btn" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <StatusRail />

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button className={`tab ${view === "chats" ? "active" : ""}`} onClick={() => setView("chats")}>
          <MessageSquare size={14} /> Chats
        </button>
        <button className={`tab ${view === "archived" ? "active" : ""}`} onClick={() => { setView("archived"); reloadConversations(); }}>
          <Archive size={14} /> Archived
        </button>
        <button className={`tab ${view === "requests" ? "active" : ""}`} onClick={() => setView("requests")}>
          <Bell size={14} /> Requests
          {incomingRequests.length > 0 && <span className="tab-badge">{incomingRequests.length}</span>}
        </button>
      </div>

      {/* Search */}
      {view !== "requests" && (
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={view === "archived" ? "Search archived..." : "Search chats..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      )}

      {/* Lists */}
      <div className="conversation-list">
        {view === "requests" ? (
          <RequestsList onChanged={reloadConversations} />
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p className="empty-emoji">{view === "archived" ? "📦" : "💬"}</p>
            <p>{view === "archived" ? "No archived chats" : "No conversations yet"}</p>
            {view === "chats" && (
              <button onClick={() => setShowNewChat(true)} className="btn-secondary mini">
                Find a friend
              </button>
            )}
          </div>
        ) : (
          filtered.map((conv) => {
            const other = conv.participants.find((p) => p._id !== authUser._id);
            if (!other) return null;
            const isSelected = selectedUser?._id === other._id;
            const unread = conv.unreadCount?.[authUser._id] || 0;
            const last = conv.lastMessage;
            return (
              <div
                key={conv._id}
                className={`conversation-item ${isSelected ? "active" : ""}`}
                onClick={() => handleSelect(other)}
              >
                <div className="avatar-wrapper">
                  <img
                    src={other.avatar || `https://ui-avatars.com/api/?name=${other.name}&background=3b82f6&color=fff`}
                    alt={other.name}
                    className="avatar-md"
                  />
                  {onlineUsers.has(other._id) && <span className="online-dot" />}
                </div>
                <div className="conversation-info">
                  <div className="conversation-top">
                    <span className="conversation-name">{other.name}</span>
                    <span className="conversation-time">
                      {last?.createdAt ? format(new Date(last.createdAt), "HH:mm") : ""}
                    </span>
                  </div>
                  <div className="conversation-bottom">
                    <span className="conversation-preview">
                      {last?.isDeleted ? "🚫 Message deleted"
                        : last?.mediaType === "image" ? "📷 Photo"
                        : last?.mediaType === "video" ? "🎬 Video"
                        : last?.mediaType === "audio" ? "🎵 Audio"
                        : last?.mediaType === "gif" ? "🎞️ GIF"
                        : last?.mediaType === "file" ? `📄 ${last.fileName || "File"}`
                        : last?.text?.substring(0, 35) || "Start chatting..."}
                    </span>
                    {unread > 0 && <span className="unread-badge">{unread}</span>}
                  </div>
                </div>
                <button
                  className="conv-archive-btn"
                  onClick={(e) => handleArchiveToggle(e, conv)}
                  title={view === "archived" ? "Unarchive" : "Archive"}
                >
                  <Archive size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <FriendsModal onChanged={reloadConversations} />
    </div>
  );
}

function RequestsList({ onChanged }) {
  const { incomingRequests, setIncomingRequests, outgoingRequests, setOutgoingRequests } = useChatStore();

  useEffect(() => {
    (async () => {
      try {
        const out = await api.get("/friends/requests/outgoing");
        setOutgoingRequests(out.data);
      } catch {}
    })();
  }, [setOutgoingRequests]);

  const respond = async (id, action) => {
    try {
      await api.put(`/friends/requests/${id}`, { action });
      setIncomingRequests(incomingRequests.filter((r) => r._id !== id));
      if (action === "accept") onChanged?.();
    } catch {}
  };

  return (
    <div className="requests-list">
      <p className="dropdown-title">Incoming requests</p>
      {incomingRequests.length === 0 ? (
        <div className="empty-state-mini">No incoming requests</div>
      ) : (
        incomingRequests.map((r) => (
          <div key={r._id} className="request-item">
            <img
              src={r.sender?.avatar || `https://ui-avatars.com/api/?name=${r.sender?.name}&background=3b82f6&color=fff`}
              alt={r.sender?.name}
              className="avatar-sm"
            />
            <div className="request-info">
              <p className="user-name">{r.sender?.name}</p>
              <p className="user-handle">@{r.sender?.username}</p>
            </div>
            <div className="request-actions">
              <button className="btn-accept" onClick={() => respond(r._id, "accept")}>Accept</button>
              <button className="btn-reject" onClick={() => respond(r._id, "reject")}>Reject</button>
            </div>
          </div>
        ))
      )}
      <p className="dropdown-title mt">Sent requests</p>
      {outgoingRequests.length === 0 ? (
        <div className="empty-state-mini">None pending</div>
      ) : (
        outgoingRequests.map((r) => (
          <div key={r._id} className="request-item">
            <img
              src={r.receiver?.avatar || `https://ui-avatars.com/api/?name=${r.receiver?.name}&background=3b82f6&color=fff`}
              alt={r.receiver?.name}
              className="avatar-sm"
            />
            <div className="request-info">
              <p className="user-name">{r.receiver?.name}</p>
              <p className="user-handle">@{r.receiver?.username}</p>
            </div>
            <span className="pending-tag">Pending</span>
          </div>
        ))
      )}
    </div>
  );
}
