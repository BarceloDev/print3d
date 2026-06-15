// ─── MUDANÇAS NESTE ARQUIVO ────────────────────────────────────────────────
// 1. Estado `orders: Order[]` substituído por `columns` — um mapa de
//    ColumnState por status. Cada coluna tem: orders[], page, total,
//    hasMore e loadingMore independentes.
//
// 2. Carga inicial: 6 requisições paralelas (uma por coluna) + getClients(),
//    todas em Promise.all. Cada coluna carrega sua primeira página de 5.
//
// 3. `handleLoadMore(status)`: busca a próxima página da coluna e anexa
//    (append) os novos pedidos ao array existente.
//
// 4. `handleStatusChange`: atualização otimista como antes, mas agora opera
//    sobre o mapa de colunas. Após o PATCH bem-sucedido, refaz a página 1
//    das duas colunas afetadas (origem e destino) para garantir consistência
//    com o banco — evita duplicatas ou ordens erradas no "Mostrar mais".
//
// 5. `handleCreate`: prepend do novo pedido na coluna "budget".
//
// 6. `updateError`: revertido para o padrão do patch anterior de erros.
// ───────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Plus, X } from "lucide-react";
import type { Client } from "../types/client";
import type { CreateOrderDTO, Order, OrderStatus } from "../types/order";
import {
  createOrder,
  getOrdersByStatus,
  updateOrderStatus,
  type OrderPage,
} from "../services/orderService";
import { getClients } from "../services/clientService";
import AppLayout from "../components/AppLayout";
import KanbanBoard, { type ColumnData } from "../components/KanbanBoard";
import OrderForm from "../components/OrderForm";
import { STATUS_ORDER } from "../lib/orderStatus";
import { getApiErrorMessage } from "../services/api";

const PER_PAGE = 5;

// MUDANÇA: estrutura interna de estado por coluna.
interface ColumnState extends ColumnData {
  page: number;
}

function pageToColumnState(page: OrderPage): ColumnState {
  return {
    orders: page.data,
    total: page.total,
    page: page.current_page,
    hasMore: page.current_page < page.last_page,
    loadingMore: false,
  };
}

function emptyColumn(): ColumnState {
  return { orders: [], total: 0, page: 1, hasMore: false, loadingMore: false };
}

type ColumnsMap = Record<OrderStatus, ColumnState>;

function buildInitialColumns(): ColumnsMap {
  return Object.fromEntries(
    STATUS_ORDER.map((s) => [s, emptyColumn()]),
  ) as ColumnsMap;
}

