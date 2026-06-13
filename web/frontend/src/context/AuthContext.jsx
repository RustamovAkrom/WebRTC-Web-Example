// AuthContext — foydalanuvchi sessiyasi (ixtiyoriy login).
//
// Mehmon yo'li o'zgarmaydi: user=null bo'lsa ham hamma narsa ishlaydi.
// Sessiya httpOnly cookie'da; bu yerda faqat user profili saqlanadi.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setUser(me || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (username, password) => {
    const res = await api.login({ username, password });
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.register(payload);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // WS uchun qisqa muddatli ticket (faqat login bo'lganlar uchun).
  const getWsTicket = useCallback(async () => {
    if (!user) return null;
    try {
      const res = await api.wsTicket();
      return res?.ticket || null;
    } catch {
      return null;
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refresh, getWsTicket }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}
