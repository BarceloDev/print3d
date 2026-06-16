// ─── CORREÇÕES NESTE ARQUIVO ────────────────────────────────────────────────
//
// BUG 3 — document.body.style.overflow OSCILANDO E OVERLAY PODENDO TRAVAR
//   Antes: o useEffect dependia de [open, onClose]. Como onClose é uma arrow
//   function inline recriada a cada render do componente pai (Orders.tsx),
//   qualquer re-render do pai (ex: setColumns após criar um pedido) causava:
//     1) O cleanup do efeito rodar → document.body.style.overflow = ""
//     2) O efeito rodar de novo   → document.body.style.overflow = "hidden"
//   Esse ciclo desnecessário podia provocar um flash visual onde o body
//   scroll era restaurado brevemente, e o listener de teclado era removido
//   e re-adicionado em cada render — comportamento incorreto.
//
//   Depois: onClose é guardado em uma ref (onCloseRef) que é sempre
//   atualizada de forma síncrona. O useEffect depende APENAS de [open],
//   eliminando todos os re-runs desnecessários. O listener de teclado
//   usa sempre a versão mais recente de onClose via ref.
//
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, title, onClose, children }: ModalProps) {
  // CORREÇÃO BUG 3: mantém sempre a versão mais recente de onClose em uma ref,
  // sem que onClose precise entrar no array de dependências do useEffect.
  // Isso evita que o efeito (e seu cleanup) dispare a cada render do pai.
  const onCloseRef = useRef(onClose);
  // Atualiza a ref de forma síncrona a cada render (não usa useEffect para
  // isso, pois queremos que onCloseRef.current esteja atualizado antes de
  // qualquer evento de teclado ser processado).
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      // CORREÇÃO BUG 3: usa ref em vez de closure sobre onClose.
      if (e.key === "Escape") onCloseRef.current();
    }

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // CORREÇÃO BUG 3: dependência apenas em [open], não em [open, onClose].
    // Como onClose é recriado a cada render do pai, incluí-lo aqui causava
    // re-runs desnecessários que oscilavam o overflow do body.
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-700 bg-slate-800 shadow-2xl scrollbar-thin sm:rounded-2xl"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-slate-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-slate-100"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
