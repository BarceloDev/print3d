// ─── CORREÇÕES NESTE ARQUIVO ────────────────────────────────────────────────
//
// BUG 2 — RAIZ DA "TELA ESCURA" AO CADASTRAR PEDIDO
//   Antes: o interceptor de resposta chamava window.location.assign("/login")
//   quando recebia um 401. Isso causava:
//     1) A página atual esvaziar instantaneamente (tela escura/branca)
//     2) Um reload completo do navegador — pior performance e UX
//     3) O token já removido do localStorage fazia o PrivateRoute redirecionar
//        para /login na recarga (manifestando-se como o "bug do redirect")
//   Depois: em vez de navegação hard, o interceptor dispara o CustomEvent
//   "auth:unauthorized". O AuthContext escuta esse evento, limpa o estado
//   React e o React Router faz o redirect via SPA navigation — sem reload,
//   sem tela em branco.
//
// As demais funções utilitárias (getApiErrorMessage, isPlanInactiveError)
// permanecem idênticas.
//
// ────────────────────────────────────────────────────────────────────────────

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
 * CORREÇÃO BUG 2:
 * Interceptor de resposta: em caso de 401, em vez de chamar
 * window.location.assign (que causava reload completo e tela escura),
 * agora dispara o evento customizado "auth:unauthorized".
 *
 * O AuthContext escuta esse evento e limpa o estado React de forma reativa,
 * deixando o React Router redirecionar para /login via SPA navigation
 * (sem reload de página, sem flash de tela em branco).
 *
 * Demais erros são repassados para que cada chamador decida como tratá-los.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // ANTES (bugado):
      // localStorage.removeItem(TOKEN_KEY);
      // if (window.location.pathname !== "/login") {
      //   window.location.assign("/login");  ← causava tela escura + hard reload
      // }

      // DEPOIS (corrigido): evento reativo — AuthContext trata a limpeza.
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(error);
  },
);

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

export default api;
