'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { ApiResponse, Zone, Route } from '@/types'
import RouteMapModal from '@/components/RouteMapModal'
import ZoneGuard from '@/components/ZoneGuard'
import {
  Calendar,
  Clock,
  Truck,
  User,
  Map,
  Compass,
  WifiOff,
} from 'lucide-react'

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

const HOUR_ROW_HEIGHT = 64
const DEFAULT_START_MINUTES = 6 * 60
const DEFAULT_END_MINUTES = 20 * 60
const CITIZEN_SCHEDULE_CACHE_KEY = 'citizen-schedule-cache-v1'

function parseTimeToMinutes(time: string | null): number | null {
  if (!time) return null
  const [hours, minutes = '0'] = time.split(':')
  const h = Number(hours)
  const m = Number(minutes)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

function formatHourLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  return `${String(h).padStart(2, '0')}:00`
}

function formatTimeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function getRouteStart(route: Route): number {
  return parseTimeToMinutes(route.startTime) ?? DEFAULT_START_MINUTES
}

function getRouteEnd(route: Route): number {
  return getRouteStart(route) + (route.estimatedDuration ?? 60)
}

function getDayScheduleBlocks(routes: Route[]) {
  const sorted = [...routes].sort((a, b) => getRouteStart(a) - getRouteStart(b))
  const blocks: { start: number; end: number; routes: Route[] }[] = []

  for (const route of sorted) {
    const start = getRouteStart(route)
    const end = Math.max(start + 30, getRouteEnd(route))
    const current = blocks.at(-1)

    if (!current || start >= current.end) {
      blocks.push({ start, end, routes: [route] })
      continue
    }

    current.end = Math.max(current.end, end)
    current.routes.push(route)
  }

  return blocks
}

