import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setAuthUser(data);
      } catch {
        setAuthUser(null);
        localStorage.removeItem("token");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setAuthUser(data);
    if (data.token) localStorage.setItem("token", data.token);
    return data;
  };

  const register = async (name, username, email, password) => {
    const { data } = await api.post("/auth/register", { name, username, email, password });
    setAuthUser(data);
    if (data.token) localStorage.setItem("token", data.token);
    return data;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.removeItem("token");
    setAuthUser(null);
  };

  const updateAuthUser = (patch) => setAuthUser((u) => ({ ...u, ...patch }));

  return (
    <AuthContext.Provider value={{ authUser, setAuthUser, updateAuthUser, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
