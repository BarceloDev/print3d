import { Boxes } from "lucide-react"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const SIZES = {
  sm: { icon: 18, text: "text-lg", box: "h-8 w-8" },
  md: { icon: 22, text: "text-xl", box: "h-10 w-10" },
  lg: { icon: 28, text: "text-3xl", box: "h-14 w-14" },
}

/**
 * Identidade visual da marca PRINT3D — ícone em caixa azul + wordmark.
 */
export default function Logo({ size = "md", className = "" }: LogoProps) {
  const s = SIZES[size]
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span
        className={`grid place-items-center rounded-xl bg-blue-600 text-slate-50 shadow-lg shadow-blue-900/40 ${s.box}`}
      >
        <Boxes size={s.icon} strokeWidth={2.2} />
      </span>
      <span className={`font-bold tracking-tight ${s.text}`}>
        <span className="text-slate-100">PRINT</span>
        <span className="text-sky-400">3D</span>
      </span>
    </div>
  )
}
