"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as api from "@/lib/api";

interface AuthContextValue {
  user: api.User | null;
  accessToken: string | null;
  loading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; first_name?: string; last_name?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<api.User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tente une reconnexion silencieuse via le cookie httpOnly refresh_token.
    api
      .refreshAccessToken()
      .then(async ({ access }) => {
        setAccessToken(access);
        setUser(await api.fetchMe(access));
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(data: { email: string; password: string }) {
    const { access, user } = await api.login(data);
    setAccessToken(access);
    setUser(user);
  }

  async function register(data: { email: string; password: string; first_name?: string; last_name?: string }) {
    const { access, user } = await api.register(data);
    setAccessToken(access);
    setUser(user);
  }

  async function logout() {
    if (accessToken) {
      await api.logout(accessToken).catch(() => {});
    }
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}
