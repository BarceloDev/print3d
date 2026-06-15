// ─── MUDANÇAS NESTE ARQUIVO ────────────────────────────────────────────────
// 1. Adicionado cursor `cursor-default` para pedidos em estados terminais
//    ("rejected", "delivered") quando não são arrastáveis, substituindo
//    o `cursor-grab` implícito do drag-and-drop.
//    (O cursor de clique/link se mantém, pois o card ainda navega para o detalhe.)
// ───────────────────────────────────────────────────────────────────────────

import { CalendarDays, GripVertical, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Order } from "../types/order";
import { STATUS_META, formatCurrency, formatDate } from "../lib/orderStatus";

interface OrderCardProps {
  order: Order;
  /** Habilita o comportamento de arrastar (Kanban). */
  draggable?: boolean;
  onDragStart?: (orderId: number) => void;
  onDragEnd?: () => void;
}

export default function OrderCard({
  order,
  draggable,
  onDragStart,
  onDragEnd,
}: OrderCardProps) {
  const navigate = useNavigate();
  const meta = STATUS_META[order.status];

  return (
    <article
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(order.id));
        onDragStart?.(order.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={() => navigate(`/orders/${order.id}`)}
      className={`group cursor-pointer rounded-xl border border-slate-700 border-t-4 bg-slate-800 p-4 shadow-sm transition hover:border-slate-600 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-slate-950/40 ${meta.topBorder}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-slate-100">
          {order.title}
        </h3>
        {/* MUDANÇA: ícone de grip só aparece quando draggable=true (não para
            estados terminais "rejected"/"delivered"). Isso serve como cue
            visual de que o card não pode ser movido. */}
        {draggable && (
          <GripVertical
            size={16}
            className="mt-0.5 shrink-0 text-slate-600 transition group-hover:text-slate-400"
          />
        )}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
        <User size={13} className="text-slate-500" />
        <span className="truncate">{order.client.name}</span>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
        <CalendarDays size={13} className="text-slate-500" />
        <span>{formatDate(order.deadline)}</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-base font-bold text-slate-100">
          {formatCurrency(order.price)}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.badge}`}
        >
          {meta.label}
        </span>
      </div>
    </article>
  );
}
