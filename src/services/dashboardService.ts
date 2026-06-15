// ─── MUDANÇAS NESTE ARQUIVO ────────────────────────────────────────────────
// 1. Adicionada interface `DashboardStats` — tipagem da resposta do novo
//    endpoint GET /dashboard/stats.
// 2. Adicionada `getStats()` — busca métricas agregadas (totais e receita)
//    sem carregar nenhum pedido. Substitui o getOrders() que o Dashboard.tsx
//    usava para calcular os mesmos números no JavaScript.
// ───────────────────────────────────────────────────────────────────────────

import api from "./api";

export type ChartRange = "7d" | "30d" | "12m";

export interface FunnelItem {
  label: string;
  value: number;
}

export interface ChartsData {
  labels: string[];
  revenue: number[];
  orders: number[];
  funnel: FunnelItem[];
}

// MUDANÇA: interface para o novo endpoint /dashboard/stats.
export interface DashboardStats {
  total_orders: number;
  open_orders: number;
  delivered_orders: number;
  rejected_orders: number;
  total_revenue: number;
  /** Contagem bruta por status — usado para o mini-funil do Dashboard. */
  by_status: Record<string, number>;
}

/**
 * MUDANÇA: busca métricas agregadas do dashboard.
 * O banco faz COUNT/SUM — o frontend recebe apenas números prontos.
 *
 * GET /dashboard/stats
 */
export async function getStats(): Promise<DashboardStats> {
  const res = await api.get("/dashboard/stats");
  return res.data as DashboardStats;
}

export async function getCharts(range: ChartRange): Promise<ChartsData> {
  const res = await api.get(`/dashboard/charts?range=${range}`);
  return res.data as ChartsData;
}
