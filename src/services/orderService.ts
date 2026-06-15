// ─── MUDANÇAS NESTE ARQUIVO ────────────────────────────────────────────────
// 1. Adicionada interface `OrderPage` — tipagem do objeto paginado que o
//    Laravel retorna quando `per_page` é passado.
// 2. Adicionada `getOrdersByStatus()` — busca uma página de pedidos de um
//    status específico. Usada pelo Kanban para carregar cada coluna.
// 3. Adicionada `getRecentOrders()` — busca os N pedidos mais recentes de
//    todos os status. Usada pela seção "Pedidos recentes" do Dashboard.
//    Extrai `.data` do objeto paginado retornado pelo backend.
// ───────────────────────────────────────────────────────────────────────────

import type { CreateOrderDTO, Order, OrderStatus } from "../types/order";
import api from "./api";

// MUDANÇA: tipagem do objeto paginado do Laravel.
export interface OrderPage {
  data: Order[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export async function getOrders(): Promise<Order[]> {
  const res = await api.get("/orders");
  return res.data as Order[];
}

/**
 * MUDANÇA: busca paginada de pedidos por status.
 * Chamada pelo Kanban individualmente para cada coluna.
 *
 * GET /orders?status=printing&per_page=5&page=2
 */
export async function getOrdersByStatus(
  status: OrderStatus,
  page = 1,
  perPage = 5,
): Promise<OrderPage> {
  const res = await api.get("/orders", {
    params: { status, page, per_page: perPage },
  });
  return res.data as OrderPage;
}

/**
 * MUDANÇA: busca os N pedidos mais recentes (todos os status).
 * Usada pela seção "Pedidos recentes" do Dashboard.
 * O backend retorna objeto paginado — extraímos apenas o array `.data`.
 *
 * GET /orders?per_page=5
 */
export async function getRecentOrders(limit = 5): Promise<Order[]> {
  const res = await api.get("/orders", { params: { per_page: limit } });
  const payload = res.data as OrderPage;
  return payload.data;
}

export async function getOrder(id: number): Promise<Order> {
  const res = await api.get(`/orders/${id}`);
  return res.data as Order;
}

export async function createOrder(data: CreateOrderDTO): Promise<Order> {
  if (data.reference_image instanceof File) {
    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("description", data.description);
    fd.append("price", String(data.price));
    fd.append("deadline", data.deadline);
    fd.append("client_id", String(data.client_id));
    fd.append("reference_image", data.reference_image);
    const res = await api.post("/orders", fd);
    return res.data as Order;
  }
  const res = await api.post("/orders", data);
  return res.data as Order;
}

export async function updateOrder(
  id: number,
  data: Partial<CreateOrderDTO>,
): Promise<Order> {
  if (data.reference_image instanceof File) {
    const fd = new FormData();
    if (data.title !== undefined) fd.append("title", data.title);
    if (data.description !== undefined)
      fd.append("description", data.description);
    if (data.price !== undefined) fd.append("price", String(data.price));
    if (data.deadline !== undefined) fd.append("deadline", data.deadline);
    if (data.client_id !== undefined)
      fd.append("client_id", String(data.client_id));
    fd.append("reference_image", data.reference_image);
    const res = await api.put(`/orders/${id}`, fd);
    return res.data as Order;
  }
  const res = await api.put(`/orders/${id}`, data);
  return res.data as Order;
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus,
): Promise<Order> {
  const res = await api.patch(`/orders/${id}/status`, { status });
  return res.data as Order;
}

export async function deleteOrder(id: number): Promise<void> {
  await api.delete(`/orders/${id}`);
}

export async function getPublicOrder(token: string): Promise<Order> {
  const res = await api.get(`/public/orders/${token}`);
  return res.data as Order;
}

export async function approveOrder(token: string): Promise<void> {
  await api.patch(`/public/orders/${token}/approve`);
}

export async function rejectOrder(token: string): Promise<void> {
  await api.patch(`/public/orders/${token}/reject`);
}
