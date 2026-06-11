'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'

interface Props {
  role: string
  zoneId?: string | null
  children: React.ReactNode
}

export default function ZoneGuard({ role, zoneId, children }: Props) {
  if (role === 'ADMIN') return <>{children}</>
  if (role === 'OPERATOR') return <>{children}</>
  if (zoneId) return <>{children}</>

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
        <MapPin size={28} className="text-amber-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">Sin zona asignada</h3>
      <p className="text-slate-500 text-sm max-w-sm mb-5 leading-relaxed">
        Necesitas tener una zona de recolección asignada para acceder a esta sección.
        Puedes seleccionar tu ubicación desde tu perfil o esperar que el administrador te asigne una.
      </p>
      <Link
        href="/dashboard/profile"
        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700
          text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <MapPin size={15} />
        Seleccionar mi zona
      </Link>
    </div>
  )
}
