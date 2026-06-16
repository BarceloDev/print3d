// ─── MUDANÇAS NESTE ARQUIVO ────────────────────────────────────────────────
// 1. `nextStatus()` corrigida: "delivered" e "rejected" agora são estados
//    terminais — a função retorna null para ambos.
//    Antes: nextStatus("delivered") retornava "rejected" (próximo no array),
//    o que causava o botão "Avançar para Rejeitado" aparecer no OrderDetail
//    para pedidos já entregues, o que não faz nenhum sentido de negócio.
//    "rejected" é um caminho separado (via Kanban ou ação explícita),
//    não uma progressão linear de "delivered".
// ───────────────────────────────────────────────────────────────────────────

import type { OrderStatus } from "../types/order";

export interface StatusMeta {
  status: OrderStatus;
  label: string;
  /** Texto descritivo exibido ao cliente na página pública. */
  publicMessage: string;
  /** Classe da borda superior do card no Kanban. */
  topBorder: string;
  /** Classes do badge (fundo + texto). */
  badge: string;
  /** Classe de cor sólida (ponto/indicador). */
  dot: string;
  /** Classe do header da coluna do Kanban. */
  columnHeader: string;
}

export const STATUS_ORDER: OrderStatus[] = [
  "budget",
  "approved",
  "printing",
  "done",
  "delivered",
  "rejected",
];

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  budget: {
    status: "budget",
    label: "Orçamento",
    publicMessage:
      "Seu orçamento está pronto para análise. Aprove para iniciarmos a produção.",
    topBorder: "border-t-amber-500",
    badge: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30",
    dot: "bg-amber-500",
    columnHeader: "text-amber-300",
  },
  approved: {
    status: "approved",
    label: "Aprovado",
    publicMessage: "Orçamento aprovado! Seu pedido entrou na fila de produção.",
    topBorder: "border-t-sky-500",
    badge: "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/30",
    dot: "bg-sky-500",
    columnHeader: "text-sky-300",
  },
  printing: {
    status: "printing",
    label: "Imprimindo",
    publicMessage: "Estamos imprimindo seu pedido neste momento.",
    topBorder: "border-t-violet-500",
    badge:
      "bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-500/30",
    dot: "bg-violet-500",
    columnHeader: "text-violet-300",
  },
  done: {
    status: "done",
    label: "Pronto",
    publicMessage: "Seu pedido está pronto e aguardando retirada/entrega.",
    topBorder: "border-t-emerald-500",
    badge:
      "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
    dot: "bg-emerald-500",
    columnHeader: "text-emerald-300",
  },
  delivered: {
    status: "delivered",
    label: "Entregue",
    publicMessage: "Pedido entregue. Obrigado pela preferência!",
    topBorder: "border-t-slate-500",
    badge: "bg-slate-500/20 text-slate-300 ring-1 ring-inset ring-slate-500/40",
    dot: "bg-slate-500",
    columnHeader: "text-slate-300",
  },
  rejected: {
    status: "rejected",
    label: "Rejeitado",
    publicMessage:
      "Seu pedido foi rejeitado. Por favor, entre em contato com nosso suporte.",
    topBorder: "border-t-rose-500",
    badge: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/30",
    dot: "bg-rose-500",
    columnHeader: "text-rose-300",
  },
};

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Retorna o próximo status na progressão linear do pedido.
 *
 * REGRA DE NEGÓCIO:
 * - "budget" → null: o vendedor NÃO pode avançar para "approved".
 *   A aprovação é exclusiva do cliente, via link público
 *   (PublicOrderController::approve). No OrderDetail, o status "budget"
 *   exibe uma mensagem orientando o vendedor a enviar o link ao cliente.
 *
 * - "approved" → "printing": após aprovação do cliente, o vendedor
 *   avança manualmente para impressão.
 *
 * - "delivered" e "rejected" são estados terminais — retornam null.
 */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  // "budget": aguardando aprovação do cliente — vendedor não pode avançar.
  if (status === "budget") return null;
  // Estados terminais — nenhum avanço possível.
  if (status === "delivered" || status === "rejected") return null;

  const index = STATUS_ORDER.indexOf(status);
  if (index < 0) return null;

  const candidate = STATUS_ORDER[index + 1];
  // Segurança extra: nunca avança automaticamente para "rejected".
  if (!candidate || candidate === "rejected") return null;

  return candidate;
}
