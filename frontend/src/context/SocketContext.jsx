import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import useChatStore from "../store/chatStore";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { authUser } = useAuth();
  const {
    addMessage, replaceOptimisticMessage, updateMessageStatus,
    setUserOnline, setUserOffline, setTyping, markConversationRead,
    incomingRequests, setIncomingRequests,
  } = useChatStore();

  useEffect(() => {
    if (!authUser) return;

    const token = localStorage.getItem("token");
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => console.log("✅ Socket connected:", socket.id));
    socket.on("connect_error", (err) => console.error("Socket error:", err.message));

    socket.on("message:receive", (message) => {
      const state = useChatStore.getState();
      const senderId = message.sender._id || message.sender;
      if (state.selectedUser?._id === senderId) {
        addMessage(message);
        socket.emit("message:read", {
          conversationId: message.conversationId,
          senderId,
        });
      } else {
        toast(`💬 ${message.sender.name}: ${message.text?.slice(0, 40) || "(media)"}`, {
          icon: "📩",
        });
      }
    });

    socket.on("message:sent", ({ tempId, message }) => {
      replaceOptimisticMessage(tempId, message);
    });

    socket.on("message:status", ({ messageId, status }) => {
      updateMessageStatus(messageId, status);
    });

    socket.on("message:read", ({ readBy }) => {
      markConversationRead(readBy);
    });

    socket.on("user:online", ({ userId }) => setUserOnline(userId));
    socket.on("user:offline", ({ userId }) => setUserOffline(userId));

    socket.on("typing:start", ({ senderId }) => setTyping(senderId, true));
    socket.on("typing:stop", ({ senderId }) => setTyping(senderId, false));

    socket.on("friend:request", (req) => {
      const cur = useChatStore.getState().incomingRequests;
      setIncomingRequests([req, ...cur]);
      toast(`👋 ${req.sender.name} sent you a friend request`);
    });

    socket.on("friend:accepted", () => {
      toast.success("Your friend request was accepted!");
    });

    socket.on("error", (err) => {
      toast.error(err?.message || "Socket error");
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?._id]);

  return (
    <SocketContext.Provider value={{ socket: socketRef }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export { SocketContext };
