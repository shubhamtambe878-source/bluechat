import { create } from "zustand";

const useChatStore = create((set, get) => ({
  // Friends + conversations
  friends: [],
  conversations: [],
  archivedConversations: [],
  setFriends: (friends) => set({ friends }),
  setConversations: (conversations) => set({ conversations }),
  setArchivedConversations: (archivedConversations) => set({ archivedConversations }),

  // Friend requests
  incomingRequests: [],
  outgoingRequests: [],
  setIncomingRequests: (incomingRequests) => set({ incomingRequests }),
  setOutgoingRequests: (outgoingRequests) => set({ outgoingRequests }),

  // Statuses
  statuses: [],
  setStatuses: (statuses) => set({ statuses }),

  // Active chat
  selectedUser: null,
  setSelectedUser: (user) => set({ selectedUser: user, messages: [] }),

  // Messages
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => {
    if (state.messages.some((m) => m._id === message._id)) return state;
    return { messages: [...state.messages, message] };
  }),
  updateMessageStatus: (messageId, status) => set((state) => ({
    messages: state.messages.map((m) =>
      m._id === messageId ? { ...m, status } : m
    ),
  })),
  markConversationRead: (senderId) => set((state) => ({
    messages: state.messages.map((m) =>
      (m.sender?._id === senderId || m.sender === senderId) ? { ...m, status: "read" } : m
    ),
  })),
  replaceOptimisticMessage: (tempId, realMessage) => set((state) => ({
    messages: state.messages.map((m) =>
      m._id === tempId ? realMessage : m
    ),
  })),
  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter((m) => m._id !== messageId),
  })),

  // Online users
  onlineUsers: new Set(),
  setUserOnline: (userId) => set((state) => ({
    onlineUsers: new Set([...state.onlineUsers, userId]),
  })),
  setUserOffline: (userId) => set((state) => {
    const updated = new Set(state.onlineUsers);
    updated.delete(userId);
    return { onlineUsers: updated };
  }),

  // Typing
  typingUsers: {},
  setTyping: (userId, isTyping) => set((state) => ({
    typingUsers: { ...state.typingUsers, [userId]: isTyping },
  })),

  // UI
  isMobileSidebarOpen: false,
  toggleMobileSidebar: () => set((state) => ({
    isMobileSidebarOpen: !state.isMobileSidebarOpen,
  })),

  view: "chats", // 'chats' | 'archived' | 'requests' | 'status' | 'profile'
  setView: (view) => set({ view }),

  statusViewer: null, // { user, statuses, index }
  setStatusViewer: (statusViewer) => set({ statusViewer }),

  showNewChat: false,
  setShowNewChat: (showNewChat) => set({ showNewChat }),

  showStatusComposer: false,
  setShowStatusComposer: (showStatusComposer) => set({ showStatusComposer }),
}));

export default useChatStore;
