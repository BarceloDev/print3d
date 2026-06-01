import type { Client } from "./client";

export type OrderStatus =
  | "budget"
  | "approved"
  | "printing"
  | "done"
  | "delivered"
  | "rejected";

export interface Order {
  id: number;
  title: string;
  description: string;
  price: number;
  deadline: string;
  status: OrderStatus;
  public_token: string;
  reference_image: string | null;
  client: Client;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderDTO {
  title: string;
  description: string;
  price: number;
  deadline: string;
  client_id: number;
  reference_image?: File;
}
