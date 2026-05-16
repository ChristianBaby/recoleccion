'use client'

import { useAuth } from '@/context/AuthContext'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full text-center space-y-4">
        <span className="text-4xl">🌿</span>
        <h1 className="text-2xl font-bold text-slate-900">
          ¡Bienvenido, {user?.firstName}!
        </h1>
        <p className="text-slate-500 text-sm">
          Has iniciado sesión como <strong>{user?.role}</strong>.
        </p>
        <p className="text-slate-400 text-xs">
          El dashboard completo se implementará en los próximos RF.
        </p>
        <button
          onClick={logout}
          className="w-full py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700
            font-medium rounded-lg text-sm transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
