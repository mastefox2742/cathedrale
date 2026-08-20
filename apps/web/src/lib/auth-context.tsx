"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AuthenticatedUser, LoginInput, RegisterInput } from "@csc/shared";
import { apiFetch, bindTokenAccessors, refreshAccessToken } from "./api-client";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  /** true tant que le silent refresh initial n'a pas resolu - evite un flash "non connecte". */
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    // Access token garde UNIQUEMENT en memoire (ref), jamais en localStorage.
    bindTokenAccessors(
      () => accessTokenRef.current,
      (token) => {
        accessTokenRef.current = token;
      },
    );
  }, []);

  const loadCurrentUser = useCallback(async () => {
    try {
      const me = await apiFetch<AuthenticatedUser>("/users/me");
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Silent refresh au chargement de l'app : le cookie HttpOnly (s'il existe
    // et est valide) permet de retrouver une session sans redemander le mot
    // de passe, sans jamais exposer le refresh token au JS.
    void (async () => {
      const token = await refreshAccessToken();
      if (token) await loadCurrentUser();
      setIsLoading(false);
    })();
  }, [loadCurrentUser]);

  const login = useCallback(
    async (input: LoginInput) => {
      await apiFetch<{ accessToken: string }>("/auth/login", {
        method: "POST",
        body: input,
        skipAuth: true,
      }).then((data) => {
        accessTokenRef.current = data.accessToken;
      });
      await loadCurrentUser();
    },
    [loadCurrentUser],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await apiFetch<{ accessToken: string }>("/auth/register", {
        method: "POST",
        body: input,
        skipAuth: true,
      }).then((data) => {
        accessTokenRef.current = data.accessToken;
      });
      await loadCurrentUser();
    },
    [loadCurrentUser],
  );

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    accessTokenRef.current = null;
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit etre utilise a l'interieur de <AuthProvider>");
  return ctx;
}
