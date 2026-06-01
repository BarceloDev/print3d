import { useEffect, useState } from "react"
import { Loader2, Plus } from "lucide-react"
import type { Client } from "../types/client"
import type { CreateOrderDTO, Order, OrderStatus } from "../types/order"
import { createOrder, getOrders, updateOrderStatus } from "../services/orderService"
import { getClients } from "../services/clientService"
import AppLayout from "../components/AppLayout"
import KanbanBoard from "../components/KanbanBoard"
import OrderForm from "../components/OrderForm"

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([getOrders(), getClients()]).then(([o, c]) => {
      if (active) {
        setOrders(o)
        setClients(c)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  async function handleStatusChange(orderId: number, status: OrderStatus) {
    // Atualização otimista da UI.
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
    await updateOrderStatus(orderId, status)
  }

  async function handleCreate(data: CreateOrderDTO) {
    const created = await createOrder(data)
    setOrders((prev) => [created, ...prev])
  }

  return (
    <AppLayout
      title="Pedidos"
      subtitle="Arraste os cards entre as colunas para mudar o status"
      actions={
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-slate-50 transition hover:bg-blue-500"
        >
          <Plus size={18} />
          Novo Pedido
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : (
        <KanbanBoard orders={orders} onStatusChange={handleStatusChange} />
      )}

      <OrderForm
        open={formOpen}
        clients={clients}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
    </AppLayout>
  )
}
