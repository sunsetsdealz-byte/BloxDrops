import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, tokenStore, formatApiError } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);     // null=unknown, false=guest, object=user
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(false);
      setLoading(false);
      return;
    }
    // Retry transient errors a few times with backoff. Only a confirmed
    // 401/403 (token invalid/expired) clears the token and logs the user out.
    const attempt = async (delay) => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
        setLoading(false);
        return true;
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          tokenStore.clear();
          setUser(false);
          setLoading(false);
          return true;
        }
        // Transient (network / 5xx / Cloudflare / CORS preflight). Schedule retry.
        setLoading(false);
        if (delay <= 30000) {
          setTimeout(() => attempt(delay * 2), delay);
        }
        return false;
      }
    };
    await attempt(2000); // 2s, then 4s, 8s, 16s, 32s
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password, remember = true) => {
    const { data } = await api.post("/auth/login", { email, password });
    tokenStore.set(data.access_token, remember);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, name) => {
    const { data } = await api.post("/auth/register", { email, password, name });
    tokenStore.set(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    tokenStore.clear();
    setUser(false);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refresh, formatApiError }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
