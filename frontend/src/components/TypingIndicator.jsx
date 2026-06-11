export default function TypingIndicator({ user }) {
  return (
    <div className="message-wrapper other">
      <img
        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
        alt="avatar"
        className="avatar-xs"
      />
      <div className="typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}