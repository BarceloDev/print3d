// ─── MUDANÇAS NESTE ARQUIVO ────────────────────────────────────────────────
// 1. `getOrders()` removido do Dashboard. Antes, carregava TODOS os pedidos
//    para calcular totais com JavaScript. Com paginação isso quebraria —
//    os totais refletiriam só os 5 primeiros de cada coluna.
//
// 2. `getStats()` adicionado — o banco calcula COUNT/SUM e devolve apenas
//    números. Independente de quantos pedidos existam, é sempre uma query
//    agregada leve.
//
// 3. `getRecentOrders(5)` adicionado — busca os 5 pedidos mais recentes
//    para a seção "Pedidos recentes" sem carregar todo o histórico.
//
// 4. Mini-funil de status usa `stats.by_status[status]` em vez de filtrar
//    o array de pedidos.
//
// 5. Tratamento de erro (planError / error) mantido do patch anterior.
// ───────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import DashboardCharts from "../components/DashboardCharts";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleDollarSign,
  Clock,
  Crown,
  Package,
  PackageCheck,
} from "lucide-react";
import type { Order } from "../types/order";
// MUDANÇA: getOrders removido; getStats e getRecentOrders adicionados.
import { getRecentOrders } from "../services/orderService";
import { getStats, type DashboardStats } from "../services/dashboardService";
import { STATUS_META, STATUS_ORDER, formatCurrency } from "../lib/orderStatus";
import AppLayout from "../components/AppLayout";
import { isPlanInactiveError } from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [planError, setPlanError] = useState(false);

  useEffect(() => {
    let active = true;

    // MUDANÇA: duas chamadas paralelas e leves em vez de uma que carregava
    // todos os pedidos. getStats() → apenas números agregados do banco.
    // getRecentOrders(5) → apenas os 5 pedidos mais recentes.
    Promise.all([getStats(), getRecentOrders(5)])
      .then(([statsData, recent]) => {
        if (active) {
          setStats(statsData);
          setRecentOrders(recent);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setLoading(false);
          if (isPlanInactiveError(err)) {
            setPlanError(true);
          } else {
            setError(true);
          }
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // MUDANÇA: métricas lidas de `stats` em vez de calculadas no JS.
  const metrics = stats
    ? [
        {
          label: "Total de pedidos",
          value: String(stats.total_orders),
          icon: Package,
          accent: "text-sky-400",
        },
        {
          label: "Pedidos em aberto",
          value: String(stats.open_orders),
          icon: Clock,
          accent: "text-amber-400",
        },
        {
          label: "Pedidos entregues",
          value: String(stats.delivered_orders),
          icon: PackageCheck,
          accent: "text-emerald-400",
        },
        {
          label: "Faturamento",
          value: formatCurrency(stats.total_revenue),
          icon: CircleDollarSign,
          accent: "text-blue-400",
        },
      ]
    : [];

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do seu negócio">
      {loading ? (
        <SkeletonGrid />
      ) : planError ? (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-16 text-center">
          <Crown size={40} className="text-amber-400" />
          <div className="max-w-md">
            <h2 className="text-lg font-semibold text-slate-100">
              Plano inativo
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Você não tem permissão para acessar este recurso. Assine o plano
              premium para desbloquear o painel completo.
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
              Não foi possível carregar o dashboard
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Verifique sua conexão ou tente novamente mais tarde.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            Tentar novamente
          </button>
        </div>
      ) : stats ? (
        <div className="flex flex-col gap-6">
          {/* Métricas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon, accent }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-800 bg-slate-800/60 p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">{label}</span>
                  <Icon size={20} className={accent} />
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-100">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Mini funil de status */}
          <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  Funil de pedidos
                </h2>
                <p className="text-sm text-slate-400">
                  Contagem por etapa do Kanban
                </p>
              </div>
              <Link
                to="/orders"
                className="flex items-center gap-1 text-sm font-medium text-sky-400 hover:text-blue-400"
              >
                Ver Kanban
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {STATUS_ORDER.map((status) => {
                const meta = STATUS_META[status];
                // MUDANÇA: contagem vem de stats.by_status — não filtra array.
                const count = stats.by_status[status] ?? 0;
                return (
                  <div
                    key={status}
                    className={`rounded-xl border border-t-4 border-slate-700 bg-slate-900/60 p-4 ${meta.topBorder}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                      <span className="text-xs font-medium text-slate-400">
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-100">
                      {count}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pedidos recentes */}
          <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-5">
            <h2 className="text-base font-semibold text-slate-100">
              Pedidos recentes
            </h2>
            <div className="mt-4 flex flex-col divide-y divide-slate-800">
              {recentOrders.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  Nenhum pedido cadastrado ainda.
                </p>
              ) : (
                recentOrders.map((order) => {
                  const meta = STATUS_META[order.status];
                  return (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="flex items-center justify-between gap-3 py-3 transition hover:opacity-80"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-100">
                          {order.title}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {order.client.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-100">
                          {formatCurrency(order.price)}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          <DashboardCharts />
        </div>
      ) : null}
    </AppLayout>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-2xl border border-slate-800 bg-slate-800/40"
        />
      ))}
    </div>
  );
}
