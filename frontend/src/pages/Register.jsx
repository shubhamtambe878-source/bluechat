import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (!/^[a-z0-9_.]{3,20}$/.test(username.toLowerCase())) {
      return toast.error("Username: 3-20 chars, lowercase letters/numbers/_/. only");
    }
    setLoading(true);
    try {
      await register(name, username, email, password);
      toast.success("Welcome to ChatApp!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="logo-icon">💬</span>
          <span className="logo-text">BlueChat</span>
        </div>
        <h2>Create your account</h2>
        <p className="auth-subtitle">Start chatting with friends today</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="e.g. shubham_t"
              required
            />
            <small className="form-hint">Friends will add you using this username</small>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
