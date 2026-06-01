import type { User } from "../types/user";
import api from "./api";

/**
 * Service de autenticação.
 * No MVP o login é mockado: qualquer e-mail/senha válidos retornam um usuário fictício.
 * A estrutura espelha o que a API real (consumida via Axios) retornaria.
 */

function buildMockUser(email: string): User {
  const name = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id: 1,
    name: name || "Usuário PRINT3D",
    email,
    plan_active: true,
  };
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  if (!email || !password) throw new Error("Informe e-mail e senha.");
  const res = await api.post("/login", { email, password });
  return res.data as { token: string; user: User };
}

export async function register(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
): Promise<{ token: string; user: User }> {
  if (!name || !email || !password || !confirmPassword)
    throw new Error("Preencha todos os campos.");
  const res = await api.post("/register", {
    name,
    email,
    password,
    password_confirmation: confirmPassword,
  });
  return res.data as { token: string; user: User };
}

export async function logout(): Promise<void> {
  await api.post("/logout");
}
