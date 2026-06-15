// ─── MUDANÇAS NESTE ARQUIVO ────────────────────────────────────────────────
// 1. Adicionados estados `error` e `planError`.
// 2. `refresh()` agora tem `.catch()` com distinção entre 403 (plano inativo)
//    e demais erros — antes qualquer falha da API travava o spinner
//    indefinidamente sem feedback ao usuário.
// 3. Adicionado tratamento de erro nas ações `handleSubmit` e `handleDelete`
//    com estado `actionError` para exibir mensagem inline em caso de falha.
// ───────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Crown,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import type { Client } from "../types/client";
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from "../services/clientService";
import { getOrders } from "../services/orderService";
import type { Order } from "../types/order";
import AppLayout from "../components/AppLayout";
import ClientForm from "../components/ClientForm";
// MUDANÇA: importadas as funções utilitárias de erro
import { getApiErrorMessage, isPlanInactiveError } from "../services/api";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  // MUDANÇA: estados de erro adicionados
  const [error, setError] = useState(false);
  const [planError, setPlanError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function refresh() {
    setLoading(true);
    setError(false);
    setPlanError(false);
    Promise.all([getClients(), getOrders()])
      .then(([clientsData, ordersData]) => {
        setClients(clientsData);
        setOrders(ordersData);
      })
      // MUDANÇA: .catch() ausente — adicionado para cobrir 403 (plano inativo)
      // e demais erros (500, sem rede). Antes qualquer falha travava o spinner.
      .catch((err) => {
        if (isPlanInactiveError(err)) {
          setPlanError(true);
        } else {
          setError(true);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setFormOpen(true);
  }

  // MUDANÇA: adicionado try/catch para mostrar erro caso a criação/edição falhe
  async function handleSubmit(data: Omit<Client, "id">) {
    setActionError(null);
    try {
      if (editing) {
        await updateClient(editing.id, data);
      } else {
        await createClient(data);
      }
      refresh();
    } catch (err) {
      setActionError(
        getApiErrorMessage(err, "Não foi possível salvar o cliente."),
      );
    }
  }

  // MUDANÇA: adicionado try/catch para mostrar erro caso a exclusão falhe
  async function handleDelete(client: Client) {
    if (!window.confirm(`Excluir o cliente "${client.name}"?`)) return;
    setActionError(null);
    try {
      await deleteClient(client.id);
      refresh();
    } catch (err) {
      setActionError(
        getApiErrorMessage(err, "Não foi possível excluir o cliente."),
      );
    }
  }

  return (
    <AppLayout
      title="Clientes"
      subtitle="Gerencie sua base de clientes"
      actions={
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-slate-50 transition hover:bg-blue-500"
        >
          <Plus size={18} />
          Novo Cliente
        </button>
      }
    >
      {/* MUDANÇA: mensagem de erro de ação exibida no topo do conteúdo */}
      {actionError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertTriangle size={16} />
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="ml-auto text-red-400 hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : /* MUDANÇA: renderização dos estados de erro ──────────────────── */
      planError ? (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-16 text-center">
          <Crown size={40} className="text-amber-400" />
          <div className="max-w-md">
            <h2 className="text-lg font-semibold text-slate-100">
              Plano inativo
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Você não tem permissão para acessar este recurso. Assine o plano
              premium para gerenciar clientes.
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
          >
            <Crown size={16} />
            Assinar agora
          </a>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-16 text-center">
          <AlertTriangle size={36} className="text-red-400" />
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Não foi possível carregar os clientes
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Verifique sua conexão ou tente novamente mais tarde.
            </p>
          </div>
          <button
            onClick={refresh}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            Tentar novamente
          </button>
        </div>
      ) : /* ─────────────────────────────────────────────────────────────── */
      clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-800 py-20 text-center">
          <Users size={32} className="text-slate-600" />
          <p className="text-sm text-slate-400">
            Nenhum cliente cadastrado ainda.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/60">
          {/* Tabela - desktop */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-5 py-3 font-medium">Telefone</th>
                <th className="px-5 py-3 font-medium">Pedidos</th>
                <th className="px-5 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="transition hover:bg-slate-800/40"
                >
                  <td className="px-5 py-3 font-medium text-slate-100">
                    {client.name}
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {client.email ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {client.phone ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-slate-700/60 px-2.5 py-1 text-xs font-medium text-sky-300">
                      {orders.filter((o) => o.client.id === client.id).length}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(client)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700 hover:text-sky-400"
                        aria-label={`Editar ${client.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(client)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                        aria-label={`Excluir ${client.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Cards - mobile */}
          <div className="flex flex-col divide-y divide-slate-800 md:hidden">
            {clients.map((client) => (
              <div key={client.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-slate-100">{client.name}</p>
                  <span className="rounded-full bg-slate-700/60 px-2.5 py-1 text-xs font-medium text-sky-300">
                    {orders.filter((o) => o.client.id === client.id).length}{" "}
                    pedidos
                  </span>
                </div>
                <p className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail size={14} className="text-slate-500" />
                  {client.email ?? "—"}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-400">
                  <Phone size={14} className="text-slate-500" />
                  {client.phone ?? "—"}
                </p>
                <div className="mt-1 flex gap-2">
                  <button
                    onClick={() => openEdit(client)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 py-2 text-sm text-slate-300"
                  >
                    <Pencil size={15} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(client)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-700 py-2 text-sm text-red-400"
                  >
                    <Trash2 size={15} />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ClientForm
        open={formOpen}
        client={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </AppLayout>
  );
}
