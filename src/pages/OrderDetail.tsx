// ─── MUDANÇAS NESTE ARQUIVO ────────────────────────────────────────────────
// 1. Adicionadas flags `isRejected` e `isDelivered` para controlar a seção
//    de ações de forma explícita.
//
// 2. PEDIDO REJEITADO (isRejected):
//    - Exibe apenas o botão "Excluir Pedido" e um banner informativo.
//    - "Avançar", "Editar Pedido" e "Copiar link" são ocultados.
//    - Requisito: "quando o pedido for rejeitado, a única opção disponível
//      será EXCLUIR PEDIDO".
//
// 3. PEDIDO ENTREGUE (isDelivered):
//    - "Avançar pedido" e "Editar Pedido" continuam visíveis mas são
//      desabilitados (`disabled`) e acinzentados — cursor-not-allowed.
//    - "Copiar link do cliente" e "Excluir Pedido" permanecem ativos.
//    - Requisito: "deixe com uma cor mais acinzentada indicando
//      indisponibilidade e desative a função desses botões".
//
// 4. Adicionado estado `actionError` com try/catch em `handleAdvance`,
//    `handleEdit` e `handleDelete`. Antes, qualquer falha nessas ações
//    era silenciosa — o usuário não recebia nenhum feedback.
//
// 5. `handleEdit` agora fecha o formulário e mantém o pedido atualizado
//    na state local sem precisar navegar para fora.
// ───────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  ImageOff,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import type { Client } from "../types/client";
import type { CreateOrderDTO, Order, OrderStatus } from "../types/order";
import {
  deleteOrder,
  getOrder,
  updateOrder,
  updateOrderStatus,
} from "../services/orderService";
import { getClients } from "../services/clientService";
import {
  STATUS_META,
  STATUS_ORDER,
  formatCurrency,
  formatDate,
  nextStatus,
} from "../lib/orderStatus";
import AppLayout from "../components/AppLayout";
import OrderForm from "../components/OrderForm";
// MUDANÇA: importada função utilitária de erro
import { getApiErrorMessage } from "../services/api";

