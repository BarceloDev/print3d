import type { CreateOrderDTO, Order, OrderStatus } from "../types/order";
import api from "./api";

/**
 * Service de pedidos. Opera sobre o repositório em memória (mockData).
 * As assinaturas espelham as chamadas Axios que serão feitas contra a API real.
 */

export async function getOrders(): Promise<Order[]> {
  const res = await api.get("/orders");
  return res.data as Order[];
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
