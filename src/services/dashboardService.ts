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

export async function getCharts(range: ChartRange): Promise<ChartsData> {
  const res = await api.get(`/dashboard/charts?range=${range}`);
  return res.data as ChartsData;
}
