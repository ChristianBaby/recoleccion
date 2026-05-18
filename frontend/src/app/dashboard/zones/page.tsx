'use client'

import { useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import { verticesToGeoJson, geoJsonToVertices } from '@/lib/geoUtils'
import type { ApiResponse, Zone } from '@/types'
import { toast } from 'sonner'
import {
  Plus, Pencil, ToggleLeft, ToggleRight, X, MapPin, Loader2,
} from 'lucide-react'

const LeafletZoneMap = dynamic(() => import('@/components/LeafletZoneMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-100 rounded-lg">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  ),
})

const LeafletPolygonEditor = dynamic(() => import('@/components/LeafletPolygonEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-slate-100 rounded-lg">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  ),
})

const DISTRICTS = [
  'Cusco', 'San Jerónimo', 'San Sebastián', 'Santiago',
  'Saylla', 'Ccorca', 'Poroy', 'Wanchaq',
]

const COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
]

interface FormState {
  name: string
  description: string
  district: string
  color: string
  vertices: [number, number][]
}

const defaultForm: FormState = {
  name: '', description: '', district: '', color: '#22c55e', vertices: [],
}

export default function ZonesPage() {
  const { accessToken, user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editZone, setEditZone] = useState<Zone | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [saving, setSaving] = useState(false)

  const fetchZones = useCallback(async () => {
    if (!accessToken) return
    try {
      const res = await api.get<ApiResponse<Zone[]>>('/zones', accessToken)
      setZones(res.data ?? [])
    } catch {
      toast.error('Error al cargar las zonas')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { fetchZones() }, [fetchZones])

  function openCreate() {
    setEditZone(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  function openEdit(zone: Zone) {
    setEditZone(zone)
    setForm({
      name: zone.name,
      description: zone.description ?? '',
      district: zone.district,
      color: zone.color,
      vertices: geoJsonToVertices(zone.geometry),
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return

    if (form.vertices.length < 3) {
      toast.error('Dibuja el polígono en el mapa (mínimo 3 puntos)')
      return
    }

    const geometry = verticesToGeoJson(form.vertices)
    if (!geometry) return

    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        district: form.district,
        color: form.color,
        geometry,
      }

      if (editZone) {
        await api.put(`/zones/${editZone.id}`, payload, accessToken)
        toast.success('Zona actualizada')
      } else {
        await api.post('/zones', payload, accessToken)
        toast.success('Zona creada')
      }

      setShowModal(false)
      fetchZones()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(zone: Zone) {
    if (!accessToken) return
    try {
      await api.patch(`/zones/${zone.id}/toggle-status`, undefined, accessToken)
      toast.success(zone.isActive ? 'Zona desactivada' : 'Zona activada')
      fetchZones()
    } catch {
      toast.error('Error al cambiar el estado')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <MapPin size={18} className="text-emerald-600" />
            Zonas de recolección
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">RF-03 · {zones.length} zona(s) registradas</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg
              text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} /> Nueva zona
          </button>
        )}
      </div>

      {/* Content: list + map */}
      <div className="flex flex-1 overflow-hidden">
        {/* Zone list */}
        <div className="w-80 border-r border-slate-200 overflow-y-auto bg-white shrink-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-slate-300" />
            </div>
          ) : zones.length === 0 ? (
            <div className="flex flex-col items-center py-16 px-6 text-center">
              <MapPin size={32} className="text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm">Sin zonas registradas</p>
              {isAdmin && (
                <button onClick={openCreate} className="mt-2 text-emerald-600 text-sm hover:underline">
                  Crear primera zona
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {zones.map((zone) => (
                <li
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id === selectedZone?.id ? null : zone)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    selectedZone?.id === zone.id ? 'bg-emerald-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: zone.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {zone.name}
                        </span>
                        <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          zone.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {zone.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{zone.district}</p>
                      {zone._count && (
                        <p className="text-xs text-slate-400">
                          {zone._count.users} ciudadanos · {zone._count.routes} rutas
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-0.5 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(zone) }}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggle(zone) }}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"
                          title={zone.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {zone.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 p-4">
          <LeafletZoneMap
            zones={zones}
            selectedZoneId={selectedZone?.id}
            onZoneClick={(z) => setSelectedZone(z.id === selectedZone?.id ? null : z)}
          />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="font-semibold text-slate-900">
                {editZone ? 'Editar zona' : 'Nueva zona de recolección'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="Ej: Zona Centro Histórico"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Distrito *</label>
                    <select
                      value={form.district}
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Seleccionar...</option>
                      {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    placeholder="Descripción opcional..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Color</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, color: c })}
                        className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                          form.color === c ? 'border-slate-600 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Área geográfica *{' '}
                    <span className="font-normal text-slate-400">(haz clic en el mapa para dibujar)</span>
                  </label>
                  <div className="h-64">
                    <LeafletPolygonEditor
                      vertices={form.vertices}
                      onChange={(v) => setForm({ ...form, vertices: v })}
                    />
                  </div>
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
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editZone ? 'Guardar cambios' : 'Crear zona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
