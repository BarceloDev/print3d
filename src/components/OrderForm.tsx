import { useEffect, useState, type FormEvent } from "react";
import { ImagePlus, Loader2, Save } from "lucide-react";
import type { Client } from "../types/client";
import type { CreateOrderDTO, Order } from "../types/order";
import Modal from "./Modal";

interface OrderFormProps {
  open: boolean;
  clients: Client[];
  /** Pedido existente => modo edição. Ausente => modo criação. */
  order?: Order | null;
  onClose: () => void;
  onSubmit: (data: CreateOrderDTO) => Promise<void>;
}

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-slate-300";

export default function OrderForm({
  open,
  clients,
  order,
  onClose,
  onSubmit,
}: OrderFormProps) {
  const isEdit = Boolean(order);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [deadline, setDeadline] = useState("");
  const [clientId, setClientId] = useState<number | "">("");
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [imageName, setImageName] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reidrata o formulário sempre que abrir (criação x edição).
  useEffect(() => {
    if (!open) return;
    setTitle(order?.title ?? "");
    setDescription(order?.description ?? "");
    setPrice(order ? String(order.price) : "");
    setDeadline(order?.deadline ?? "");
    setClientId(order?.client.id ?? clients[0]?.id ?? "");
    setImageFile(undefined);
    setImageName("");
    setErrors({});
  }, [open, order, clients]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Informe o título.";
    if (!description.trim()) next.description = "Informe a descrição.";
    if (price === "" || Number(price) <= 0)
      next.price = "Informe um valor válido.";
    if (!deadline) next.deadline = "Informe o prazo.";
    if (clientId === "") next.clientId = "Selecione um cliente.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        deadline,
        client_id: Number(clientId),
        reference_image: imageFile,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? "Editar pedido" : "Novo pedido"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className={labelClass}>
          Título
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Suporte para monitor"
          />
          {errors.title && (
            <span className="text-xs text-red-400">{errors.title}</span>
          )}
        </label>

        <label className={labelClass}>
          Descrição
          <textarea
            className={`${inputClass} min-h-[88px] resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes do pedido"
          />
          {errors.description && (
            <span className="text-xs text-red-400">{errors.description}</span>
          )}
        </label>

        <label className={labelClass}>
          Cliente
          <select
            className={inputClass}
            value={clientId}
            onChange={(e) =>
              setClientId(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="" disabled>
              Selecione um cliente
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.clientId && (
            <span className="text-xs text-red-400">{errors.clientId}</span>
          )}
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            Prazo
            <input
              type="date"
              className={`${inputClass} [color-scheme:dark]`}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            {errors.deadline && (
              <span className="text-xs text-red-400">{errors.deadline}</span>
            )}
          </label>

          <label className={labelClass}>
            Valor (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
            />
            {errors.price && (
              <span className="text-xs text-red-400">{errors.price}</span>
            )}
          </label>
        </div>

        <label className={labelClass}>
          Imagem de referência (opcional)
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-900/70 px-3 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-800 text-sky-400">
              <ImagePlus size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <input
                id="order-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setImageFile(file);
                  setImageName(file?.name ?? "");
                }}
              />
              <label
                htmlFor="order-image"
                className="cursor-pointer text-sm font-medium text-sky-400 hover:text-blue-400"
              >
                Selecionar arquivo
              </label>
              <p className="truncate text-xs text-slate-500">
                {imageName || "PNG, JPG até alguns MB"}
              </p>
            </div>
          </div>
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
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}
