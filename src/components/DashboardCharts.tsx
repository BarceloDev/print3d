import { useEffect, useState } from "react";
import { BarChart2, Loader2, TrendingUp, PieChart } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ChartRange, ChartsData } from "../services/dashboardService";
import { getCharts } from "../services/dashboardService";
import { formatCurrency } from "../lib/orderStatus";

// ---------------------------------------------------------------------------
// Paletas de cores
// ---------------------------------------------------------------------------
// Uma cor distinta por barra (eixo X tem até 30 barras nos 30 dias,
// mas 7 e 12 ficam bem com essa paleta cíclica)
const BAR_COLORS = [
  "#38bdf8", // sky-400
  "#818cf8", // indigo-400
  "#34d399", // emerald-400
  "#fb923c", // orange-400
  "#f472b6", // pink-400
  "#a78bfa", // violet-400
  "#facc15", // yellow-400
];

// Uma cor por fatia do pie, mapeada na ordem dos status
const PIE_COLORS = [
  "#f59e0b", // amber  — Orçamento
  "#38bdf8", // sky    — Aprovado
  "#8b5cf6", // violet — Imprimindo
  "#10b981", // emerald— Pronto
  "#64748b", // slate  — Entregue
  "#f43f5e", // rose   — Rejeitado
];

// ---------------------------------------------------------------------------
// Tooltip customizado — fundo escuro igual ao tema do app
// ---------------------------------------------------------------------------
function DarkTooltip({ active, payload, label, isCurrency = false }: {
  active?: boolean;
  payload?: { value: number; color?: string }[];
  label?: string;
  isCurrency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-slate-300">{label}</p>
      <p style={{ color: payload[0].color ?? "#38bdf8" }}>
        {isCurrency ? formatCurrency(val) : `${val} pedido${val !== 1 ? "s" : ""}`}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
const RANGE_LABELS: Record<ChartRange, string> = {
  "7d":  "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "12m": "Últimos 12 meses",
};

export default function DashboardCharts() {
  const [range, setRange] = useState<ChartRange>("7d");
  const [data, setData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getCharts(range).then((d) => {
      if (active) {
        setData(d);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [range]);

  // Recharts espera array de objetos — transformação feita aqui,
  // mantendo dashboardService.ts agnóstico à lib de gráficos
  const timeData = data
    ? data.labels.map((label, i) => ({
        name: label,
        revenue: data.revenue[i],
        orders: data.orders[i],
      }))
    : [];

  const totalRevenue = data?.revenue.reduce((s, v) => s + v, 0) ?? 0;
  const totalOrders  = data?.orders.reduce((s, v) => s + v, 0) ?? 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-5">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Análise de desempenho
          </h2>
          <p className="text-sm text-slate-400">
            Pedidos com status{" "}
            <span className="font-medium text-slate-300">Entregue</span>
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as ChartRange)}
          className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        >
          {(Object.keys(RANGE_LABELS) as ChartRange[]).map((r) => (
            <option key={r} value={r}>
              {RANGE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : (
        <>
          {/* Totalizadores */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
              <p className="text-xs text-slate-400">Faturamento no período</p>
              <p className="mt-1 text-lg font-bold text-sky-400">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
              <p className="text-xs text-slate-400">Pedidos entregues</p>
              <p className="mt-1 text-lg font-bold text-emerald-400">
                {totalOrders}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Gráfico de colunas — faturamento */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <BarChart2 size={15} className="text-sky-400" />
                <span className="text-xs font-semibold text-slate-300">
                  Faturamento por período
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={timeData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                    }
                    width={52}
                  />
                  <Tooltip
                    content={<DarkTooltip isCurrency />}
                    cursor={{ fill: "rgba(51,65,85,0.4)" }}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {timeData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={BAR_COLORS[index % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de linhas — pedidos */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp size={15} className="text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">
                  Pedidos entregues por período
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timeData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={28}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    dot={{ fill: "#34d399", strokeWidth: 2, r: 4, stroke: "#0f172a" }}
                    activeDot={{ r: 6, stroke: "#0f172a", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de pizza — distribuição por status */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 lg:col-span-2">
              <div className="mb-3 flex items-center gap-2">
                <PieChart size={15} className="text-amber-400" />
                <span className="text-xs font-semibold text-slate-300">
                  Distribuição por status
                </span>
              </div>
              {data?.funnel.length === 0 ? (
                <p className="py-12 text-center text-sm text-slate-500">
                  Nenhum pedido cadastrado ainda.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <RechartsPie>
                    <Pie
                      data={data?.funnel}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      innerRadius={44}
                      paddingAngle={3}
                      label={({ name, percent }) =>
                        percent > 0.05
                          ? `${Math.round(percent * 100)}%`
                          : ""
                      }
                      labelLine={false}
                    >
                      {data?.funnel.map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                          stroke="#0f172a"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} pedido${value !== 1 ? "s" : ""}`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "#e2e8f0",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                          {value}
                        </span>
                      )}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
