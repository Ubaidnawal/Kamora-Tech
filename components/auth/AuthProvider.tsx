"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch, forgetCsrfToken, rememberCsrfToken } from "@/lib/api";

export type AuthUser = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  is_verified: boolean;
  roles: string[];
  company_name?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<AuthUser>;
  register: (payload: { full_name: string; email: string; phone: string; password: string; confirm_password: string; accept_terms: boolean }) => Promise<{ message: string; token?: string | null; link?: string | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const session = await apiFetch<{
      authenticated: boolean;
      has_refresh: boolean;
      user: AuthUser | null;
      csrf_token?: string | null;
    }>("/api/v1/auth/session", { skipCsrf: true });
    rememberCsrfToken(session.csrf_token);

    if (session.authenticated && session.user) {
      setUser(session.user);
      return;
    }

    if (session.has_refresh) {
      try {
        const refreshed = await apiFetch<{ user?: AuthUser; csrf_token?: string | null }>("/api/v1/auth/refresh", { method: "POST" });
        rememberCsrfToken(refreshed.csrf_token);
        setUser(refreshed.user ?? (await apiFetch<AuthUser>("/api/v1/auth/me")));
        return;
      } catch {
        setUser(null);
        return;
      }
    }

    setUser(null);
  }, []);

  useEffect(() => {
    refreshUser()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      const result = await apiFetch<{ user?: AuthUser; csrf_token?: string | null }>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
      });
      rememberCsrfToken(result.csrf_token);
      const profile = result.user ?? (await apiFetch<AuthUser>("/api/v1/auth/me"));
      setUser(profile);
      return profile;
    },
    [],
  );

  const register = useCallback(async (payload: { full_name: string; email: string; phone: string; password: string; confirm_password: string; accept_terms: boolean }) => {
    return apiFetch<{ message: string; token?: string | null; link?: string | null }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      forgetCsrfToken();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.roles.includes("admin")),
      login,
      register,
      logout,
      refreshUser,
    }),
    [login, loading, logout, refreshUser, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
