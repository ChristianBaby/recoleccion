'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard,
  MapPin,
  Route,
  Truck,
  LogOut,
  ChevronRight,
  Leaf,
  Recycle,
  AlertTriangle,
  Activity,
  CalendarDays,
  BarChart2,
  BookOpen,
  Users,
  UserCircle,
} from 'lucide-react'
import ProximityAlertListener from '@/components/ProximityAlertListener'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: string[]
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Inicio',
    icon: <LayoutDashboard size={18} />,
    roles: ['ADMIN', 'OPERATOR', 'CITIZEN'],
  },
  {
    href: '/dashboard/profile',
    label: 'Mi Perfil',
    icon: <UserCircle size={18} />,
    roles: ['ADMIN', 'OPERATOR', 'CITIZEN'],
  },
  {
    href: '/dashboard/zones',
    label: 'Zonas',
    icon: <MapPin size={18} />,
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    href: '/dashboard/routes',
    label: 'Rutas',
    icon: <Route size={18} />,
    roles: ['ADMIN', 'OPERATOR'],
  },
  {
    href: '/dashboard/vehicles',
    label: 'Vehículos',
    icon: <Truck size={18} />,
    roles: ['ADMIN'],
  },
  {
    href: '/dashboard/waste-types',
    label: 'Residuos',
    icon: <Recycle size={18} />,
    roles: ['ADMIN', 'CITIZEN', 'OPERATOR'],
  },
  {
    href: '/dashboard/learn',
    label: 'Aprende a segregar',
    icon: <BookOpen size={18} />,
    roles: ['ADMIN', 'CITIZEN', 'OPERATOR'],
  },
  {
    href: '/dashboard/incidents',
    label: 'Incidencias',
    icon: <AlertTriangle size={18} />,
    roles: ['ADMIN', 'CITIZEN'],
  },
  {
    href: '/dashboard/tracking',
    label: 'Rastreo',
    icon: <Activity size={18} />,
    roles: ['ADMIN', 'OPERATOR', 'CITIZEN'],
  },
  {
    href: '/dashboard/schedules',
    label: 'Horarios',
    icon: <CalendarDays size={18} />,
    roles: ['ADMIN', 'OPERATOR', 'CITIZEN'],
  },
  {
    href: '/dashboard/users',
    label: 'Usuarios',
    icon: <Users size={18} />,
    roles: ['ADMIN'],
  },
  {
    href: '/dashboard/reports',
    label: 'Reportes',
    icon: <BarChart2 size={18} />,
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
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="font-semibold text-slate-900 text-sm">EcoRutas Cusco</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {visibleItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-emerald-500" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xs shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500
              hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* RF-12: Alerta de proximidad del camión (solo ciudadanos) */}
      {user?.role === 'CITIZEN' && <ProximityAlertListener />}
    </div>
  )
}
