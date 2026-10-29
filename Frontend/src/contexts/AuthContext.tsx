"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AuthUser } from "@/types/domain";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAdmin: boolean;
  isOwner: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("maji_token");
      const savedUser = localStorage.getItem("maji_user");
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem("maji_token");
      localStorage.removeItem("maji_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((authUser: AuthUser, authToken: string) => {
    localStorage.setItem("maji_token", authToken);
    localStorage.setItem("maji_user", JSON.stringify(authUser));
    setUser(authUser);
    setToken(authToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("maji_token");
    localStorage.removeItem("maji_user");
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAdmin: user?.role === "Admin",
        isOwner: user?.role === "Owner",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
