'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { ApiResponse, Zone, Route } from '@/types'
import RouteMapModal from '@/components/RouteMapModal'
import ZoneGuard from '@/components/ZoneGuard'

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
  const isRestricted = user?.role === 'CITIZEN' || user?.role === 'OPERATOR'
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)
  const [mapRouteId, setMapRouteId] = useState<string | null>(null)

  // Load zones and auto-select for restricted roles
  useEffect(() => {
    if (!accessToken) return
    api
      .get<ApiResponse<Zone[]>>('/zones', accessToken)
      .then((r) => {
        const active = (r.data ?? []).filter((z) => z.isActive)
        setZones(active)
        if (isRestricted && user?.zoneId) {
          setSelectedZoneId(user.zoneId)
        }
      })
      .catch(() => {})
  }, [accessToken, isRestricted, user?.zoneId])

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
    <ZoneGuard role={user?.role ?? ''} zoneId={user?.zoneId}>
      <div className="p-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 border-b border-slate-100 pb-6">
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">Horarios de recolección</h1>
          <p className="text-slate-500 text-xs tracking-wider uppercase mt-1.5 font-bold">
            Consulta el calendario semanal de rutas de recolección por zona
          </p>
        </div>

        {/* Zone selector — only for admins/operators who aren't restricted */}
        {!isRestricted ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600 shrink-0 text-xs font-bold uppercase tracking-wider">
              <span>Filtro de Zona:</span>
            </div>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="flex-1 max-w-xs border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-800 transition-colors"
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
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: selectedZone.color }} />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{selectedZone.district}</span>
              </div>
            )}
          </div>
        ) : selectedZone && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Tu zona asignada:</span>
              <div className="flex items-center gap-2 ml-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedZone.color }} />
                <span className="font-bold text-slate-800">{selectedZone.name}</span>
                <span className="text-slate-500 font-medium">— {selectedZone.district}</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!selectedZoneId && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Selección de Territorio</p>
            <p className="text-slate-500 text-sm">
              Selecciona una zona en el panel superior para ver el calendario de recolección semanal.
            </p>
          </div>
        )}

        {/* Weekly calendar */}
        {selectedZoneId && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {routesByDay.map((day) => (
              <div key={day.value} className="flex flex-col gap-3">
                {/* Day header */}
                <div className="text-center py-2 bg-slate-100 rounded border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest hidden md:block">
                    {day.label}
                  </p>
                  <p className="text-xs font-bold text-slate-600 uppercase md:hidden">{day.label}</p>
                </div>

                {/* Route cards */}
                <div className="flex flex-col gap-2 min-h-24">
                  {loading ? (
                    <div className="h-16 bg-slate-100 rounded animate-pulse" />
                  ) : day.routes.length === 0 ? (
                    <div className="h-16 rounded border border-dashed border-slate-200 flex items-center justify-center">
                      <span className="text-slate-300 text-xs font-mono">—</span>
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
          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Rutas de esta zona
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {routes.map((route) => (
                <div key={route.id} className="flex items-start justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate">{route.name}</p>
                    <div className="flex flex-wrap gap-x-3 mt-1 text-[11px] text-slate-500 font-medium">
                      {route.startTime && (
                        <span>Horario: {route.startTime}</span>
                      )}
                      {route.estimatedDuration && (
                        <span>Duración: {formatDuration(route.estimatedDuration)}</span>
                      )}
                    </div>
                    {route.vehicle && (
                      <p className="text-[11px] text-slate-450 mt-1 font-mono">Vehículo: {route.vehicle.plate}</p>
                    )}
                    {route.operator && (
                      <p className="text-[11px] text-slate-450 font-medium">
                        Operador: {route.operator.firstName} {route.operator.lastName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setMapRouteId(route.id)}
                    className="shrink-0 text-[10px] font-bold tracking-wider text-teal-800 hover:text-teal-950 uppercase transition-colors mt-0.5"
                    title="Ver mapa"
                  >
                    Ver mapa →
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
    </ZoneGuard>
  )
}

function RouteCard({ route, onViewMap }: { route: Route; onViewMap: () => void }) {
  return (
    <div
      className="rounded p-3 border text-xs flex flex-col justify-between min-h-[90px]"
      style={{
        borderColor: route.zone?.color ?? '#94a3b8',
        backgroundColor: `${route.zone?.color ?? '#94a3b8'}08`,
      }}
    >
      <div>
        <p
          className="font-bold uppercase tracking-wide truncate leading-tight"
          style={{ color: route.zone?.color ?? '#475569' }}
        >
          {route.name}
        </p>
        {route.startTime && (
          <p className="text-slate-500 text-[11px] mt-1 font-medium">
            {route.startTime}
            {route.estimatedDuration ? ` · ${formatDuration(route.estimatedDuration)}` : ''}
          </p>
        )}
        {route.vehicle && (
          <p className="text-slate-400 text-[10px] mt-0.5 font-mono truncate">{route.vehicle.plate}</p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onViewMap() }}
        className="mt-3 text-[10px] font-bold tracking-wider uppercase opacity-80 hover:opacity-100 transition-opacity text-left"
        style={{ color: route.zone?.color ?? '#475569' }}
        title="Ver mapa"
      >
        Ver mapa →
      </button>
    </div>
  )
}
