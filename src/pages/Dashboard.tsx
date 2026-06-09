import { useEffect, useState } from "react";
import DashboardCharts from "../components/DashboardCharts";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CircleDollarSign,
  Clock,
  Package,
  PackageCheck,
} from "lucide-react";
import type { Order } from "../types/order";
import { getOrders } from "../services/orderService";
import { STATUS_META, STATUS_ORDER, formatCurrency } from "../lib/orderStatus";
import AppLayout from "../components/AppLayout";

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getOrders().then((data) => {
      if (active) {
        setOrders(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const total = orders.length;
  const open = orders.filter((o) => o.status !== "delivered").length;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const revenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.price), 0);

  const metrics = [
    {
      label: "Total de pedidos",
      value: String(total),
      icon: Package,
      accent: "text-sky-400",
    },
    {
      label: "Pedidos em aberto",
      value: String(open),
      icon: Clock,
      accent: "text-amber-400",
    },
    {
      label: "Pedidos entregues",
      value: String(delivered),
      icon: PackageCheck,
      accent: "text-emerald-400",
    },
    {
      label: "Faturamento",
      value: formatCurrency(revenue),
      icon: CircleDollarSign,
      accent: "text-blue-400",
    },
  ];

  return (
    <AppLayout title="Dashboard" subtitle="Visão geral do seu negócio">
      {loading ? (
        <SkeletonGrid />
      ) : (
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

          {/* Mini preview do Kanban */}
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

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {STATUS_ORDER.map((status) => {
                const meta = STATUS_META[status];
                const count = orders.filter((o) => o.status === status).length;
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
              {orders.slice(0, 5).map((order) => {
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
              })}
            </div>
          </div>
          <DashboardCharts />
        </div>
      )}
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
