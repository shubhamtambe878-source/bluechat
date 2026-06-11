// Hook kept for forward-compat. Today message state lives in chatStore.
import useChatStore from "../store/chatStore";

const useMessages = () => {
  const { messages, setMessages, addMessage } = useChatStore();
  return { messages, setMessages, addMessage };
};

export default useMessages;
