import { useEffect, useState } from "react";
import {
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

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  function refresh() {
    Promise.all([getClients(), getOrders()])
      .then(([clientsData, ordersData]) => {
        setClients(clientsData);
        setOrders(ordersData);
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

  async function handleSubmit(data: Omit<Client, "id">) {
    if (editing) {
      await updateClient(editing.id, data);
    } else {
      await createClient(data);
    }
    refresh();
  }

  async function handleDelete(client: Client) {
    if (!window.confirm(`Excluir o cliente "${client.name}"?`)) return;
    await deleteClient(client.id);
    refresh();
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
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : clients.length === 0 ? (
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
