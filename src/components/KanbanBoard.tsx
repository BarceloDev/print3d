import { useState, type DragEvent } from "react"
import type { Order, OrderStatus } from "../types/order"
import { STATUS_META, STATUS_ORDER } from "../lib/orderStatus"
import OrderCard from "./OrderCard"

interface KanbanBoardProps {
  orders: Order[]
  onStatusChange: (orderId: number, status: OrderStatus) => void
}

export default function KanbanBoard({ orders, onStatusChange }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [overColumn, setOverColumn] = useState<OrderStatus | null>(null)

  function handleDrop(event: DragEvent, status: OrderStatus) {
    event.preventDefault()
    const id = Number(event.dataTransfer.getData("text/plain"))
    setOverColumn(null)
    setDraggingId(null)
    if (!Number.isNaN(id)) {
      const order = orders.find((o) => o.id === id)
      if (order && order.status !== status) {
        onStatusChange(id, status)
      }
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin lg:grid lg:grid-cols-5 lg:overflow-visible">
      {STATUS_ORDER.map((status) => {
        const meta = STATUS_META[status]
        const columnOrders = orders.filter((o) => o.status === status)
        const isOver = overColumn === status

        return (
          <section
            key={status}
            onDragOver={(e) => {
              e.preventDefault()
              setOverColumn(status)
            }}
            onDragLeave={(e) => {
              // Evita piscar quando o cursor passa por filhos.
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverColumn(null)
            }}
            onDrop={(e) => handleDrop(e, status)}
            className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-slate-900/50 transition lg:w-auto ${
              isOver ? "border-blue-500 bg-slate-900" : "border-slate-800"
            }`}
          >
            <header className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                <span className={`text-sm font-semibold ${meta.columnHeader}`}>{meta.label}</span>
              </div>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">
                {columnOrders.length}
              </span>
            </header>

            <div className="flex flex-1 flex-col gap-3 p-3">
              {columnOrders.map((order) => (
                <div key={order.id} className={draggingId === order.id ? "opacity-50" : ""}>
                  <OrderCard
                    order={order}
                    draggable
                    onDragStart={setDraggingId}
                    onDragEnd={() => setDraggingId(null)}
                  />
                </div>
              ))}

              {columnOrders.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-800 py-8 text-xs text-slate-600">
                  Solte um pedido aqui
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