export default function SchedulesPage() {
  const { user, accessToken } = useAuth()
  const isRestricted = user?.role === 'CITIZEN' || user?.role === 'OPERATOR'
  const isCitizen = user?.role === 'CITIZEN'
  const isAdmin = user?.role === 'ADMIN'
  const [zones, setZones] = useState<Zone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(false)
  const [mapRouteId, setMapRouteId] = useState<string | null>(null)
  const [scheduleMessage, setScheduleMessage] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

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
    if (!accessToken) {
      const timer = window.setTimeout(() => setRoutes([]), 0)
      return () => window.clearTimeout(timer)
    }
    const loadingTimer = window.setTimeout(() => setLoading(true), 0)
    const resetTimer = window.setTimeout(() => {
      setScheduleMessage(null)
      setFromCache(false)
    }, 0)
    if (isCitizen) {
      let cancelled = false
      api
        .get<ApiResponse<{ routes: Route[]; message?: string; zoneId: string | null }>>('/routes/my-schedule', accessToken)
        .then((r) => {
          window.clearTimeout(resetTimer)
          if (cancelled) return
          const payload = r.data
          const activeRoutes = (payload?.routes ?? []).filter((rt) => rt.status === 'ACTIVE')
          setRoutes(activeRoutes)
          setSelectedZoneId(payload?.zoneId ?? '')
          setScheduleMessage(payload?.message ?? null)
          window.localStorage.setItem(CITIZEN_SCHEDULE_CACHE_KEY, JSON.stringify({
            routes: activeRoutes,
            message: payload?.message ?? null,
            zoneId: payload?.zoneId ?? '',
            cachedAt: new Date().toISOString(),
          }))
        })
        .catch(() => {
          window.clearTimeout(resetTimer)
          if (cancelled) return
          const cached = window.localStorage.getItem(CITIZEN_SCHEDULE_CACHE_KEY)
          if (!cached) {
            setRoutes([])
            return
          }
          try {
            const parsed = JSON.parse(cached) as { routes?: Route[]; message?: string | null; zoneId?: string }
            setRoutes((parsed.routes ?? []).filter((rt) => rt.status === 'ACTIVE'))
            setSelectedZoneId(parsed.zoneId ?? '')
            setScheduleMessage(parsed.message ?? null)
            setFromCache(true)
          } catch {
            setRoutes([])
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
      return () => {
        cancelled = true
        window.clearTimeout(loadingTimer)
        window.clearTimeout(resetTimer)
      }
    }
    const query = selectedZoneId ? `?zoneId=${selectedZoneId}` : ''
    let cancelled = false
    api
      .get<ApiResponse<Route[]>>(`/routes${query}`, accessToken)
      .then((r) => {
        window.clearTimeout(resetTimer)
        if (cancelled) return
        setRoutes((r.data ?? []).filter((rt) => rt.status === 'ACTIVE'))
      })
      .catch(() => {
        window.clearTimeout(resetTimer)
        if (!cancelled) setRoutes([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
      window.clearTimeout(loadingTimer)
      window.clearTimeout(resetTimer)
    }
  }, [accessToken, isCitizen, selectedZoneId])

  // Group routes by day of week
  const routesByDay = DAYS.map((day) => ({
    ...day,
    routes: routes.filter((r) => r.dayOfWeek.includes(day.value)),
  }))

  const selectedZone = zones.find((z) => z.id === selectedZoneId)
  const showFullWeek = isAdmin || Boolean(selectedZoneId)
  const activeCoverageTitle = isAdmin
    ? selectedZone
      ? selectedZone.name
      : 'Todas las zonas activas'
    : selectedZone?.name ?? 'Zona asignada'
  const routesByZone = zones.map((zone) => ({
    ...zone,
    routes: routes.filter((route) => route.zoneId === zone.id),
  })).filter((zone) => zone.routes.length > 0)
  const routeStarts = routes
    .map((route) => parseTimeToMinutes(route.startTime))
    .filter((minute): minute is number => minute !== null)
  const routeEnds = routes.map(getRouteEnd)
  const minScheduleMinute = routeStarts.length > 0
    ? Math.max(0, Math.floor((Math.min(...routeStarts) - 60) / 60) * 60)
    : DEFAULT_START_MINUTES
  const maxScheduleMinute = routeEnds.length > 0
    ? Math.min(24 * 60, Math.ceil((Math.max(...routeEnds) + 60) / 60) * 60)
    : DEFAULT_END_MINUTES
  const timelineHeight = Math.max(
    HOUR_ROW_HEIGHT * 4,
    ((maxScheduleMinute - minScheduleMinute) / 60) * HOUR_ROW_HEIGHT
  )
  const hourSlots = Array.from(
    { length: Math.floor((maxScheduleMinute - minScheduleMinute) / 60) + 1 },
    (_, index) => minScheduleMinute + index * 60
  )

  return (
    <ZoneGuard role={user?.role ?? ''} zoneId={user?.zoneId}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="text-teal-600 shrink-0" size={28} />
              <span>Horarios de recolección</span>
            </h1>
            <p className="text-slate-400 text-xs tracking-wider uppercase mt-2 font-semibold">
              Consulta el calendario semanal de rutas de recolección por zona
            </p>
          </div>
        </div>

        {/* Zone selector */}
        {isAdmin ? (
          <div className="bg-white rounded-2xl p-5 mb-8 shadow-sm border border-slate-200">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Filtrar cobertura semanal
                  </p>
                  <h2 className="text-lg font-semibold text-slate-900 mt-1">{activeCoverageTitle}</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Selecciona una zona para revisar su semana sin mezclar todos los colores.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <strong className="text-slate-900">{routes.length}</strong> ruta(s) activas
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedZoneId('')}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                    selectedZoneId === ''
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  Todas
                </button>
                {zones.map((zone) => {
                  const isSelected = selectedZoneId === zone.id
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setSelectedZoneId(isSelected ? '' : zone.id)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                        isSelected
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
                      <span>{zone.name}</span>
                    </button>
                  )
                })}
              </div>

              {selectedZoneId === '' && routesByZone.length > 0 && (
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {routesByZone.map((zone) => (
                    <span
                      key={zone.id}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                      <span className="font-semibold">{zone.name}</span>
                      <span className="text-slate-400">{zone.routes.length}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

        ) : !isRestricted ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 flex flex-col gap-4 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Seleccionar Zona de Cobertura
            </p>
            {zones.length === 0 ? (
              <p className="text-xs text-slate-400">Cargando zonas activas...</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {zones.map((z) => {
                  const isSelected = selectedZoneId === z.id
                  return (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setSelectedZoneId(isSelected ? '' : z.id)}
                      className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all active:scale-98 ${
                        isSelected
                          ? 'bg-slate-950 border-slate-950 text-white shadow-lg shadow-slate-950/10'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: z.color }} />
                      <div className="text-left">
                        <p className="text-xs font-bold uppercase tracking-wider leading-none">{z.name}</p>
                        <p className={`text-[10px] mt-1 font-semibold leading-none ${isSelected ? 'text-slate-405' : 'text-slate-400'}`}>{z.district}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          selectedZone && (
            <div className="bg-slate-950 text-white rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                  <Compass size={20} className="animate-spin-slow text-teal-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tu zona asignada</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedZone.color }} />
                    <strong className="text-sm font-bold tracking-wide">{selectedZone.name}</strong>
                    <span className="text-slate-400 text-xs font-medium">— {selectedZone.district}</span>
                  </div>
                </div>
              </div>
              <div className="text-slate-400 text-xs font-medium">
                Consulta las rutas programadas para tu zona residencial.
              </div>
            </div>
          )
        )}

        {/* Empty state */}
        {!showFullWeek && !selectedZoneId && (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center max-w-xl mx-auto shadow-sm flex flex-col items-center mt-12">
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-6">
              <Compass size={32} className="animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider mb-2">
              Selección de Territorio
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Para consultar el calendario semanal y los detalles de las rutas de recolección, selecciona una zona de cobertura en el panel superior.
            </p>
          </div>
        )}

        {(scheduleMessage || fromCache) && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
            {fromCache ? <WifiOff size={16} className="mt-0.5 shrink-0" /> : <Compass size={16} className="mt-0.5 shrink-0" />}
            <span>
              {scheduleMessage}
              {fromCache && ' Mostrando el ultimo horario guardado en este dispositivo.'}
            </span>
          </div>
        )}

        {/* Weekly calendar */}
        {showFullWeek && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-200 bg-slate-50">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Vista semanal por hora
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Las rutas se ubican segun hora de inicio y duracion estimada.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <Clock size={12} />
                Hora vertical
              </span>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[1240px]">
                <div className="grid grid-cols-[76px_repeat(7,minmax(166px,1fr))] bg-slate-950 text-white">
                  <div className="px-3 py-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Hora
                  </div>
                  {DAYS.map((day) => (
                    <div
                      key={day.value}
                      className="px-3 py-3 text-center border-l border-white/10"
                    >
                      <p className="text-[10px] font-extrabold uppercase tracking-widest">
                        {day.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-[76px_repeat(7,minmax(166px,1fr))]">
                  <div
                    className="relative border-r border-slate-200 bg-slate-50"
                    style={{ height: timelineHeight }}
                  >
                    {hourSlots.map((minute) => (
                      <div
                        key={minute}
                        className="absolute left-0 right-0 px-3 text-[10px] font-bold text-slate-400 tabular-nums"
                        style={{
                          top: ((minute - minScheduleMinute) / 60) * HOUR_ROW_HEIGHT - 6,
                        }}
                      >
                        {formatHourLabel(minute)}
                      </div>
                    ))}
                  </div>

                  {routesByDay.map((day) => (
                    <div
                      key={day.value}
                      className="relative border-r border-slate-100 bg-white last:border-r-0"
                      style={{ height: timelineHeight }}
                    >
                      {hourSlots.map((minute) => (
                        <div
                          key={minute}
                          className="absolute left-0 right-0 border-t border-slate-100"
                          style={{
                            top: ((minute - minScheduleMinute) / 60) * HOUR_ROW_HEIGHT,
                          }}
                        />
                      ))}

                      {loading ? (
                        <div className="absolute inset-x-2 top-3 h-12 rounded-lg bg-slate-100 animate-pulse" />
                      ) : day.routes.length === 0 ? (
                        <div className="absolute inset-x-2 top-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-3 text-center">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                            Libre
                          </span>
                        </div>
                      ) : (
                        getDayScheduleBlocks(day.routes).map((block) => {
                          const duration = block.end - block.start
                          const top = ((block.start - minScheduleMinute) / 60) * HOUR_ROW_HEIGHT
                          const contentHeight = 42 + block.routes.length * 26
                          const height = Math.max(64, (duration / 60) * HOUR_ROW_HEIGHT, Math.min(contentHeight, 230))

                          return (
                            <ScheduleBlockCard
                              key={`${day.value}-${block.start}-${block.routes.map((route) => route.id).join('-')}`}
                              routes={block.routes}
                              start={block.start}
                              end={block.end}
                              top={top}
                              height={height}
                              onViewMap={setMapRouteId}
                            />
                          )
                        })
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Routes detailed guide */}
        {showFullWeek && routes.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {isAdmin ? 'Detalles de cobertura por zona' : 'Detalles de las rutas de esta zona'}
              </p>
              {isAdmin && (
                <p className="text-xs text-slate-500">
                  {routes.length} ruta(s) activa(s) en {routesByZone.length} zona(s)
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {routes.map((route) => {
                const zColor = route.zone?.color ?? '#2563eb'
                return (
                  <div
                    key={route.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: zColor }} />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider truncate">
                            {route.name}
                          </h4>
                        </div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                          ACTIVA
                        </span>
                      </div>
                      
                      {route.zone && (
                        <div className="flex items-center gap-2 mb-3 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: zColor }} />
                          <span className="font-semibold text-slate-700">{route.zone.name}</span>
                        </div>
                      )}
                      
                      <div className="space-y-2.5 text-xs text-slate-650">
                        {route.startTime && (
                          <div className="flex items-center gap-2">
                            <Clock size={13} className="text-slate-400 shrink-0" />
                            <span>Horario: <strong className="text-slate-800">{route.startTime}</strong> ({formatDuration(route.estimatedDuration)})</span>
                          </div>
                        )}
                        {route.vehicle && (
                          <div className="flex items-center gap-2">
                            <Truck size={13} className="text-slate-400 shrink-0" />
                            <span>Vehículo: <strong className="text-slate-850 font-mono">{route.vehicle.plate}</strong></span>
                          </div>
                        )}
                        {route.operator && (
                          <div className="flex items-center gap-2">
                            <User size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">Operador: <strong className="text-slate-800">{route.operator.firstName} {route.operator.lastName}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setMapRouteId(route.id)}
                      className="mt-5 w-full flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all"
                      title="Ver mapa completo de esta ruta"
                    >
                      <Map size={12} className="text-slate-400" />
                      <span>Ver recorrido completo</span>
                    </button>
                  </div>
                )
              })}
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

function ScheduleBlockCard({
  routes,
  start,
  end,
  top,
  height,
  onViewMap,
}: {
  routes: Route[]
  start: number
  end: number
  top: number
  height: number
  onViewMap: (routeId: string) => void
}) {
  const primaryColor = routes[0]?.zone?.color ?? '#0f766e'
  const visibleRoutes = routes.slice(0, 6)
  const hiddenRoutes = routes.length - visibleRoutes.length
  return (
    <div
      className="absolute left-2 right-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition-all hover:z-20 hover:shadow-md overflow-hidden"
      style={{
        top,
        height,
      }}
    >
      <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: primaryColor }} />
      <div className="relative z-10 min-w-0 pl-1.5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 tabular-nums">
              {formatTimeLabel(start)} - {formatTimeLabel(end)}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {routes.length} ruta{routes.length === 1 ? '' : 's'}
            </p>
          </div>
          {routes.length > 1 && (
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
              multiple
            </span>
          )}
        </div>

        <div className="space-y-1">
          {visibleRoutes.map((route) => {
            const zoneColor = route.zone?.color ?? '#94a3b8'
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => onViewMap(route.id)}
                className="flex w-full items-center gap-1.5 rounded-md bg-white/75 px-1.5 py-1 text-left text-[10px] text-slate-650 ring-1 ring-slate-200/70 transition-colors hover:bg-white hover:ring-slate-300"
                title="Ver mapa de la ruta"
              >
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: zoneColor }} />
                <span className="min-w-0 flex-1 truncate font-bold">
                  {route.zone?.name ?? route.name}
                </span>
                {route.vehicle && (
                  <span className="shrink-0 font-mono text-[9px] text-slate-400">
                    {route.vehicle.plate}
                  </span>
                )}
                <Map size={9} className="shrink-0 text-slate-400" />
              </button>
            )
          })}
          {hiddenRoutes > 0 && (
            <div className="rounded-md bg-slate-950 px-2 py-1 text-center text-[9px] font-bold uppercase tracking-wider text-white">
              +{hiddenRoutes} rutas mas
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
