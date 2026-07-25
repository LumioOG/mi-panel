import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  DollarSign,
  ListChecks,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { titulo: 'Dashboard', to: '/', icono: LayoutDashboard, exact: true },
  { titulo: 'Clientes', to: '/clientes', icono: Users },
  { titulo: 'Comisiones', to: '/comisiones', icono: DollarSign },
  { titulo: 'Tareas generales', to: '/tareas', icono: ListChecks },
]

export default function AppLayout() {
  const { logout } = useAuth()
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)

  function estaActivo(item) {
    return item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
  }

  const contenidoSidebar = (
    <div className="h-full flex flex-col bg-lumio-blueberry text-white rounded-3xl p-5">
      <div className="pb-6 mb-2 border-b border-white/10">
        <p className="font-display text-lg">Mi Panel</p>
        <p className="text-xs text-white/50">Lumio</p>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const Icono = item.icono
          const activo = estaActivo(item)
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuAbierto(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                activo ? 'bg-lumio-burgundy text-white' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Icono size={18} strokeWidth={2} />
              {item.titulo}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 mt-2"
      >
        <LogOut size={18} strokeWidth={2} />
        Salir
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-lumio-bg md:flex md:p-4 md:gap-4">
      <aside className="hidden md:block md:w-64 md:shrink-0">
        <div className="sticky top-4 h-[calc(100vh-2rem)]">{contenidoSidebar}</div>
      </aside>

      <header className="md:hidden bg-lumio-blueberry text-white px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-display text-lg">
          Mi Panel
        </Link>
        <button onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
          <Menu size={22} />
        </button>
      </header>

      {menuAbierto && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 p-3">
            <div className="relative h-full">
              <button
                onClick={() => setMenuAbierto(false)}
                className="absolute -right-1 -top-1 z-10 bg-white text-lumio-blueberry rounded-full p-1.5 shadow-md"
                aria-label="Cerrar menú"
              >
                <X size={18} />
              </button>
              {contenidoSidebar}
            </div>
          </div>
          <div
            className="flex-1 bg-black/30"
            onClick={() => setMenuAbierto(false)}
            aria-hidden="true"
          />
        </div>
      )}

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
