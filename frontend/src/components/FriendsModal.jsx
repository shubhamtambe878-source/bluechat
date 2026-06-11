import { useState, useEffect } from "react";
import { Search, X, UserPlus, Check, MessageCircle } from "lucide-react";
import useChatStore from "../store/chatStore";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function FriendsModal({ onChanged }) {
  const { showNewChat, setShowNewChat, setSelectedUser, setMessages } = useChatStore();
  const { authUser } = useAuth();
  const [tab, setTab] = useState("friends");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [sent, setSent] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!showNewChat) return;
    setTab("friends");
    setQuery("");
    setResults([]);
    setSent(new Set());
    (async () => {
      try {
        const { data } = await api.get("/friends/list");
        setFriends(data);
      } catch {}
    })();
  }, [showNewChat]);

  useEffect(() => {
    if (tab !== "add" || !query || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/friends/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, tab]);

  const sendRequest = async (username) => {
    try {
      await api.post("/friends/request", { username });
      setSent(new Set([...sent, username]));
      toast.success(`Friend request sent to @${username}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    }
  };

  const startChat = async (friend) => {
    setSelectedUser(friend);
    setShowNewChat(false);
    try {
      const { data } = await api.get(`/messages/${friend._id}`);
      setMessages(data.messages || []);
      onChanged?.();
    } catch {
      setMessages([]);
    }
  };

  const isFriend = (id) => friends.some((f) => f._id === id);

  if (!showNewChat) return null;

  return (
    <div className="modal-backdrop" onClick={() => setShowNewChat(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New chat</h3>
          <button className="icon-btn" onClick={() => setShowNewChat(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="composer-tabs">
          <button className={`tab ${tab === "friends" ? "active" : ""}`} onClick={() => setTab("friends")}>
            <MessageCircle size={14} /> My friends ({friends.length})
          </button>
          <button className={`tab ${tab === "add" ? "active" : ""}`} onClick={() => setTab("add")}>
            <UserPlus size={14} /> Add friend
          </button>
        </div>

        {tab === "add" && (
          <>
            <p className="modal-sub">Search by username or name. They'll receive a friend request.</p>
            <div className="search-wrapper modal-search">
              <Search size={16} className="search-icon" />
              <input
                autoFocus
                type="text"
                placeholder="@username or name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="search-results">
              {loading && <div className="empty-state-mini">Searching...</div>}
              {!loading && query.length >= 2 && results.length === 0 && (
                <div className="empty-state-mini">No users found</div>
              )}
              {results.map((u) => (
                <div key={u._id} className="user-list-item">
                  <img
                    src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=3b82f6&color=fff`}
                    alt={u.name}
                    className="avatar-sm"
                  />
                  <div className="user-info">
                    <p className="user-name">{u.name}</p>
                    <p className="user-handle">@{u.username}</p>
                  </div>
                  {isFriend(u._id) ? (
                    <button className="btn-add" onClick={() => startChat(u)}>
                      <MessageCircle size={14} /> Chat
                    </button>
                  ) : sent.has(u.username) ? (
                    <button className="btn-sent" disabled>
                      <Check size={14} /> Sent
                    </button>
                  ) : (
                    <button className="btn-add" onClick={() => sendRequest(u.username)}>
                      <UserPlus size={14} /> Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "friends" && (
          <div className="search-results">
            {friends.length === 0 ? (
              <div className="empty-state-mini">
                No friends yet. Switch to "Add friend" to find someone by username.
              </div>
            ) : (
              friends.map((f) => (
                <div key={f._id} className="user-list-item" onClick={() => startChat(f)} style={{ cursor: "pointer" }}>
                  <div className="avatar-wrapper">
                    <img
                      src={f.avatar || `https://ui-avatars.com/api/?name=${f.name}&background=3b82f6&color=fff`}
                      alt={f.name}
                      className="avatar-sm"
                    />
                    {f.isOnline && <span className="online-dot" />}
                  </div>
                  <div className="user-info">
                    <p className="user-name">{f.name}</p>
                    <p className="user-handle">@{f.username}</p>
                  </div>
                  <MessageCircle size={16} color="#3b82f6" />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
