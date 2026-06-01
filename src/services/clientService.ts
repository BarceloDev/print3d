import type { Client } from "../types/client";
import api from "./api";
import { getOrders } from "./orderService";

/**
 * Service de clientes. Opera sobre o repositório em memória (mockData).
 * As assinaturas espelham as chamadas Axios que serão feitas contra a API real.
 */

export async function getClients(): Promise<Client[]> {
  const res = await api.get("/clients");
  return res.data as Client[];
}

export async function createClient(data: Omit<Client, "id">): Promise<Client> {
  const res = await api.post("/clients", data);
  return res.data as Client;
}

export async function updateClient(
  id: number,
  data: Partial<Client>,
): Promise<Client> {
  const res = await api.put(`/clients/${id}`, data);
  return res.data as Client;
}

export async function deleteClient(id: number): Promise<void> {
  await api.delete(`/clients/${id}`);
}

/** Conta quantos pedidos pertencem a cada cliente (consulta a API de pedidos). */
export async function countOrdersByClient(clientId: number): Promise<number> {
  const orders = await getOrders();
  return orders.filter((o) => o.client.id === clientId).length;
}
