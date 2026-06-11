import { MessageCircle, UserMinus, Archive, FileText, Film, Music, Image as ImageIcon } from "lucide-react";
import useChatStore from "../store/chatStore";
import api from "../utils/api";
import toast from "react-hot-toast";

export default function ContactInfo() {
  const { selectedUser, setSelectedUser, onlineUsers } = useChatStore();

  if (!selectedUser) return null;
  const isOnline = onlineUsers.has(selectedUser._id);

  const handleUnfriend = async () => {
    if (!window.confirm(`Remove ${selectedUser.name} from friends?`)) return;
    try {
      await api.delete(`/friends/${selectedUser._id}`);
      toast.success("Friend removed");
      setSelectedUser(null);
    } catch (err) {
      toast.error("Failed to remove friend");
    }
  };

  return (
    <div className="contact-info">
      <div className="contact-profile">
        <img
          src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.name}&background=3b82f6&color=fff&size=128`}
          alt={selectedUser.name}
          className="contact-avatar"
        />
        <h3 className="contact-name">{selectedUser.name}</h3>
        <p className="contact-handle">@{selectedUser.username}</p>
        {selectedUser.bio && <p className="contact-bio">{selectedUser.bio}</p>}
        {isOnline ? (
          <span className="online-badge">● Online</span>
        ) : (
          <span className="offline-badge">● Offline</span>
        )}
      </div>

      <div className="contact-actions">
        <div className="contact-action-btn">
          <MessageCircle size={20} />
          <span>Chat</span>
        </div>
        <div className="contact-action-btn" onClick={handleUnfriend}>
          <UserMinus size={20} />
          <span>Unfriend</span>
        </div>
      </div>

      <div className="attachments-section">
        <h4>Attachments & media</h4>
        <div className="attachment-types">
          <div className="attachment-type image"><ImageIcon size={20} /><span>Photos</span></div>
          <div className="attachment-type video"><Film size={20} /><span>Videos</span></div>
          <div className="attachment-type mp3"><Music size={20} /><span>Audio</span></div>
          <div className="attachment-type pdf"><FileText size={20} /><span>Docs</span></div>
        </div>
      </div>
    </div>
  );
}