interface HistoryEntry {
  status: OrderStatus;
  date: string;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // MUDANÇA: estado para erros das ações (avançar, editar, excluir)
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const orderId = Number(id);
    Promise.all([getOrder(orderId), getClients()])
      .then(([o, c]) => {
        if (active) {
          setOrder(o);
          setClients(c);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setNotFound(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  // MUDANÇA: adicionado try/catch — falhas silenciosas não mostram nenhum feedback
  async function handleAdvance() {
    if (!order) return;
    const next = nextStatus(order.status);
    if (!next) return;
    setActionError(null);
    try {
      const updated = await updateOrderStatus(order.id, next);
      setOrder(updated);
      navigate("/orders");
    } catch (err) {
      setActionError(
        getApiErrorMessage(err, "Não foi possível avançar o pedido."),
      );
    }
  }

  // MUDANÇA: adicionado try/catch + fecha o form após salvar com sucesso
  async function handleEdit(data: CreateOrderDTO) {
    if (!order) return;
    setActionError(null);
    try {
      const updated = await updateOrder(order.id, data);
      setOrder(updated);
      setFormOpen(false);
    } catch (err) {
      setActionError(
        getApiErrorMessage(err, "Não foi possível salvar as alterações."),
      );
    }
  }

  // MUDANÇA: adicionado try/catch
  async function handleDelete() {
    if (!order) return;
    if (!window.confirm(`Excluir o pedido "${order.title}"?`)) return;
    setActionError(null);
    try {
      await deleteOrder(order.id);
      navigate("/orders", { replace: true });
    } catch (err) {
      setActionError(
        getApiErrorMessage(err, "Não foi possível excluir o pedido."),
      );
    }
  }

  function handleCopyLink() {
    if (!order) return;
    const url = `${window.location.origin}/pedido/${order.public_token}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <AppLayout title="Pedido">
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 size={24} className="animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (notFound || !order) {
    return (
      <AppLayout title="Pedido não encontrado">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-slate-400">Não encontramos esse pedido.</p>
          <Link
            to="/orders"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-slate-50 hover:bg-blue-500"
          >
            Voltar aos pedidos
          </Link>
        </div>
      </AppLayout>
    );
  }

  const meta = STATUS_META[order.status];
  const next = nextStatus(order.status);

  // MUDANÇA: flags de estado terminal para controle de ações
  const isRejected = order.status === "rejected";
  const isDelivered = order.status === "delivered";

  // Histórico mockado derivado do status atual do pedido.
  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const history: HistoryEntry[] = STATUS_ORDER.slice(0, currentIndex + 1).map(
    (status, i) => ({
      status,
      date: i === 0 ? order.created_at : order.updated_at,
    }),
  );

  return (
    <AppLayout title={order.title} subtitle={`Pedido #${order.id}`}>
      <div className="mb-4">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-100"
        >
          <ArrowLeft size={16} />
          Voltar aos pedidos
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">
                  {order.title}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {order.description}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${meta.badge}`}
              >
                {meta.label}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Info
                icon={CalendarDays}
                label="Prazo de entrega"
                value={formatDate(order.deadline)}
              />
              <Info
                icon={ArrowRight}
                label="Valor"
                value={formatCurrency(order.price)}
              />
            </div>
          </section>

          {/* Imagem de referência */}
          <section className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6">
            <h3 className="text-sm font-semibold text-slate-100">
              Imagem de referência
            </h3>
            <div className="mt-4">
              {order.reference_image ? (
                <img
                  src={order.reference_image}
                  alt={`Referência do pedido ${order.title}`}
                  className="max-h-80 w-full rounded-xl border border-slate-700 object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-12 text-slate-600">
                  <ImageOff size={28} />
                  <span className="text-sm">Nenhuma imagem enviada</span>
                </div>
              )}
            </div>
          </section>

          {/* Histórico de status */}
          <section className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6">
            <h3 className="text-sm font-semibold text-slate-100">
              Histórico de status
            </h3>
            <ol className="mt-5 flex flex-col gap-0">
              {history.map((entry, i) => {
                const m = STATUS_META[entry.status];
                const isLast = i === history.length - 1;
                return (
                  <li key={entry.status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-0.5 h-3 w-3 rounded-full ${m.dot}`}
                      />
                      {!isLast && (
                        <span className="my-1 w-px flex-1 bg-slate-700" />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className="text-sm font-medium text-slate-100">
                        {m.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(entry.date)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        {/* Coluna lateral - ações + cliente */}
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6">
            <h3 className="text-sm font-semibold text-slate-100">Ações</h3>

            {/* MUDANÇA: mensagem de erro de ação exibida acima dos botões */}
            {actionError && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-3">
              {/* ── PEDIDO REJEITADO: apenas exclusão disponível ──────── */}
              {/* MUDANÇA: quando rejeitado, todos os outros botões são ocultados. */}
              {/* Requisito: "a única opção disponível será EXCLUIR PEDIDO". */}
              {isRejected ? (
                <>
                  <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    Pedido rejeitado. Apenas a exclusão está disponível.
                  </div>
                  <button
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                    Excluir Pedido
                  </button>
                </>
              ) : (
                <>
                  {/* ── PEDIDO ENTREGUE: avançar e editar desabilitados ── */}
                  {/* MUDANÇA: exibe botões desabilitados em vez de não exibi-los. */}
                  {/* Requisito: "deixe com cor acinzentada e desative a função". */}
                  {isDelivered ? (
                    <button
                      disabled
                      title="Pedido já entregue — sem próxima etapa"
                      className="flex cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-700/30 px-4 py-2.5 text-sm font-semibold text-slate-500"
                    >
                      <ArrowRight size={16} />
                      Avançar pedido
                    </button>
                  ) : (
                    /* ── OUTROS STATUS: botão de avanço ativo ─────────── */
                    next && (
                      <button
                        onClick={handleAdvance}
                        className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-slate-50 transition hover:bg-blue-500"
                      >
                        <ArrowRight size={16} />
                        Avançar para {STATUS_META[next].label}
                      </button>
                    )
                  )}

                  {/* MUDANÇA: botão de edição desabilitado para entregue */}
                  <button
                    onClick={isDelivered ? undefined : () => setFormOpen(true)}
                    disabled={isDelivered}
                    title={
                      isDelivered
                        ? "Pedido já entregue — edição indisponível"
                        : undefined
                    }
                    className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                      isDelivered
                        ? "cursor-not-allowed border-slate-800 text-slate-500"
                        : "border-slate-700 text-slate-200 hover:bg-slate-700/50"
                    }`}
                  >
                    <Pencil size={16} />
                    Editar Pedido
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700/50"
                  >
                    {copied ? (
                      <Check size={16} className="text-emerald-400" />
                    ) : (
                      <Copy size={16} />
                    )}
                    {copied ? "Link copiado!" : "Copiar link do cliente"}
                  </button>

                  <button
                    onClick={handleDelete}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                    Excluir Pedido
                  </button>
                </>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6">
            <h3 className="text-sm font-semibold text-slate-100">Cliente</h3>
            <div className="mt-4 flex flex-col gap-2.5">
              <p className="flex items-center gap-2 text-sm text-slate-200">
                <User size={15} className="text-slate-500" />
                {order.client.name}
              </p>
              <p className="flex items-center gap-2 text-sm text-slate-400">
                <Mail size={15} className="text-slate-500" />
                {order.client.email ?? "—"}
              </p>
              <p className="flex items-center gap-2 text-sm text-slate-400">
                <Phone size={15} className="text-slate-500" />
                {order.client.phone ?? "—"}
              </p>
            </div>
          </section>
        </div>
      </div>

      <OrderForm
        open={formOpen}
        clients={clients}
        order={order}
        onClose={() => setFormOpen(false)}
        onSubmit={handleEdit}
      />
    </AppLayout>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Icon size={14} className="text-slate-500" />
        {label}
      </div>
      <p className="mt-1.5 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}
