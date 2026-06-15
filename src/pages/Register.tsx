// ─── MUDANÇAS NESTE ARQUIVO ────────────────────────────────────────────────
// 1. Mínimo de caracteres da senha corrigido de 6 para 8, alinhando com a
//    validação do backend (`'password' => 'required|string|min:8|confirmed'`).
//    Antes, o formulário deixava passar senhas de 6–7 caracteres que o Laravel
//    rejeitava com 422 — o usuário via uma mensagem de erro genérica sem
//    entender o motivo.
// ───────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../components/Logo";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    // MUDANÇA: mínimo corrigido de 6 para 8 — o backend exige min:8.
    if (password.length < 8) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, confirm);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível criar a conta.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-blue-900/50 to-slate-900 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-900/30 to-slate-950 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur">
          <h1 className="text-2xl font-semibold text-slate-100">
            Criar sua conta
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Comece a gerenciar seus pedidos de impressão 3D.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">Nome</span>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 focus-within:border-blue-500">
                <UserIcon size={18} className="text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-transparent py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </label>

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

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-300">
                Confirmar senha
              </span>
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 focus-within:border-blue-500">
                <Lock size={18} className="text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                <UserPlus size={18} />
              )}
              {loading ? "Criando..." : "Criar conta"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Já tem conta?{" "}
            <Link
              to="/login"
              className="font-semibold text-sky-400 hover:text-blue-400"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
