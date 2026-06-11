'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import type { ApiResponse, Route, Zone } from '@/types'
import type { TruckPosition } from '@/components/LeafletTrackingMap'
import { Radio, Square, Navigation, Wifi, WifiOff, MapPin, Clock, AlertCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import ZoneGuard from '@/components/ZoneGuard'

const LeafletTrackingMap = dynamic(() => import('@/components/LeafletTrackingMap'), { ssr: false })

export default function TrackingPage() {
  const { user, accessToken } = useAuth()
  const [zones, setZones] = useState<Zone[]>([])
  const [trucks, setTrucks] = useState<TruckPosition[]>([])
  const [myPosition, setMyPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [myRoutes, setMyRoutes] = useState<Route[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [ownSocketId, setOwnSocketId] = useState<string | undefined>()
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const isTrackingRef = useRef(false)

  // RF-13: Estado del modal de reporte de retraso
  const [showDelayModal, setShowDelayModal] = useState(false)
  const [delayMinutes, setDelayMinutes] = useState(20)
  const [delayReason, setDelayReason] = useState('')
  const [delayReported, setDelayReported] = useState(false)

  // Load zones + operator routes
  useEffect(() => {
    if (!accessToken) return
    api.get<ApiResponse<Zone[]>>('/zones', accessToken).then((r) => setZones(r.data ?? []))

    if (user?.role === 'OPERATOR') {
      api.get<ApiResponse<Route[]>>('/routes', accessToken).then((r) => {
        const mine = (r.data ?? []).filter(
          (route) => route.operatorId === user.id && route.status === 'ACTIVE',
        )
        setMyRoutes(mine)
      })
    }
  }, [accessToken, user?.id, user?.role])

  // Socket setup — runs once per accessToken
  useEffect(() => {
    if (!accessToken) return

    const socket = getSocket(accessToken)
    socketRef.current = socket

    function onConnect() {
      setIsConnected(true)
      setOwnSocketId(socket.id ?? undefined)
    }
    function onDisconnect() {
      setIsConnected(false)
    }
    function onTrucks(data: TruckPosition[]) {
      setTrucks(data)
    }
    function onTruckUpdate(truck: TruckPosition) {
      setTrucks((prev) => {
        const idx = prev.findIndex((t) => t.socketId === truck.socketId)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = truck
          return next
        }
        return [...prev, truck]
      })
    }
    function onTruckRemoved({ socketId }: { socketId: string }) {
      setTrucks((prev) => prev.filter((t) => t.socketId !== socketId))
    }

    function onDelayReported() {
      setDelayReported(true)
      setShowDelayModal(false)
      toast.success('Retraso reportado. Los ciudadanos de la zona fueron notificados.')
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('tracking:trucks', onTrucks)
    socket.on('tracking:truck_update', onTruckUpdate)
    socket.on('tracking:truck_removed', onTruckRemoved)
    socket.on('tracking:delay_reported', onDelayReported)

    if (socket.connected) {
      setIsConnected(true)
      setOwnSocketId(socket.id ?? undefined)
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('tracking:trucks', onTrucks)
      socket.off('tracking:truck_update', onTruckUpdate)
      socket.off('tracking:truck_removed', onTruckRemoved)
      socket.off('tracking:delay_reported', onDelayReported)
    }
  }, [accessToken])

  // Auto-subscribe citizens and operators to their assigned zone
  useEffect(() => {
    if (!user?.zoneId && (user?.role === 'CITIZEN' || user?.role === 'OPERATOR')) return
    if (user?.role === 'CITIZEN' && user.zoneId && !selectedZoneId) {
      setSelectedZoneId(user.zoneId)
    }
  }, [user?.zoneId, user?.role, selectedZoneId])

  // Zone subscription for citizens
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !isConnected) return
    if (user?.role !== 'CITIZEN') return

    const zoneToSubscribe = user.zoneId ?? selectedZoneId
    if (zoneToSubscribe) {
      socket.emit('tracking:subscribe', { zoneId: zoneToSubscribe })
    } else {
      socket.emit('tracking:all')
    }
  }, [selectedZoneId, isConnected, user?.role, user?.zoneId])

  const startTracking = useCallback(() => {
    const socket = socketRef.current
    if (!socket) return

    socket.emit('tracking:start', { routeId: selectedRouteId || undefined })
    setIsTracking(true)
    isTrackingRef.current = true

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords
        setMyPosition({ lat: latitude, lng: longitude })
        socket.emit('tracking:position', {
          lat: latitude,
          lng: longitude,
          speed: speed != null ? speed * 3.6 : undefined, // m/s → km/h
        })
      },
      () => toast.error('No se pudo obtener la ubicación GPS'),
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
  }, [selectedRouteId])

  const submitDelay = useCallback(() => {
    const socket = socketRef.current
    if (!socket) return
    socket.emit('tracking:report_delay', { delayMinutes, reason: delayReason.trim() || undefined })
  }, [delayMinutes, delayReason])

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    socketRef.current?.emit('tracking:stop')
    setIsTracking(false)
    isTrackingRef.current = false
    setMyPosition(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (isTrackingRef.current) socketRef.current?.emit('tracking:stop')
    }
  }, [])

  return (
    <ZoneGuard role={user?.role ?? ''} zoneId={user?.zoneId}>
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Rastreo en tiempo real</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Seguimiento GPS de camiones de recolección
          </p>
        </div>
        <div
          className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full ${
            isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isConnected ? 'Conectado' : 'Desconectado'}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Operator controls ───────────────────────────────────────────────── */}
        {user?.role === 'OPERATOR' && (
          <div className="w-72 border-r border-slate-200 bg-white flex flex-col p-4 gap-4 shrink-0 overflow-auto">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                Ruta a ejecutar
              </label>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                disabled={isTracking}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50"
              >
                <option value="">Sin ruta (posición libre)</option>
                {myRoutes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {myRoutes.length === 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  No tienes rutas activas asignadas.
                </p>
              )}
            </div>

            {isTracking ? (
              <button
                onClick={stopTracking}
                className="flex items-center justify-center gap-2 w-full bg-red-600
                  hover:bg-red-700 text-white rounded-lg py-2.5 text-sm font-semibold
                  transition-colors"
              >
                <Square size={14} />
                Detener seguimiento
              </button>
            ) : (
              <button
                onClick={startTracking}
                disabled={!isConnected}
                className="flex items-center justify-center gap-2 w-full bg-emerald-600
                  hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg py-2.5
                  text-sm font-semibold transition-colors"
              >
                <Radio size={14} />
                Iniciar seguimiento
              </button>
            )}

            {isTracking && myPosition && (
              <div className="bg-emerald-50 rounded-lg p-3 text-xs text-emerald-800 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Navigation size={12} className="text-emerald-600" />
                  Transmitiendo posición
                </p>
                <p className="font-mono text-emerald-600">
                  {myPosition.lat.toFixed(5)}, {myPosition.lng.toFixed(5)}
                </p>
              </div>
            )}

            {/* RF-13: Botón reportar retraso */}
            {isTracking && (
              <button
                onClick={() => { setShowDelayModal(true); setDelayReported(false) }}
                className="flex items-center justify-center gap-2 w-full border border-amber-300
                  bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg py-2 text-xs
                  font-medium transition-colors"
              >
                <Clock size={13} />
                Reportar retraso
              </button>
            )}

            {delayReported && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50
                border border-amber-200 rounded-lg px-3 py-2">
                <AlertCircle size={13} />
                Retraso notificado a la zona
              </div>
            )}

            {trucks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Camiones activos ({trucks.length})
                </p>
                <div className="space-y-1.5">
                  {trucks.map((t) => (
                    <div
                      key={t.socketId}
                      className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-lg"
                    >
                      <span className="text-base shrink-0">🚛</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {t.operatorName}
                        </p>
                        {t.speed !== undefined && (
                          <p className="text-xs text-slate-400">
                            {Math.round(t.speed)} km/h
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Citizen controls ────────────────────────────────────────────────── */}
        {user?.role === 'CITIZEN' && (
          <div className="w-64 border-r border-slate-200 bg-white flex flex-col p-4 gap-4 shrink-0">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                <MapPin size={12} className="inline mr-1" />
                Zona a monitorear
              </label>
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Todas las zonas</option>
                {zones
                  .filter((z) => z.isActive)
                  .map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 leading-relaxed">
              Selecciona tu zona para ver los camiones de recolección en tiempo real.
            </div>

            {trucks.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">
                  Camiones activos ({trucks.length})
                </p>
                <div className="space-y-1.5">
                  {trucks.map((t) => (
                    <div
                      key={t.socketId}
                      className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-lg"
                    >
                      <span className="shrink-0">🚛</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {t.operatorName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(t.lastSeen).toLocaleTimeString('es-PE')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center">
                No hay camiones activos en esta zona
              </p>
            )}
          </div>
        )}

        {/* ── Admin info panel ────────────────────────────────────────────────── */}
        {user?.role === 'ADMIN' && trucks.length > 0 && (
          <div className="w-64 border-r border-slate-200 bg-white flex flex-col p-4 gap-3 shrink-0 overflow-auto">
            <p className="text-xs font-semibold text-slate-600">
              Camiones activos ({trucks.length})
            </p>
            {trucks.map((t) => (
              <div
                key={t.socketId}
                className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-lg"
              >
                <span className="shrink-0 mt-0.5">🚛</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{t.operatorName}</p>
                  {t.speed !== undefined && (
                    <p className="text-xs text-slate-500">{Math.round(t.speed)} km/h</p>
                  )}
                  <p className="text-xs text-slate-400">
                    {new Date(t.lastSeen).toLocaleTimeString('es-PE')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Map ─────────────────────────────────────────────────────────────── */}
        <div className="flex-1 relative">
          <LeafletTrackingMap
            zones={zones}
            trucks={trucks}
            myPosition={myPosition}
            ownSocketId={ownSocketId}
          />
        </div>
      </div>

      {/* RF-13: Modal reporte de retraso */}
      {showDelayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                Reportar retraso
              </h2>
              <button
                onClick={() => setShowDelayModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Minutos de retraso
                </label>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Motivo (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Tráfico, falla mecánica..."
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                Los ciudadanos de tu zona recibirán una notificación inmediata.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowDelayModal(false)}
                  className="flex-1 border border-slate-200 rounded-lg py-2 text-sm
                    text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitDelay}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg
                    py-2 text-sm font-semibold transition-colors"
                >
                  Notificar retraso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </ZoneGuard>
  )
}
