"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AuthUser } from "@/types/domain";

export type PlatformSuite = "property" | "water";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  activeSuite: PlatformSuite;
  setActiveSuite: (suite: PlatformSuite) => void;
  login: (user: AuthUser, token: string, suite?: PlatformSuite) => void;
  logout: () => void;
  isAdmin: boolean;
  isOwner: boolean;
  isTenant: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeSuite, setActiveSuiteState] = useState<PlatformSuite>("property");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("maji_token");
      const savedUser = localStorage.getItem("maji_user");
      const savedSuite = localStorage.getItem("maji_active_suite") as PlatformSuite | null;
      if (savedSuite === "property" || savedSuite === "water") {
        setActiveSuiteState(savedSuite);
      }
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

  const setActiveSuite = useCallback((suite: PlatformSuite) => {
    setActiveSuiteState(suite);
    localStorage.setItem("maji_active_suite", suite);
  }, []);

  const login = useCallback((authUser: AuthUser, authToken: string, suite?: PlatformSuite) => {
    localStorage.setItem("maji_token", authToken);
    localStorage.setItem("maji_user", JSON.stringify(authUser));
    if (suite) {
      localStorage.setItem("maji_active_suite", suite);
      setActiveSuiteState(suite);
    }
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
        activeSuite,
        setActiveSuite,
        login,
        logout,
        isAdmin: user?.role === "Admin",
        isOwner: user?.role === "Owner",
        isTenant: user?.role === "Tenant",
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
