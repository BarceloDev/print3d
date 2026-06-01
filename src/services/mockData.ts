import type { Client } from "../types/client"
import type { Order } from "../types/order"

/**
 * Repositório em memória que simula o backend enquanto a API real não está conectada.
 * Os services importam estes arrays e os mutam para que a navegação reflita as mudanças.
 */

export const mockClients: Client[] = [
  { id: 1, name: "Carlos Oliveira", email: "carlos@email.com", phone: "(11) 99999-0001" },
  { id: 2, name: "Ana Souza", email: "ana@email.com", phone: "(21) 98888-0002" },
  { id: 3, name: "Pedro Lima", email: null, phone: "(31) 97777-0003" },
]

export const mockOrders: Order[] = [
  {
    id: 1,
    title: "Suporte para monitor",
    description: 'Suporte articulado para monitor 27"',
    price: 120.0,
    deadline: "2026-06-10",
    status: "budget",
    public_token: "abc-123",
    reference_image: null,
    client: mockClients[0],
    created_at: "2026-05-01",
    updated_at: "2026-05-01",
  },
  {
    id: 2,
    title: "Case para raspberry pi 4",
    description: "Case com ventilação lateral",
    price: 75.0,
    deadline: "2026-06-05",
    status: "printing",
    public_token: "def-456",
    reference_image: null,
    client: mockClients[1],
    created_at: "2026-05-03",
    updated_at: "2026-05-05",
  },
  {
    id: 3,
    title: "Miniatura personagem",
    description: "Miniatura 10cm de personagem customizado",
    price: 200.0,
    deadline: "2026-06-15",
    status: "approved",
    public_token: "ghi-789",
    reference_image: null,
    client: mockClients[2],
    created_at: "2026-05-05",
    updated_at: "2026-05-06",
  },
  {
    id: 4,
    title: "Organizador de cabos",
    description: "Clips organizadores de cabo para mesa",
    price: 45.0,
    deadline: "2026-05-28",
    status: "done",
    public_token: "jkl-012",
    reference_image: null,
    client: mockClients[0],
    created_at: "2026-05-10",
    updated_at: "2026-05-20",
  },
  {
    id: 5,
    title: "Porta canetas",
    description: "Porta canetas hexagonal modular",
    price: 60.0,
    deadline: "2026-05-20",
    status: "delivered",
    public_token: "mno-345",
    reference_image: null,
    client: mockClients[1],
    created_at: "2026-05-08",
    updated_at: "2026-05-19",
  },
]

/** Simula a latência de uma requisição de rede. */
export function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

let orderSeq = mockOrders.length
let clientSeq = mockClients.length

export function nextOrderId(): number {
  orderSeq += 1
  return orderSeq
}

export function nextClientId(): number {
  clientSeq += 1
  return clientSeq
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
