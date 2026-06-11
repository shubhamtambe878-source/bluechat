import { useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ContactInfo from "../components/ContactInfo";
import StatusComposer from "../components/StatusComposer";
import StatusViewer from "../components/StatusViewer";
import useChatStore from "../store/chatStore";
import api from "../utils/api";

export default function Home() {
  const {
    selectedUser, setConversations, setArchivedConversations,
  } = useChatStore();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [active, archived] = await Promise.all([
          api.get("/users/conversations"),
          api.get("/users/conversations?archived=true"),
        ]);
        setConversations(Array.isArray(active.data) ? active.data : []);
        setArchivedConversations(Array.isArray(archived.data) ? archived.data : []);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
        setConversations([]);
        setArchivedConversations([]);
      }
    };
    fetchAll();
  }, [setConversations, setArchivedConversations]);

  return (
    <div className="home-layout">
      <aside className={`sidebar-panel ${selectedUser ? "hide-on-mobile-when-chat" : ""}`}>
        <Sidebar />
      </aside>

      <main className={`chat-panel ${selectedUser ? "chat-visible" : "chat-hidden-mobile"}`}>
        {selectedUser ? <ChatWindow /> : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">💬</div>
            <h3>Welcome to BlueChat</h3>
            <p>Select a chat from the sidebar, or add a friend to start a new conversation.</p>
          </div>
        )}
      </main>

      {selectedUser && (
        <aside className="info-panel desktop-only">
          <ContactInfo />
        </aside>
      )}

      <StatusComposer />
      <StatusViewer />
    </div>
  );
}
