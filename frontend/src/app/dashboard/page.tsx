'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { ApiResponse, Zone, Route } from '@/types'
import {
  MapPin,
  Route as RouteIcon,
  TrendingUp,
  Navigation,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Stats {
  zones: number
  activeZones: number
  routes: number
  activeRoutes: number
}

// ─── RF-04: Banner de zona para ciudadanos ────────────────────────────────────

interface AssignedZone {
  id: string
  name: string
  district: string
  color: string
}

function ZoneBanner({
  onZoneAssigned,
}: {
  onZoneAssigned: (zone: AssignedZone) => void
}) {
  const { accessToken, updateZone } = useAuth()
  const [detecting, setDetecting] = useState(false)

  const handleDetect = useCallback(() => {
    if (!('geolocation' in navigator)) {
      toast.error('Tu navegador no soporta geolocalización')
      return
    }

    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.post<ApiResponse<AssignedZone | null>>(
            '/zones/assign-me',
            { lat: pos.coords.latitude, lng: pos.coords.longitude },
            accessToken!,
          )
          if (res.data) {
            updateZone(res.data.id)
            onZoneAssigned(res.data)
            toast.success(`Zona asignada: ${res.data.name}`)
          } else {
            toast.warning('Tu ubicación no pertenece a ninguna zona registrada aún.')
          }
        } catch {
          toast.error('Error al detectar la zona. Intenta nuevamente.')
        } finally {
          setDetecting(false)
        }
      },
      () => {
        toast.error('No se pudo obtener tu ubicación. Verifica los permisos del navegador.')
        setDetecting(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [accessToken, updateZone, onZoneAssigned])

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
      <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
        <MapPin size={16} className="text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">Sin zona asignada</p>
        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
          Detecta tu ubicación para ver los horarios y el rastreo de tu zona de recolección.
        </p>
      </div>
      <button
        onClick={handleDetect}
        disabled={detecting}
        className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600
          hover:bg-amber-700 disabled:bg-amber-400 text-white text-xs font-semibold
          transition-colors"
      >
        {detecting ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Navigation size={13} />
        )}
        {detecting ? 'Detectando…' : 'Detectar mi zona'}
      </button>
    </div>
  )
}

// ─── Tarjeta de zona asignada ─────────────────────────────────────────────────

function ZoneAssignedCard({
  zone,
  onDismiss,
}: {
  zone: AssignedZone
  onDismiss: () => void
}) {
  return (
    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-emerald-900">
          Zona asignada:{' '}
          <span style={{ color: zone.color }}>{zone.name}</span>
        </p>
        <p className="text-xs text-emerald-700 mt-0.5">{zone.district}</p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 text-emerald-400 hover:text-emerald-600 transition-colors"
        aria-label="Cerrar"
      >
        <X size={16} />
      </button>
    </div>
  )
}

// ─── Página principal del dashboard ──────────────────────────────────────────

export default function DashboardPage() {
  const { user, accessToken } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [assignedZone, setAssignedZone] = useState<AssignedZone | null>(null)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)

  useEffect(() => {
    if (!accessToken) return

    Promise.all([
      api.get<ApiResponse<Zone[]>>('/zones', accessToken),
      api.get<ApiResponse<Route[]>>('/routes', accessToken),
    ])
      .then(([zonesRes, routesRes]) => {
        const zones = zonesRes.data ?? []
        const routes = routesRes.data ?? []
        setStats({
          zones: zones.length,
          activeZones: zones.filter((z) => z.isActive).length,
          routes: routes.length,
          activeRoutes: routes.filter((r) => r.status === 'ACTIVE').length,
        })
      })
      .catch(() => setStats({ zones: 0, activeZones: 0, routes: 0, activeRoutes: 0 }))
  }, [accessToken])

  const handleZoneAssigned = useCallback((zone: AssignedZone) => {
    setAssignedZone(zone)
    setShowSuccessBanner(true)
  }, [])

  const isCitizen = user?.role === 'CITIZEN'
  const hasZone = !!user?.zoneId
  const showDetectBanner = isCitizen && !hasZone && !showSuccessBanner

  const cards = [
    {
      label: 'Zonas registradas',
      value: stats?.zones ?? '—',
      sub: `${stats?.activeZones ?? '—'} activas`,
      icon: <MapPin size={20} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      href: '/dashboard/zones',
    },
    {
      label: 'Rutas de recolección',
      value: stats?.routes ?? '—',
      sub: `${stats?.activeRoutes ?? '—'} activas`,
      icon: <RouteIcon size={20} className="text-blue-600" />,
      bg: 'bg-blue-50',
      href: '/dashboard/routes',
    },
  ]

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Bienvenido, {user?.firstName}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Panel de gestión · Gestión de Residuos
        </p>
      </div>

      {/* RF-04: Banner de detección de zona */}
      {showDetectBanner && (
        <ZoneBanner onZoneAssigned={handleZoneAssigned} />
      )}

      {/* Confirmación tras asignar zona */}
      {showSuccessBanner && assignedZone && (
        <ZoneAssignedCard
          zone={assignedZone}
          onDismiss={() => setShowSuccessBanner(false)}
        />
      )}

      {/* Tarjeta de zona ya asignada (regresa con sesión activa) */}
      {isCitizen && hasZone && !showSuccessBanner && (
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: '#10b981' }}
          />
          Tu zona de recolección está asignada.{' '}
          <Link href="/dashboard/schedules" className="text-emerald-600 hover:underline font-medium">
            Ver horarios
          </Link>
        </div>
      )}

      {/* Stat cards (solo ADMIN y OPERATOR) */}
      {user?.role !== 'CITIZEN' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300
                hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
                </div>
                <div className={`${card.bg} p-2.5 rounded-lg`}>{card.icon}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions para ADMIN */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-400" />
            Acciones rápidas
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/zones"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50
                text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              <MapPin size={14} />
              Gestionar zonas
            </Link>
            <Link
              href="/dashboard/routes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50
                text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <RouteIcon size={14} />
              Gestionar rutas
            </Link>
          </div>
        </div>
      )}

      {/* Accesos directos para CITIZEN */}
      {isCitizen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard/schedules"
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300
              hover:shadow-sm transition-all flex items-center gap-4"
          >
            <div className="bg-blue-50 p-3 rounded-lg shrink-0">
              <RouteIcon size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Horarios de recolección</p>
              <p className="text-xs text-slate-500 mt-0.5">Consulta los días y horarios de tu zona</p>
            </div>
          </Link>
          <Link
            href="/dashboard/tracking"
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300
              hover:shadow-sm transition-all flex items-center gap-4"
          >
            <div className="bg-emerald-50 p-3 rounded-lg shrink-0">
              <MapPin size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Rastreo en tiempo real</p>
              <p className="text-xs text-slate-500 mt-0.5">Ubica el camión de recolección en el mapa</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
