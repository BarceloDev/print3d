import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../components/Logo";

interface LocationState {
  from?: { pathname?: string };
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Gradiente sutil azul no canto */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-blue-900/50 to-slate-900 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-900/30 to-slate-950 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur">
          <h1 className="text-2xl font-semibold text-slate-100">
            Bem-vindo de volta
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Acesse o painel de gestão dos seus pedidos.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">E-mail</span>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 focus-within:border-blue-500">
                <Mail size={18} className="text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="w-full bg-transparent py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">Senha</span>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 focus-within:border-blue-500">
                <Lock size={18} className="text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-slate-50 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowRight size={18} />
              )}
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Ainda não tem conta?{" "}
            <Link
              to="/register"
              className="font-semibold text-sky-400 hover:text-blue-400"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
