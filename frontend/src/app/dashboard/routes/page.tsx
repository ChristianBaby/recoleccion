'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import type { ApiResponse, Route, Zone, Vehicle, Operator } from '@/types'
import { toast } from 'sonner'
import {
  Plus, Pencil, X, Route as RouteIcon, Loader2,
  Trash2, Clock, MapPin, Truck, Map,
} from 'lucide-react'
import RouteMapModal from '@/components/RouteMapModal'

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  DRAFT:    { label: 'Borrador', cls: 'bg-slate-100 text-slate-600' },
  ACTIVE:   { label: 'Activa',   cls: 'bg-emerald-50 text-emerald-700' },
  INACTIVE: { label: 'Inactiva', cls: 'bg-red-50 text-red-600' },
}

interface WaypointForm {
  order: number
  name: string
  lat: string
  lng: string
  estimatedTime: string
}

interface FormState {
  name: string
  zoneId: string
  vehicleId: string
  operatorId: string
  dayOfWeek: number[]
  startTime: string
  estimatedDuration: string
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE'
  waypoints: WaypointForm[]
}

const defaultForm: FormState = {
  name: '', zoneId: '', vehicleId: '', operatorId: '',
  dayOfWeek: [], startTime: '', estimatedDuration: '',
  status: 'DRAFT', waypoints: [],
}

