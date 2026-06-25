'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ProximityAlertListener from '@/components/ProximityAlertListener'

interface NavItem {
  href: string
  label: string
  roles: string[]
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Inicio',
    roles: ['ADMIN', 'OPERATOR', 'CITIZEN'],
  },
  {
    href: '/dashboard/profile',
    label: 'Mi Perfil',
    roles: ['ADMIN', 'OPERATOR', 'CITIZEN'],
  },
  {
    href: '/dashboard/zones',
    label: 'Zonas',
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    href: '/dashboard/routes',
    label: 'Rutas',
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    href: '/dashboard/vehicles',
    label: 'Vehículos',
    roles: ['ADMIN'],
  },
  {
    href: '/dashboard/waste-types',
    label: 'Residuos',
    roles: ['ADMIN', 'CITIZEN', 'OPERATOR'],
  },
  {
    href: '/dashboard/learn',
    label: 'Aprende a segregar',
    roles: ['ADMIN', 'CITIZEN', 'OPERATOR'],
  },
  {
    href: '/dashboard/incidents',
    label: 'Incidencias',
    roles: ['ADMIN', 'CITIZEN'],
  },
  {
    href: '/dashboard/tracking',
    label: 'Rastreo',
    roles: ['ADMIN', 'OPERATOR', 'CITIZEN'],
  },
  {
    href: '/dashboard/schedules',
    label: 'Horarios',
    roles: ['ADMIN', 'OPERATOR', 'CITIZEN'],
  },
  {
    href: '/dashboard/users',
    label: 'Usuarios',
    roles: ['ADMIN'],
  },
  {
    href: '/dashboard/reports',
    label: 'Reportes',
    roles: ['ADMIN'],
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role),
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="flex flex-col px-5 py-5 border-b border-slate-100">
          <span className="text-[10px] tracking-widest text-slate-400 font-bold block leading-none mb-1">
            SISTEMA DE
          </span>
          <span className="text-sm font-black text-slate-900 tracking-wide block leading-none">
            RECOLECCIÓN
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between py-2.5 transition-all relative ${
                  isActive
                    ? 'text-teal-900 font-bold px-5'
                    : 'text-slate-500 hover:text-slate-900 px-5 font-normal'
                }`}
              >
                {/* Indicador de barra izquierda para elemento activo */}
                {isActive && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-teal-700" />
                )}
                <span className="text-xs uppercase tracking-wider">{item.label}</span>
                {isActive && (
                  <span className="text-[10px] text-teal-600 font-semibold tracking-normal lowercase">activo</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 px-1 py-1 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xs shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase truncate">{user?.role === 'CITIZEN' ? 'Ciudadano' : user?.role === 'OPERATOR' ? 'Operador' : 'Administrador'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-left py-2 px-1 text-xs font-bold tracking-widest text-slate-400
              hover:text-red-600 transition-colors uppercase"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col justify-between bg-slate-50">
        <div className="flex-1 flex flex-col">
          {/* Header Superior */}
          <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-400 font-medium capitalize">
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider px-2.5 py-1 bg-slate-100 text-slate-600 rounded uppercase">
                {user?.role === 'CITIZEN' ? 'Ciudadano' : user?.role === 'OPERATOR' ? 'Operador' : 'Administrador'}
              </span>
            </div>
          </header>

          <div className="flex-1">
            {children}
          </div>
        </div>

        {/* Footer Inferior */}
        <footer className="border-t border-slate-200 bg-white px-8 py-4 text-center text-[10px] text-slate-400 font-semibold tracking-wider uppercase shrink-0">
          <span>Gobierno Municipal — Sistema de Recolección — © {new Date().getFullYear()}</span>
        </footer>
      </main>

      {/* RF-12: Alerta de proximidad del camión (solo ciudadanos) */}
      {user?.role === 'CITIZEN' && <ProximityAlertListener />}
    </div>
  )
}
