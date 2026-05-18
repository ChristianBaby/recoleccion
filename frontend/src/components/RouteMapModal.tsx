'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { X, Loader2, Clock, Truck, User, MapPin, Calendar } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { ApiResponse, Route, Zone } from '@/types'

const LeafletRouteMap = dynamic(() => import('@/components/LeafletRouteMap'), { ssr: false })

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatDuration(min: number | null) {
  if (!min) return null
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

interface Props {
  routeId: string
  zones: Zone[]
  onClose: () => void
}

export default function RouteMapModal({ routeId, zones, onClose }: Props) {
  const { accessToken } = useAuth()
  const [route, setRoute] = useState<Route | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    setLoading(true)
    setError(false)
    api
      .get<ApiResponse<Route>>(`/routes/${routeId}`, accessToken)
      .then((r) => setRoute(r.data ?? null))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [routeId, accessToken])

  const waypoints = [...(route?.waypoints ?? [])].sort((a, b) => a.order - b.order)
  const routeColor = route?.zone?.color ?? '#2563eb'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {route?.zone && (
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: route.zone.color }}
              />
            )}
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900 truncate">
                {route?.name ?? 'Cargando ruta…'}
              </h2>
              {route?.zone && (
                <p className="text-xs text-slate-500 mt-0.5">{route.zone.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 ml-4 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel — info + waypoints list */}
          <div className="w-72 shrink-0 border-r border-slate-200 flex flex-col overflow-auto">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-slate-300" />
              </div>
            ) : error || !route ? (
              <div className="flex-1 flex items-center justify-center text-center px-4">
                <p className="text-sm text-slate-400">No se pudo cargar la ruta.</p>
              </div>
            ) : (
              <>
                {/* Route metadata */}
                <div className="p-4 space-y-3 border-b border-slate-100">
                  {/* Days */}
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Calendar size={11} /> Días de recolección
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {route.dayOfWeek.map((d) => (
                        <span
                          key={d}
                          className="px-2 py-0.5 text-xs font-semibold rounded"
                          style={{ backgroundColor: `${routeColor}20`, color: routeColor }}
                        >
                          {DAY_NAMES[d]}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Time + duration */}
                  {(route.startTime || route.estimatedDuration) && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock size={12} className="text-slate-400 shrink-0" />
                      <span>
                        {route.startTime ?? ''}
                        {route.estimatedDuration
                          ? `  ·  ${formatDuration(route.estimatedDuration)}`
                          : ''}
                      </span>
                    </div>
                  )}

                  {/* Vehicle */}
                  {route.vehicle && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Truck size={12} className="text-slate-400 shrink-0" />
                      <span>
                        {route.vehicle.plate}
                        {route.vehicle.type && (
                          <span className="text-slate-400">
                            {' '}· {route.vehicle.type.replace('_', ' ')}
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Operator */}
                  {route.operator && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <User size={12} className="text-slate-400 shrink-0" />
                      <span>
                        {route.operator.firstName} {route.operator.lastName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Waypoints list */}
                <div className="flex-1 overflow-auto p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <MapPin size={11} />
                    {waypoints.length} parada{waypoints.length !== 1 ? 's' : ''}
                  </p>

                  {waypoints.length === 0 ? (
                    <p className="text-xs text-slate-400">Sin paradas definidas</p>
                  ) : (
                    <ol className="space-y-2">
                      {waypoints.map((wp, idx) => {
                        const isFirst = idx === 0
                        const isLast = idx === waypoints.length - 1
                        const dotColor = isFirst
                          ? '#16a34a'
                          : isLast
                          ? '#dc2626'
                          : routeColor

                        return (
                          <li key={wp.id} className="flex items-start gap-2.5">
                            {/* Number badge */}
                            <div
                              className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                                text-white text-xs font-bold mt-0.5"
                              style={{ backgroundColor: dotColor }}
                            >
                              {idx + 1}
                            </div>
                            {/* Connector line */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-800 leading-tight">
                                {wp.name ?? `Parada ${wp.order}`}
                              </p>
                              {wp.estimatedTime && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  ⏱ {wp.estimatedTime}
                                </p>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </div>

                {/* Legend */}
                <div className="p-4 border-t border-slate-100 space-y-1.5 shrink-0">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                    Leyenda
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-green-600 shrink-0" />
                    Inicio de ruta
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-4 h-4 rounded-full bg-red-600 shrink-0" />
                    Fin de ruta
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: routeColor }}
                    />
                    Paradas intermedias
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="h-full flex items-center justify-center bg-slate-50">
                <Loader2 size={28} className="animate-spin text-slate-300" />
              </div>
            ) : error || !route ? (
              <div className="h-full flex items-center justify-center bg-slate-50">
                <p className="text-sm text-slate-400">No se pudo cargar el mapa.</p>
              </div>
            ) : (
              <LeafletRouteMap route={route} zones={zones} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
