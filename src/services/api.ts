// ─── MUDANÇAS NESTE ARQUIVO ────────────────────────────────────────────────
// 1. Importado `isAxiosError` do axios para tipagem segura nos utilitários.
// 2. Adicionada `getApiErrorMessage()` — converte qualquer erro Axios em texto
//    legível pelo usuário (cobre 422 do Laravel, 401, 403, 429, 5xx e sem rede).
// 3. Adicionada `isPlanInactiveError()` — identifica se o erro é um 403
//    do middleware CheckPlanActive, usado no Dashboard e Clients para exibir
//    a mensagem de "assine o plano".
// ───────────────────────────────────────────────────────────────────────────

import axios, { isAxiosError } from "axios";

export const TOKEN_KEY = "print3d_token";

/**
 * Instância Axios central da aplicação.
 * A baseURL é lida de import.meta.env.VITE_API_URL com um fallback de desenvolvimento.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
});

/**
 * Interceptor de requisição: injeta o Bearer token (quando existir) em toda chamada.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Interceptor de resposta: em caso de 401, limpa a sessão e redireciona para /login.
 * Demais erros são repassados para que cada chamador decida como tratá-los.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

// ─── MUDANÇA: funções utilitárias de erro ──────────────────────────────────

/**
 * Extrai uma mensagem amigável de erros Axios.
 *
 * Cobre todos os cenários comuns da API:
 * - 422 → erros de validação do Laravel (inclui credenciais inválidas no login)
 * - 401 → sessão expirada
 * - 403 → plano inativo ou acesso negado
 * - 429 → rate-limiting
 * - 5xx → falha no servidor
 * - sem `response` → sem conexão de rede
 */
export function getApiErrorMessage(error: unknown, fallback?: string): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as Record<string, unknown> | undefined;

    if (status === 422) {
      // Erros de validação do Laravel vêm dentro de `errors` como arrays por campo.
      const errors = data?.errors as Record<string, string[]> | undefined;
      if (errors) {
        const firstKey = Object.keys(errors)[0];
        if (firstKey && errors[firstKey]?.[0]) return errors[firstKey][0];
      }
      if (typeof data?.message === "string" && data.message)
        return data.message;
      return "Dados inválidos. Verifique as informações e tente novamente.";
    }

    if (status === 401) return "Sessão expirada. Faça login novamente.";

    if (status === 403) {
      if (typeof data?.message === "string" && data.message)
        return data.message;
      return "Acesso negado. Verifique suas permissões.";
    }

    if (status === 404) return "Recurso não encontrado.";

    if (status === 429) {
      return "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
    }

    if (status && status >= 500) {
      return "Erro no servidor. Tente novamente mais tarde.";
    }

    // Sem resposta = sem rede ou CORS
    if (!error.response) {
      return "Sem conexão com o servidor. Verifique sua internet.";
    }
  }

  return fallback ?? "Ocorreu um erro inesperado. Tente novamente.";
}

/**
 * Retorna true se o erro for um 403 gerado pelo middleware CheckPlanActive.
 * Usado no Dashboard e Clients para exibir a mensagem de assinatura.
 */
export function isPlanInactiveError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 403;
}

// ──────────────────────────────────────────────────────────────────────────

export default api;