export default function Orders() {
  const [columns, setColumns] = useState<ColumnsMap>(buildInitialColumns);
  const [clients, setClients] = useState<Client[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // ── Carga inicial: todas as colunas + clientes em paralelo ───────────────
  useEffect(() => {
    let active = true;

    Promise.all([
      // MUDANÇA: uma requisição por coluna em vez de uma requisição para tudo.
      Promise.all(
        STATUS_ORDER.map((status) => getOrdersByStatus(status, 1, PER_PAGE)),
      ),
      getClients(),
    ])
      .then(([pageResults, clientsData]) => {
        if (!active) return;

        const newColumns = buildInitialColumns();
        STATUS_ORDER.forEach((status, i) => {
          newColumns[status] = pageToColumnState(pageResults[i]);
        });

        setColumns(newColumns);
        setClients(clientsData as Client[]);
        setInitialLoading(false);
      })
      .catch(() => {
        if (active) {
          setError(true);
          setInitialLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // ── "Mostrar mais »" — anexa próxima página à coluna ────────────────────
  // MUDANÇA: função nova. Chamada pelo KanbanBoard via onLoadMore.
  async function handleLoadMore(status: OrderStatus) {
    const col = columns[status];
    if (col.loadingMore || !col.hasMore) return;

    // Ativa spinner no botão da coluna.
    setColumns((prev) => ({
      ...prev,
      [status]: { ...prev[status], loadingMore: true },
    }));

    try {
      const nextPage = col.page + 1;
      const page = await getOrdersByStatus(status, nextPage, PER_PAGE);

      setColumns((prev) => ({
        ...prev,
        [status]: {
          orders: [...prev[status].orders, ...page.data],
          total: page.total,
          page: nextPage,
          hasMore: page.current_page < page.last_page,
          loadingMore: false,
        },
      }));
    } catch (err) {
      // Desativa spinner sem perder os pedidos já carregados.
      setColumns((prev) => ({
        ...prev,
        [status]: { ...prev[status], loadingMore: false },
      }));
      setUpdateError(
        getApiErrorMessage(err, "Não foi possível carregar mais pedidos."),
      );
    }
  }

  // ── Mudança de status via drag-and-drop ──────────────────────────────────
  async function handleStatusChange(orderId: number, newStatus: OrderStatus) {
    // Localiza o pedido no mapa de colunas.
    let sourceStatus: OrderStatus | undefined;
    let sourceOrder: Order | undefined;

    for (const s of STATUS_ORDER) {
      const found = columns[s].orders.find((o) => o.id === orderId);
      if (found) {
        sourceStatus = s;
        sourceOrder = found;
        break;
      }
    }

    if (!sourceStatus || !sourceOrder || sourceStatus === newStatus) return;

    // Snapshot para revert em caso de erro.
    const snapshot = columns;

    // MUDANÇA: atualização otimista opera sobre o mapa de colunas —
    // remove da coluna origem e prepend na destino.
    setColumns((prev) => ({
      ...prev,
      [sourceStatus!]: {
        ...prev[sourceStatus!],
        orders: prev[sourceStatus!].orders.filter((o) => o.id !== orderId),
        total: Math.max(0, prev[sourceStatus!].total - 1),
      },
      [newStatus]: {
        ...prev[newStatus],
        orders: [
          { ...sourceOrder!, status: newStatus },
          ...prev[newStatus].orders,
        ],
        total: prev[newStatus].total + 1,
      },
    }));
    setUpdateError(null);

    try {
      await updateOrderStatus(orderId, newStatus);

      // MUDANÇA: refaz página 1 das duas colunas afetadas após o PATCH.
      // Garante consistência com o banco e evita duplicatas ao clicar
      // em "Mostrar mais" depois de um drag-and-drop.
      const [srcPage, dstPage] = await Promise.all([
        getOrdersByStatus(sourceStatus, 1, PER_PAGE),
        getOrdersByStatus(newStatus, 1, PER_PAGE),
      ]);

      setColumns((prev) => ({
        ...prev,
        [sourceStatus!]: pageToColumnState(srcPage),
        [newStatus]: pageToColumnState(dstPage),
      }));
    } catch (err) {
      setColumns(snapshot);
      setUpdateError(
        getApiErrorMessage(
          err,
          "Não foi possível mover o pedido. Tente novamente.",
        ),
      );
    }
  }

  // ── Criar pedido ─────────────────────────────────────────────────────────
  async function handleCreate(data: CreateOrderDTO) {
    const created = await createOrder(data);
    // MUDANÇA: prepend na coluna "budget" em vez de num array flat.
    setColumns((prev) => ({
      ...prev,
      budget: {
        ...prev.budget,
        orders: [created, ...prev.budget.orders],
        total: prev.budget.total + 1,
      },
    }));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout
      title="Pedidos"
      subtitle="Arraste os cards entre as colunas para mudar o status"
      actions={
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-slate-50 transition hover:bg-blue-500"
        >
          <Plus size={18} />
          Novo Pedido
        </button>
      }
    >
      {/* Banner de erro de ação (drag falhou, load more falhou, etc.) */}
      {updateError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{updateError}</span>
          <button
            onClick={() => setUpdateError(null)}
            className="ml-auto text-red-400 hover:text-red-200"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {initialLoading ? (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-24 text-sm text-red-400">
          Não foi possível carregar os pedidos. Tente novamente.
        </div>
      ) : (
        <KanbanBoard
          columns={columns}
          onStatusChange={handleStatusChange}
          onLoadMore={handleLoadMore}
        />
      )}

      <OrderForm
        open={formOpen}
        clients={clients}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
    </AppLayout>
  );
}