export default function RoutesPage() {
  const { accessToken, user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [routes, setRoutes] = useState<Route[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editRoute, setEditRoute] = useState<Route | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [mapRouteId, setMapRouteId] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!accessToken) return
    try {
      const [routesRes, zonesRes, vehiclesRes] = await Promise.all([
        api.get<ApiResponse<Route[]>>('/routes', accessToken),
        api.get<ApiResponse<Zone[]>>('/zones', accessToken),
        api.get<ApiResponse<Vehicle[]>>('/vehicles', accessToken),
      ])
      setRoutes(routesRes.data ?? [])
      setZones((zonesRes.data ?? []).filter((z) => z.isActive))
      setVehicles((vehiclesRes.data ?? []).filter((v) => v.isActive))

      if (isAdmin) {
        const opRes = await api.get<ApiResponse<Operator[]>>('/routes/operators', accessToken)
        setOperators(opRes.data ?? [])
      }
    } catch {
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [accessToken, isAdmin])

  useEffect(() => { fetchAll() }, [fetchAll])

  function openCreate() {
    setEditRoute(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  function openEdit(route: Route) {
    setEditRoute(route)
    setForm({
      name: route.name,
      zoneId: route.zoneId,
      vehicleId: route.vehicleId ?? '',
      operatorId: route.operatorId ?? '',
      dayOfWeek: route.dayOfWeek,
      startTime: route.startTime ?? '',
      estimatedDuration: route.estimatedDuration?.toString() ?? '',
      status: route.status,
      waypoints: (route.waypoints ?? []).map((wp) => ({
        order: wp.order,
        name: wp.name ?? '',
        lat: wp.lat.toString(),
        lng: wp.lng.toString(),
        estimatedTime: wp.estimatedTime ?? '',
      })),
    })
    setShowModal(true)
  }

  function toggleDay(day: number) {
    setForm((f) => ({
      ...f,
      dayOfWeek: f.dayOfWeek.includes(day)
        ? f.dayOfWeek.filter((d) => d !== day)
        : [...f.dayOfWeek, day].sort(),
    }))
  }

  function addWaypoint() {
    setForm((f) => ({
      ...f,
      waypoints: [
        ...f.waypoints,
        { order: f.waypoints.length + 1, name: '', lat: '', lng: '', estimatedTime: '' },
      ],
    }))
  }

  function removeWaypoint(idx: number) {
    setForm((f) => ({
      ...f,
      waypoints: f.waypoints
        .filter((_, i) => i !== idx)
        .map((wp, i) => ({ ...wp, order: i + 1 })),
    }))
  }

  function updateWaypoint(idx: number, field: keyof WaypointForm, value: string) {
    setForm((f) => ({
      ...f,
      waypoints: f.waypoints.map((wp, i) =>
        i === idx ? { ...wp, [field]: value } : wp,
      ),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return

    if (form.dayOfWeek.length === 0) {
      toast.error('Selecciona al menos un día de la semana')
      return
    }

    // Validate waypoints
    for (const wp of form.waypoints) {
      const lat = parseFloat(wp.lat)
      const lng = parseFloat(wp.lng)
      if (isNaN(lat) || isNaN(lng)) {
        toast.error('Las coordenadas de los puntos de parada son inválidas')
        return
      }
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        zoneId: form.zoneId,
        vehicleId: form.vehicleId || undefined,
        operatorId: form.operatorId || undefined,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime || undefined,
        estimatedDuration: form.estimatedDuration ? parseInt(form.estimatedDuration) : undefined,
        status: form.status,
        waypoints: form.waypoints.map((wp) => ({
          order: wp.order,
          name: wp.name || undefined,
          lat: parseFloat(wp.lat),
          lng: parseFloat(wp.lng),
          estimatedTime: wp.estimatedTime || undefined,
        })),
      }

      if (editRoute) {
        await api.put(`/routes/${editRoute.id}`, payload, accessToken)
        toast.success('Ruta actualizada')
      } else {
        await api.post('/routes', payload, accessToken)
        toast.success('Ruta creada')
      }

      setShowModal(false)
      fetchAll()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(route: Route) {
    if (!accessToken) return
    if (!confirm(`¿Desactivar la ruta "${route.name}"?`)) return
    try {
      await api.patch(`/routes/${route.id}/deactivate`, undefined, accessToken)
      toast.success('Ruta desactivada')
      fetchAll()
    } catch {
      toast.error('Error al desactivar la ruta')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <RouteIcon size={18} className="text-blue-600" />
            Rutas de recolección
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">RF-09 · {routes.length} ruta(s) registradas</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg
              text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Nueva ruta
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : routes.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <RouteIcon size={40} className="text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">Sin rutas registradas</p>
            {isAdmin && (
              <button onClick={openCreate} className="mt-2 text-blue-600 text-sm hover:underline">
                Crear primera ruta
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ruta</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Zona</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Días</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hora</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehículo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Operador</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routes.map((route) => {
                  const status = STATUS_LABELS[route.status] ?? STATUS_LABELS.DRAFT
                  return (
                    <tr key={route.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{route.name}</div>
                        {route._count && (
                          <div className="text-xs text-slate-400">{route._count.waypoints} paradas</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {route.zone && (
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: route.zone.color }}
                            />
                            <span className="text-slate-700">{route.zone.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-0.5">
                          {route.dayOfWeek.map((d) => (
                            <span
                              key={d}
                              className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-medium"
                            >
                              {DAY_NAMES[d]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {route.startTime ?? '—'}
                        {route.estimatedDuration && (
                          <span className="text-slate-400"> ({route.estimatedDuration} min)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {route.vehicle ? (
                          <div className="flex items-center gap-1">
                            <Truck size={13} className="text-slate-400" />
                            {route.vehicle.plate}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {route.operator
                          ? `${route.operator.firstName} ${route.operator.lastName}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.cls}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setMapRouteId(route.id)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Ver en mapa"
                          >
                            <Map size={13} />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEdit(route)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors"
                                title="Editar"
                              >
                                <Pencil size={13} />
                              </button>
                              {route.status !== 'INACTIVE' && (
                                <button
                                  onClick={() => handleDeactivate(route)}
                                  className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                                  title="Desactivar"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de mapa de ruta */}
      {mapRouteId && (
        <RouteMapModal
          routeId={mapRouteId}
          zones={zones}
          onClose={() => setMapRouteId(null)}
        />
      )}

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="font-semibold text-slate-900">
                {editRoute ? 'Editar ruta' : 'Nueva ruta de recolección'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-5">
                {/* Name + Zone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="Ej: Ruta Norte Mañana"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      <MapPin size={11} className="inline mr-1" />Zona *
                    </label>
                    <select
                      value={form.zoneId}
                      onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Seleccionar zona...</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>{z.name} — {z.district}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Vehicle + Operator */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      <Truck size={11} className="inline mr-1" />Vehículo
                    </label>
                    <select
                      value={form.vehicleId}
                      onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Sin asignar</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.plate} — {v.type.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Operador</label>
                    <select
                      value={form.operatorId}
                      onChange={(e) => setForm({ ...form, operatorId: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Sin asignar</option>
                      {operators.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.firstName} {op.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Days */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    Días de recolección *
                  </label>
                  <div className="flex gap-2">
                    {DAY_NAMES.map((name, d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          form.dayOfWeek.includes(d)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time + Duration + Status */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      <Clock size={11} className="inline mr-1" />Hora inicio
                    </label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Duración (min)</label>
                    <input
                      type="number"
                      value={form.estimatedDuration}
                      onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })}
                      placeholder="Ej: 120"
                      min={1}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Estado</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="DRAFT">Borrador</option>
                      <option value="ACTIVE">Activa</option>
                      <option value="INACTIVE">Inactiva</option>
                    </select>
                  </div>
                </div>

                {/* Waypoints */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-700">Puntos de parada</label>
                    <button
                      type="button"
                      onClick={addWaypoint}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus size={12} /> Agregar parada
                    </button>
                  </div>

                  {form.waypoints.length === 0 ? (
                    <p className="text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg py-4 text-center">
                      Sin paradas definidas
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {form.waypoints.map((wp, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                          <span className="col-span-1 text-xs text-slate-400 text-center">{wp.order}</span>
                          <input
                            type="text"
                            value={wp.name}
                            onChange={(e) => updateWaypoint(idx, 'name', e.target.value)}
                            placeholder="Nombre"
                            className="col-span-3 px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="number"
                            value={wp.lat}
                            onChange={(e) => updateWaypoint(idx, 'lat', e.target.value)}
                            placeholder="Latitud"
                            step="any"
                            className="col-span-3 px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="number"
                            value={wp.lng}
                            onChange={(e) => updateWaypoint(idx, 'lng', e.target.value)}
                            placeholder="Longitud"
                            step="any"
                            className="col-span-3 px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="time"
                            value={wp.estimatedTime}
                            onChange={(e) => updateWaypoint(idx, 'estimatedTime', e.target.value)}
                            className="col-span-1 px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeWaypoint(idx)}
                            className="col-span-1 flex justify-center text-slate-300 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editRoute ? 'Guardar cambios' : 'Crear ruta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
