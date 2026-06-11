import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

const ProtectedRoute = ({ children }) => {
  const { authUser, isLoading } = useAuth();
  if (isLoading) return <div className="loading-screen">Loading...</div>;
  return authUser ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { authUser, isLoading } = useAuth();
  if (isLoading) return <div className="loading-screen">Loading...</div>;
  return authUser ? <Navigate to="/" /> : children;
};

function AppContent() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/" element={
          <ProtectedRoute>
            <SocketProvider>
              <Home />
            </SocketProvider>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}