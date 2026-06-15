// ─── MUDANÇAS NESTE ARQUIVO ────────────────────────────────────────────────
// 1. Removida a função `buildMockUser` — era um resquício da fase mockada
//    e não era utilizada em nenhum lugar.
// 2. `login()` agora envolve a chamada em try/catch e usa `getApiErrorMessage()`
//    para converter o código HTTP em texto legível. Antes, o erro bruto do Axios
//    ("Request failed with status code 422") chegava até o componente Login.tsx
//    e era exibido diretamente ao usuário.
// 3. `register()` recebe o mesmo tratamento — erros de validação do Laravel
//    (e-mail já cadastrado, senha curta etc.) agora chegam traduzidos.
// ───────────────────────────────────────────────────────────────────────────

import type { User } from "../types/user";
import api, { getApiErrorMessage } from "./api";

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  if (!email || !password) throw new Error("Informe e-mail e senha.");

  // MUDANÇA: try/catch para traduzir erros HTTP em mensagens amigáveis.
  // Antes: o erro Axios bruto subia direto para Login.tsx e exibia algo como
  // "Request failed with status code 422" ou "Network Error" para o usuário.
  try {
    const res = await api.post("/login", { email, password });
    return res.data as { token: string; user: User };
  } catch (err) {
    throw new Error(
      getApiErrorMessage(err, "Credenciais inválidas. Tente novamente."),
    );
  }
}

export async function register(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
): Promise<{ token: string; user: User }> {
  if (!name || !email || !password || !confirmPassword)
    throw new Error("Preencha todos os campos.");

  // MUDANÇA: mesmo tratamento do login — erros do Laravel (e-mail duplicado,
  // senha fraca, etc.) chegam traduzidos em vez do código HTTP cru.
  try {
    const res = await api.post("/register", {
      name,
      email,
      password,
      password_confirmation: confirmPassword,
    });
    return res.data as { token: string; user: User };
  } catch (err) {
    throw new Error(
      getApiErrorMessage(
        err,
        "Não foi possível criar a conta. Tente novamente.",
      ),
    );
  }
}

export async function logout(): Promise<void> {
  await api.post("/logout");
}
