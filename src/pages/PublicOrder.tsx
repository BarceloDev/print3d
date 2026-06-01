import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import {
  CalendarDays,
  CheckCircle2,
  ImageOff,
  Loader2,
  PackageX,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react"
import type { Order } from "../types/order"
import { approveOrder, getPublicOrder, rejectOrder } from "../services/orderService"
import { STATUS_META, formatCurrency, formatDate } from "../lib/orderStatus"
import Logo from "../components/Logo"

type Decision = "approved" | "rejected" | null

export default function PublicOrder() {
  const { token } = useParams<{ token: string }>()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [decision, setDecision] = useState<Decision>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    if (!token) {
      setNotFound(true)
      setLoading(false)
      return
    }
    getPublicOrder(token)
      .then((o) => {
        if (active) {
          setOrder(o)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setNotFound(true)
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [token])

  async function handleApprove() {
    if (!token) return
    setSubmitting(true)
    try {
      await approveOrder(token)
      setOrder((prev) => (prev ? { ...prev, status: "approved" } : prev))
      setDecision("approved")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject() {
    if (!token) return
    setSubmitting(true)
    try {
      await rejectOrder(token)
      setDecision("rejected")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-950">
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-900/40 to-slate-950 blur-3xl" />

      {/* Topo discreto */}
      <header className="relative flex items-center justify-center border-b border-slate-800/60 py-5">
        <Logo size="sm" />
      </header>

      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-slate-500">
            <Loader2 size={26} className="animate-spin" />
          </div>
        ) : notFound || !order ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <PackageX size={36} className="text-slate-600" />
            <h1 className="text-lg font-semibold text-slate-100">Orçamento não encontrado</h1>
            <p className="text-sm text-slate-400">
              Verifique se o link está correto ou solicite um novo ao vendedor.
            </p>
          </div>
        ) : (
          <PublicContent
            order={order}
            decision={decision}
            submitting={submitting}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
      </main>

      <footer className="relative border-t border-slate-800/60 py-5 text-center text-xs text-slate-600">
        Orçamento gerado por PRINT3D
      </footer>
    </div>
  )
}

function PublicContent({
  order,
  decision,
  submitting,
  onApprove,
  onReject,
}: {
  order: Order
  decision: Decision
  submitting: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const meta = STATUS_META[order.status]
  const isBudget = order.status === "budget" && decision === null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meta.badge}`}>
          {meta.label}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-100">{order.title}</h1>
        <p className="mt-2 text-slate-400">{order.description}</p>
      </div>

      {/* Imagem de referência */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-800/60">
        {order.reference_image ? (
          <img
            src={order.reference_image || "/placeholder.svg"}
            alt={`Referência de ${order.title}`}
            className="max-h-72 w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-slate-600">
            <ImageOff size={28} />
            <span className="text-sm">Sem imagem de referência</span>
          </div>
        )}
      </div>

      {/* Valor e prazo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-5">
          <p className="text-xs text-slate-400">Valor do orçamento</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{formatCurrency(order.price)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-5">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <CalendarDays size={13} /> Prazo de entrega
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{formatDate(order.deadline)}</p>
        </div>
      </div>

      {/* Decisão registrada */}
      {decision === "approved" && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-300">
          <CheckCircle2 size={22} />
          <div>
            <p className="font-semibold">Orçamento aprovado!</p>
            <p className="text-sm text-emerald-200/80">
              Obrigado. Vamos iniciar a produção do seu pedido.
            </p>
          </div>
        </div>
      )}
      {decision === "rejected" && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
          <ThumbsDown size={22} />
          <div>
            <p className="font-semibold">Orçamento recusado</p>
            <p className="text-sm text-red-200/80">
              Registramos sua resposta. O vendedor entrará em contato.
            </p>
          </div>
        </div>
      )}

      {/* Ações ou status descritivo */}
      {isBudget ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onApprove}
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-slate-50 transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <ThumbsUp size={18} />}
            Aprovar Orçamento
          </button>
          <button
            onClick={onReject}
            disabled={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-semibold text-slate-50 transition hover:bg-red-500 disabled:opacity-60"
          >
            <ThumbsDown size={18} />
            Recusar
          </button>
        </div>
      ) : (
        decision === null && (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-800/60 p-5">
            <span className={`h-3 w-3 shrink-0 rounded-full ${meta.dot}`} />
            <p className="text-sm text-slate-300">{meta.publicMessage}</p>
          </div>
        )
      )}
    </div>
  )
}
