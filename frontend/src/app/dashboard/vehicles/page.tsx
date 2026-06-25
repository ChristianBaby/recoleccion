'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import type { ApiResponse } from '@/types'
import { toast } from 'sonner'
import {
  Truck, Plus, X, Loader2, Search, Pencil,
  CheckCircle2, AlertCircle, Wrench,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type VehicleType = 'COMPACTOR' | 'OPEN_TRUCK' | 'MINI_TRUCK'
type VehicleStatus = 'AVAILABLE' | 'IN_ROUTE' | 'MAINTENANCE' | 'INACTIVE'

interface Vehicle {
  id: string
  plate: string
  type: VehicleType
  brand: string | null
  model: string | null
  year: number | null
  capacity: number | null
  status: VehicleStatus
  isActive: boolean
}

interface VehicleForm {
  plate: string
  type: VehicleType | ''
  brand: string
  model: string
  year: string
  capacity: string
  status: VehicleStatus
}

const EMPTY_FORM: VehicleForm = {
  plate: '', type: '', brand: '', model: '', year: '', capacity: '', status: 'AVAILABLE',
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<VehicleType, string> = {
  COMPACTOR: 'Compactador',
  OPEN_TRUCK: 'Camión abierto',
  MINI_TRUCK: 'Mini camión',
}

const STATUS_CFG: Record<VehicleStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  AVAILABLE:   { label: 'Disponible',    cls: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle2 size={12} /> },
  IN_ROUTE:    { label: 'En ruta',       cls: 'bg-blue-50 text-blue-700',       icon: <Truck size={12} /> },
  MAINTENANCE: { label: 'Mantenimiento', cls: 'bg-amber-50 text-amber-700',     icon: <Wrench size={12} /> },
  INACTIVE:    { label: 'Inactivo',      cls: 'bg-slate-100 text-slate-500',    icon: <AlertCircle size={12} /> },
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function VehicleModal({
  vehicle,
  onClose,
  onSaved,
  accessToken,
}: {
  vehicle: Vehicle | null   // null = create, Vehicle = edit
  onClose: () => void
  onSaved: () => void
  accessToken: string
}) {
  const isEdit = vehicle !== null
  const [form, setForm] = useState<VehicleForm>(
    isEdit
      ? {
          plate: vehicle.plate,
          type: vehicle.type,
          brand: vehicle.brand ?? '',
          model: vehicle.model ?? '',
          year: vehicle.year ? String(vehicle.year) : '',
          capacity: vehicle.capacity ? String(vehicle.capacity) : '',
          status: vehicle.status,
        }
      : EMPTY_FORM,
  )
  const [saving, setSaving] = useState(false)

  const set = (field: keyof VehicleForm, value: string) =>
    setForm((p) => ({ ...p, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.type) { toast.error('Selecciona el tipo de vehículo'); return }
    setSaving(true)
    try {
      const body = {
        plate: form.plate.trim().toUpperCase(),
        type: form.type as VehicleType,
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        year: form.year ? Number(form.year) : undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        ...(isEdit && { status: form.status }),
      }
      if (isEdit) {
        await api.put(`/vehicles/${vehicle.id}`, body, accessToken)
        toast.success('Vehículo actualizado')
      } else {
        await api.post('/vehicles', body, accessToken)
        toast.success('Vehículo registrado')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Truck size={16} className="text-emerald-600" />
            {isEdit ? 'Editar vehículo' : 'Registrar vehículo'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                Placa <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.plate}
                onChange={(e) => set('plate', e.target.value)}
                placeholder="ABC-123"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm uppercase
                  focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-medium text-slate-700 mb-1 block">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">Seleccionar…</option>
                {(Object.keys(TYPE_LABELS) as VehicleType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Marca</label>
              <input
                value={form.brand}
                onChange={(e) => set('brand', e.target.value)}
                placeholder="Toyota"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Modelo</label>
              <input
                value={form.model}
                onChange={(e) => set('model', e.target.value)}
                placeholder="Dyna"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Año</label>
              <input
                type="number"
                min={1990}
                max={new Date().getFullYear() + 1}
                value={form.year}
                onChange={(e) => set('year', e.target.value)}
                placeholder="2020"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 mb-1 block">Capacidad (ton)</label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                placeholder="5.0"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {isEdit && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-700 mb-1 block">Estado</label>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {(Object.keys(STATUS_CFG) as VehicleStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_CFG[s].label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg
                hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600
                hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors
                flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Registrar vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// modalState: false = closed, null = create new, Vehicle = edit
type ModalState = false | null | Vehicle

export default function VehiclesPage() {
  const { accessToken } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | ''>('')
  const [modal, setModal] = useState<ModalState>(false)

  const fetchVehicles = useCallback(async () => {
    if (!accessToken) return
    try {
      const r = await api.get<ApiResponse<Vehicle[]>>('/vehicles', accessToken)
      setVehicles(r.data ?? [])
    } catch {
      toast.error('Error al cargar vehículos')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      v.plate.toLowerCase().includes(q) ||
      (v.brand ?? '').toLowerCase().includes(q) ||
      (v.model ?? '').toLowerCase().includes(q)
    const matchStatus = !filterStatus || v.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === 'AVAILABLE').length,
    inRoute: vehicles.filter((v) => v.status === 'IN_ROUTE').length,
    maintenance: vehicles.filter((v) => v.status === 'MAINTENANCE').length,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-200 bg-white shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Truck size={18} className="text-emerald-600" /> Vehículos
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {counts.total} registrado(s) · {counts.available} disponibles · {counts.inRoute} en ruta · {counts.maintenance} en mantenimiento
            </p>
          </div>
          <button
            onClick={() => setModal(null)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white
              rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Registrar vehículo
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por placa, marca o modelo…"
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as VehicleStatus | '')}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="">Todos los estados</option>
            {(Object.keys(STATUS_CFG) as VehicleStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_CFG[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400 gap-3">
            <Truck size={40} className="opacity-30" />
            <p className="text-sm">
              {vehicles.length === 0
                ? 'No hay vehículos registrados. Agrega el primero.'
                : 'Sin resultados para los filtros aplicados.'}
            </p>
            {vehicles.length === 0 && (
              <button
                onClick={() => setModal(null)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white
                  rounded-lg px-4 py-2 text-sm font-medium transition-colors mt-1"
              >
                <Plus size={14} /> Registrar primer vehículo
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold
                  text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Placa</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Marca / Modelo</th>
                  <th className="text-right px-4 py-3">Año</th>
                  <th className="text-right px-4 py-3">Cap. (ton)</th>
                  <th className="text-center px-4 py-3">Estado</th>
                  <th className="text-center px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((v) => {
                  const st = STATUS_CFG[v.status]
                  return (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-slate-800">{v.plate}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{TYPE_LABELS[v.type]}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {v.brand || v.model
                          ? `${v.brand ?? ''} ${v.model ?? ''}`.trim()
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {v.year ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {v.capacity != null ? v.capacity.toFixed(1) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5
                          rounded-full text-xs font-medium ${st.cls}`}>
                          {st.icon} {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setModal(v)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs
                            font-medium text-slate-600 bg-slate-100 hover:bg-slate-200
                            rounded-lg transition-colors"
                        >
                          <Pencil size={11} /> Editar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: false = hidden, null = create, Vehicle = edit */}
      {modal !== false && accessToken && (
        <VehicleModal
          vehicle={modal}
          onClose={() => setModal(false)}
          onSaved={fetchVehicles}
          accessToken={accessToken}
        />
      )}
    </div>
  )
}
