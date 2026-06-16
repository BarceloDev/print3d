// ─── CORREÇÕES NESTE ARQUIVO ────────────────────────────────────────────────
//
// BUG 1 — RAIZ DO "REDIRECT PARA LOGIN AO RECARREGAR"
//   Antes: useState inicializava token e user como null. O useEffect lia
//   o localStorage APÓS o primeiro render. O PrivateRoute, no primeiro render,
//   encontrava isAuthenticated=false e redirecionava para /login antes que a
//   hidratação acontecesse.
//   Depois: lazy initializer (função como argumento do useState) lê o
//   localStorage de forma SÍNCRONA, garantindo que token e user já estejam
//   populados na primeira renderização. O useEffect de hidratação foi removido.
//
// BUG 2 — COMPLEMENTO DA CORREÇÃO DO api.ts (interceptor 401)
//   Antes: o interceptor chamava window.location.assign("/login"), causando
//   navegação hard com reload completo e a "tela escura".
//   Depois: o interceptor dispara o evento "auth:unauthorized". Este contexto
//   escuta esse evento e limpa o estado React de forma reativa, deixando o
//   React Router fazer o redirect de forma suave (SPA), sem reload de página.
//
// ────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../types/user";
import * as authService from "../services/authService";
import { TOKEN_KEY } from "../services/api";

const USER_KEY = "print3d_user";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── CORREÇÃO BUG 1: lazy initializer ──────────────────────────────────────
// As funções passadas para useState() são executadas de forma SÍNCRONA na
// montagem, antes do primeiro render. Isso garante que isAuthenticated seja
// true já na primeira renderização quando há um token salvo — eliminando o
// flash de redirect para /login em toda atualização de página.
// ──────────────────────────────────────────────────────────────────────────
function getInitialToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getInitialUser(): User | null {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // CORREÇÃO BUG 1: inicialização síncrona a partir do localStorage.
  // Antes era useState<string | null>(null) + useEffect para popular.
  const [token, setToken] = useState<string | null>(getInitialToken);
  const [user, setUser] = useState<User | null>(getInitialUser);

  // CORREÇÃO BUG 2: escuta o evento emitido pelo interceptor 401 do api.ts.
  // Ao receber "auth:unauthorized", limpa estado React e localStorage.
  // O React Router detecta isAuthenticated=false e faz o redirect para /login
  // via SPA navigation (sem reload, sem tela preta).
  useEffect(() => {
    function handleUnauthorized() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const { token: newToken, user: newUser } = await authService.login(
      email,
      password,
    );
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  async function register(
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
  ): Promise<void> {
    const { token: newToken, user: newUser } = await authService.register(
      name,
      email,
      password,
      confirmPassword,
    );
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  function logout(): void {
    void authService.logout();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      login,
      register,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  }
  return ctx;
}
