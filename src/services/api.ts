import axios from "axios";

const TOKEN_KEY = "print3d_token";

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

export { TOKEN_KEY };
export default api;
