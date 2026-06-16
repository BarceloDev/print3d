// ─── MUDANÇAS NESTE ARQUIVO ────────────────────────────────────────────────
// 1. Props redesenhadas: em vez de receber `orders: Order[]` (lista plana)
//    agora recebe `columns: Record<OrderStatus, ColumnData>` — cada coluna
//    já chega com seus pedidos, flag de "tem mais" e flag de loading.
//    Isso elimina o `orders.filter(o => o.status === status)` que ocorria
//    a cada render para cada coluna.
//
// 2. Adicionado prop `onLoadMore: (status: OrderStatus) => void` acionado
//    pelo botão "Mostrar mais »" na base de cada coluna.
//
// 3. O botão "Mostrar mais »" só aparece quando `column.hasMore === true`.
//    Durante o carregamento exibe spinner (Loader2) no lugar do texto.
//
// 4. O contador no header da coluna agora exibe `column.total` (total real
//    do banco) em vez do `columnOrders.length` (só os carregados) — evita
//    confusão quando há mais pedidos além dos visíveis.
//
// 5. Restrições de drag (rejected/delivered) mantidas do patch anterior.
// ───────────────────────────────────────────────────────────────────────────

import { useState, type DragEvent } from "react";
import { Loader2 } from "lucide-react";
import type { Order, OrderStatus } from "../types/order";
import { STATUS_META, STATUS_ORDER } from "../lib/orderStatus";
import OrderCard from "./OrderCard";

// MUDANÇA: estrutura de dados por coluna recebida via props.
export interface ColumnData {
  orders: Order[];
  /** Total real no banco para este status (exibido no header). */
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
}

interface KanbanBoardProps {
  // MUDANÇA: substituído `orders: Order[]` por mapa de colunas.
  columns: Record<OrderStatus, ColumnData>;
  onStatusChange: (orderId: number, status: OrderStatus) => void;
  // MUDANÇA: callback de paginação por coluna.
  onLoadMore: (status: OrderStatus) => void;
}

// Estados que não podem ser movidos via drag (terminais).
const LOCKED_STATUSES: OrderStatus[] = ["rejected", "delivered"];

// Colunas que não aceitam drops via drag — o vendedor não pode
// mover pedidos PARA estas colunas. "approved" só pode ser definido
// pelo cliente, via link público (PublicOrderController::approve).
const LOCKED_DROP_TARGETS: OrderStatus[] = ["approved"];

export default function KanbanBoard({
  columns,
  onStatusChange,
  onLoadMore,
}: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overColumn, setOverColumn] = useState<OrderStatus | null>(null);

  function handleDrop(event: DragEvent, targetStatus: OrderStatus) {
    event.preventDefault();
    const id = Number(event.dataTransfer.getData("text/plain"));
    setOverColumn(null);
    setDraggingId(null);

    if (!Number.isNaN(id)) {
      // Bloqueia drop em colunas restritas ao cliente (ex: "approved").
      if (LOCKED_DROP_TARGETS.includes(targetStatus)) return;

      // Acha o status atual do pedido varrendo as colunas carregadas.
      let sourceStatus: OrderStatus | undefined;
      for (const s of STATUS_ORDER) {
        if (columns[s].orders.some((o) => o.id === id)) {
          sourceStatus = s;
          break;
        }
      }

      if (!sourceStatus || sourceStatus === targetStatus) return;
      // Pedidos em estado terminal não podem ser movidos.
      if (LOCKED_STATUSES.includes(sourceStatus)) return;

      onStatusChange(id, targetStatus);
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin lg:grid lg:grid-cols-6 lg:overflow-visible">
      {STATUS_ORDER.map((status) => {
        const meta = STATUS_META[status];
        const col = columns[status];
        const isOver = overColumn === status;

        const isLockedTarget = LOCKED_DROP_TARGETS.includes(status);

        return (
          <section
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              // Não destaca colunas que não aceitam drops (ex: "aprovado").
              if (!isLockedTarget) setOverColumn(status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                setOverColumn(null);
            }}
            onDrop={(e) => handleDrop(e, status)}
            className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-slate-900/50 transition lg:w-auto ${
              isOver ? "border-blue-500 bg-slate-900" : "border-slate-800"
            }`}
          >
            {/* Header da coluna */}
            <header className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                <span className={`text-sm font-semibold ${meta.columnHeader}`}>
                  {meta.label}
                </span>
                {/* Badge indicando que esta coluna é exclusiva do cliente */}
                {isLockedTarget && (
                  <span
                    title="Aprovação exclusiva do cliente (via link)"
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20"
                  >
                    cliente
                  </span>
                )}
              </div>
              {/* MUDANÇA: exibe total real do banco, não só os carregados. */}
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">
                {col.total}
              </span>
            </header>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-3 p-3">
              {col.orders.map((order) => (
                <div
                  key={order.id}
                  className={draggingId === order.id ? "opacity-50" : ""}
                >
                  <OrderCard
                    order={order}
                    draggable={!LOCKED_STATUSES.includes(order.status)}
                    onDragStart={setDraggingId}
                    onDragEnd={() => setDraggingId(null)}
                  />
                </div>
              ))}

              {col.orders.length === 0 && !col.loadingMore && (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-800 py-8 text-xs text-slate-600">
                  Solte um pedido aqui
                </div>
              )}

              {/* MUDANÇA: botão "Mostrar mais »" — só renderiza se hasMore. */}
              {col.hasMore && (
                <button
                  onClick={() => onLoadMore(status)}
                  disabled={col.loadingMore}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-700 py-2.5 text-xs font-medium text-slate-500 transition hover:border-slate-500 hover:text-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {col.loadingMore ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    "Mostrar mais »"
                  )}
                </button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
