'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { ApiResponse, Zone, Route } from '@/types'
import { Clock, Calendar, Map } from 'lucide-react'
import RouteMapModal from '@/components/RouteMapModal'

const DAYS = [
  { label: 'Lunes', short: 'L', value: 1 },
  { label: 'Martes', short: 'M', value: 2 },
  { label: 'Miércoles', short: 'X', value: 3 },
  { label: 'Jueves', short: 'J', value: 4 },
  { label: 'Viernes', short: 'V', value: 5 },
  { label: 'Sábado', short: 'S', value: 6 },
  { label: 'Domingo', short: 'D', value: 0 },
]

function formatDuration(minutes: number | null): string {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export default function SchedulesPage() {
  const { user, accessToken } = useAuth()
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)
  const [mapRouteId, setMapRouteId] = useState<string | null>(null)

  // Load all active zones
  useEffect(() => {
    if (!accessToken) return
    api
      .get<ApiResponse<Zone[]>>('/zones', accessToken)
      .then((r) => {
        const active = (r.data ?? []).filter((z) => z.isActive)
        setZones(active)
        // Auto-select first zone for citizens (or just let them pick)
        if (active.length > 0 && user?.role === 'CITIZEN') {
          setSelectedZoneId(active[0].id)
        }
      })
      .catch(() => {})
  }, [accessToken, user?.role])

  // Load routes for selected zone
  useEffect(() => {
    if (!accessToken || !selectedZoneId) {
      setRoutes([])
      return
    }
    setLoading(true)
    api
      .get<ApiResponse<Route[]>>(`/routes?zoneId=${selectedZoneId}`, accessToken)
      .then((r) => {
        setRoutes((r.data ?? []).filter((rt) => rt.status === 'ACTIVE'))
      })
      .catch(() => setRoutes([]))
      .finally(() => setLoading(false))
  }, [accessToken, selectedZoneId])

  // Group routes by day of week
  const routesByDay = DAYS.map((day) => ({
    ...day,
    routes: routes.filter((r) => r.dayOfWeek.includes(day.value)),
  }))

  const selectedZone = zones.find((z) => z.id === selectedZoneId)

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Horarios de recolección</h1>
        <p className="text-slate-500 text-sm mt-1">
          Consulta el calendario semanal de rutas de recolección por zona
        </p>
      </div>

      {/* Zone selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-600 shrink-0">
          <Calendar size={16} />
          <span className="text-sm font-medium">Zona:</span>
        </div>
        <select
          value={selectedZoneId}
          onChange={(e) => setSelectedZoneId(e.target.value)}
          className="flex-1 max-w-xs border border-slate-200 rounded-lg px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Selecciona una zona</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.name} — {z.district}
            </option>
          ))}
        </select>
        {selectedZone && (
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: selectedZone.color }}
            />
            <span className="text-sm text-slate-600">{selectedZone.district}</span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!selectedZoneId && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Calendar size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">
            Selecciona una zona para ver el calendario de recolección
          </p>
        </div>
      )}

      {/* Weekly calendar */}
      {selectedZoneId && (
        <div className="grid grid-cols-7 gap-3">
          {routesByDay.map((day) => (
            <div key={day.value} className="flex flex-col gap-2">
              {/* Day header */}
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:block">
                  {day.label}
                </p>
                <p className="text-xs font-semibold text-slate-500 sm:hidden">{day.short}</p>
              </div>

              {/* Route cards */}
              <div className="flex flex-col gap-2 min-h-24">
                {loading ? (
                  <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                ) : day.routes.length === 0 ? (
                  <div className="h-16 rounded-lg border border-dashed border-slate-200 flex items-center justify-center">
                    <span className="text-slate-300 text-xs">—</span>
                  </div>
                ) : (
                  day.routes.map((route) => (
                    <RouteCard
                      key={`${day.value}-${route.id}`}
                      route={route}
                      onViewMap={() => setMapRouteId(route.id)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {selectedZoneId && routes.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
            Rutas de esta zona
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {routes.map((route) => (
              <div key={route.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{route.name}</p>
                  <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-slate-500">
                    {route.startTime && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {route.startTime}
                      </span>
                    )}
                    {route.estimatedDuration && (
                      <span>{formatDuration(route.estimatedDuration)}</span>
                    )}
                  </div>
                  {route.vehicle && (
                    <p className="text-xs text-slate-400 mt-0.5">🚛 {route.vehicle.plate}</p>
                  )}
                  {route.operator && (
                    <p className="text-xs text-slate-400">
                      👤 {route.operator.firstName} {route.operator.lastName}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setMapRouteId(route.id)}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-emerald-100 text-slate-400
                    hover:text-emerald-600 transition-colors"
                  title="Ver ruta en mapa"
                >
                  <Map size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Modal de mapa */}
      {mapRouteId && (
        <RouteMapModal
          routeId={mapRouteId}
          zones={zones}
          onClose={() => setMapRouteId(null)}
        />
      )}
    </div>
  )
}

function RouteCard({ route, onViewMap }: { route: Route; onViewMap: () => void }) {
  return (
    <div
      className="rounded-lg p-2.5 border text-xs"
      style={{
        borderColor: route.zone?.color ?? '#94a3b8',
        backgroundColor: `${route.zone?.color ?? '#94a3b8'}15`,
      }}
    >
      <p
        className="font-semibold truncate leading-tight"
        style={{ color: route.zone?.color ?? '#475569' }}
      >
        {route.name}
      </p>
      {route.startTime && (
        <p className="flex items-center gap-1 text-slate-500 mt-1">
          <Clock size={9} />
          {route.startTime}
          {route.estimatedDuration ? ` · ${formatDuration(route.estimatedDuration)}` : ''}
        </p>
      )}
      {route.vehicle && (
        <p className="text-slate-400 mt-0.5 truncate">🚛 {route.vehicle.plate}</p>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onViewMap() }}
        className="mt-1.5 flex items-center gap-1 text-xs font-medium opacity-70 hover:opacity-100
          transition-opacity"
        style={{ color: route.zone?.color ?? '#475569' }}
        title="Ver ruta en mapa"
      >
        <Map size={10} />
        Ver mapa
      </button>
    </div>
  )
}
