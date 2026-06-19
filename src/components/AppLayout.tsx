import { useState, type ReactNode } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { LayoutDashboard, LogOut, Menu, Package, Users, X } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import Logo from "./Logo"

interface AppLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  actions?: ReactNode
}

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "Pedidos", icon: Package },
  { to: "/clients", label: "Clientes", icon: Users },
]

export default function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate("/login", { replace: true })
  }

  function isActive(to: string) {
    return to === "/" ? location.pathname === "/" : location.pathname.startsWith(to)
  }

  const initials = (user?.name ?? "U")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar - desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-800 bg-slate-900 lg:flex">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <Logo size="sm" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive(to)
                  ? "bg-blue-600 text-slate-50"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Sidebar - mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-slate-800 bg-slate-900">
            <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
              <Logo size="sm" />
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-slate-100">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 p-4">
              {NAV.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive(to)
                      ? "bg-blue-600 text-slate-50"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-100">{title}</h1>
              {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-100">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 text-sm font-semibold text-sky-400 ring-1 ring-slate-700">
              {initials}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {actions && (
          <div className="flex flex-wrap items-center justify-end gap-3 px-4 pt-4 sm:px-6">
            {actions}
          </div>
        )}

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  )
}
