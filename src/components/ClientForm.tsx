import { useEffect, useState, type FormEvent } from "react"
import { Loader2, Save } from "lucide-react"
import type { Client } from "../types/client"
import Modal from "./Modal"

interface ClientFormProps {
  open: boolean
  /** Cliente existente => modo edição. Ausente => modo criação. */
  client?: Client | null
  onClose: () => void
  onSubmit: (data: Omit<Client, "id">) => Promise<void>
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-slate-300"

export default function ClientForm({ open, client, onClose, onSubmit }: ClientFormProps) {
  const isEdit = Boolean(client)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(client?.name ?? "")
    setEmail(client?.email ?? "")
    setPhone(client?.phone ?? "")
    setError(null)
  }, [open, client])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError("Informe o nome do cliente.")
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title={isEdit ? "Editar cliente" : "Novo cliente"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className={labelClass}>
          Nome
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome completo"
          />
          {error && <span className="text-xs text-red-400">{error}</span>}
        </label>

        <label className={labelClass}>
          E-mail (opcional)
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@email.com"
          />
        </label>

        <label className={labelClass}>
          Telefone (opcional)
          <input
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-0000"
          />
        </label>

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700/50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-slate-50 transition hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  )
}
