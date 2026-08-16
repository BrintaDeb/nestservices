import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearBearer, setBearer, toApiError } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  // null = loading, false = anonymous, object = user
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data.user);
    } catch (_) {
      setUser(false);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    if (data.access_token) setBearer(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/api/auth/register", payload);
    if (data.access_token) setBearer(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await api.post("/api/auth/logout"); } catch (_) {}
    clearBearer();
    setUser(false);
  };

  return (
    <AuthCtx.Provider value={{ user, ready, login, register, logout, refresh, toApiError }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
