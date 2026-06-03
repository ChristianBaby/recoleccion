'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import type { ApiResponse, Incident, IncidentStatus } from '@/types'
import { toast } from 'sonner'
import {
  Plus, X, Loader2, AlertTriangle, MapPin, Copy, Check,
  ChevronDown, ImagePlus, Trash2,
} from 'lucide-react'

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  WASTE_ACCUMULATION: 'Acumulación de residuos',
  DAMAGED_CONTAINER:  'Contenedor dañado',
  MISSED_COLLECTION:  'Recolección no realizada',
  OTHER:              'Otro',
}

const STATUS_CONFIG: Record<IncidentStatus, { label: string; cls: string }> = {
  OPEN:      { label: 'Abierta',       cls: 'bg-red-50 text-red-700' },
  IN_REVIEW: { label: 'En revisión',   cls: 'bg-amber-50 text-amber-700' },
  RESOLVED:  { label: 'Resuelta',      cls: 'bg-emerald-50 text-emerald-700' },
  CLOSED:    { label: 'Cerrada',       cls: 'bg-slate-100 text-slate-600' },
}

const STATUS_ORDER: IncidentStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']

interface FormState {
  type: string
  description: string
  imageUrl: string
  address: string
  lat: string
  lng: string
}

const defaultForm: FormState = {
  type: 'WASTE_ACCUMULATION',
  description: '',
  imageUrl: '',
  address: '',
  lat: '',
  lng: '',
}

export default function IncidentsPage() {
  const { accessToken, user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | 'ALL'>('ALL')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchIncidents = useCallback(async () => {
    if (!accessToken) return
    try {
      const params = filterStatus !== 'ALL' ? `?status=${filterStatus}` : ''
      const res = await api.get<ApiResponse<Incident[]>>(`/incidents${params}`, accessToken)
      setIncidents(res.data ?? [])
    } catch {
      toast.error('Error al cargar las incidencias')
    } finally {
      setLoading(false)
    }
  }, [accessToken, filterStatus])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }))
        setGeoLoading(false)
        toast.success('Ubicación obtenida')
      },
      () => {
        setGeoLoading(false)
        toast.error('No se pudo obtener la ubicación')
      },
    )
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5 MB')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setForm((f) => ({ ...f, imageUrl: '' }))
  }

  async function uploadToImgBB(file: File): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY
    if (!apiKey) throw new Error('IMGBB_API_KEY no configurada')
    const formData = new FormData()
    formData.append('image', file)
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    })
    const json = await res.json()
    if (!json.success) throw new Error('Error al subir imagen')
    return json.data.url as string
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return

    setSaving(true)
    try {
      let imageUrl = form.imageUrl.trim()

      if (imageFile) {
        setUploadingImage(true)
        try {
          imageUrl = await uploadToImgBB(imageFile)
        } catch {
          toast.error('No se pudo subir la imagen. El reporte se enviará sin foto.')
          imageUrl = ''
        } finally {
          setUploadingImage(false)
        }
      }

      const payload: Record<string, unknown> = {
        type: form.type,
        description: form.description,
      }
      if (imageUrl) payload.imageUrl = imageUrl
      if (form.address.trim()) payload.address = form.address.trim()
      if (form.lat && form.lng) {
        payload.lat = parseFloat(form.lat)
        payload.lng = parseFloat(form.lng)
      }

      const res = await api.post<ApiResponse<Incident>>('/incidents', payload, accessToken)
      const created = res.data!
      toast.success(
        `Incidencia registrada — código: ${created.trackingCode}`,
        { duration: 6000 },
      )
      setShowModal(false)
      setForm(defaultForm)
      removeImage()
      fetchIncidents()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al reportar')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(incident: Incident, status: IncidentStatus) {
    if (!accessToken || !isAdmin) return
    setUpdatingId(incident.id)
    try {
      await api.patch(`/incidents/${incident.id}/status`, { status }, accessToken)
      toast.success(`Estado actualizado a: ${STATUS_CONFIG[status].label}`)
      fetchIncidents()
    } catch {
      toast.error('Error al actualizar el estado')
    } finally {
      setUpdatingId(null)
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    })
  }

  const displayedIncidents =
    filterStatus === 'ALL'
      ? incidents
      : incidents.filter((i) => i.status === filterStatus)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Incidencias
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              RF-11 · {incidents.length} incidencia(s)
              {!isAdmin && ' · Solo tus reportes'}
            </p>
          </div>
          <button
            onClick={() => { setForm(defaultForm); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg
              text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            <Plus size={16} /> Reportar incidencia
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5">
          {(['ALL', ...STATUS_ORDER] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'ALL' ? 'Todas' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : displayedIncidents.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <AlertTriangle size={40} className="text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">
              {filterStatus !== 'ALL'
                ? `Sin incidencias con estado "${STATUS_CONFIG[filterStatus].label}"`
                : 'Sin incidencias registradas'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Código</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción</th>
                  {isAdmin && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ciudadano</th>
                  )}
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Foto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ubicación</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedIncidents.map((inc) => {
                  const status = STATUS_CONFIG[inc.status]
                  return (
                    <tr key={inc.id} className="hover:bg-slate-50">
                      {/* Tracking code */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => copyCode(inc.trackingCode)}
                          className="flex items-center gap-1 font-mono text-xs text-slate-500 hover:text-slate-900"
                          title="Copiar código"
                        >
                          {inc.trackingCode.slice(0, 8)}…
                          {copiedCode === inc.trackingCode
                            ? <Check size={12} className="text-emerald-500" />
                            : <Copy size={12} />}
                        </button>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className="text-slate-700 whitespace-nowrap">
                          {INCIDENT_TYPE_LABELS[inc.type] ?? inc.type}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-slate-600 truncate" title={inc.description}>
                          {inc.description}
                        </p>
                      </td>

                      {/* Citizen (admin only) */}
                      {isAdmin && (
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {inc.citizen
                            ? `${inc.citizen.firstName} ${inc.citizen.lastName}`
                            : '—'}
                        </td>
                      )}

                      {/* Image */}
                      <td className="px-4 py-3">
                        {inc.imageUrl ? (
                          <a href={inc.imageUrl} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={inc.imageUrl}
                              alt="foto"
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 hover:scale-150 transition-transform"
                            />
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3">
                        {inc.address ? (
                          <span className="text-slate-600 text-xs flex items-center gap-1">
                            <MapPin size={11} />
                            {inc.address}
                          </span>
                        ) : inc.lat && inc.lng ? (
                          <span className="text-slate-400 text-xs font-mono">
                            {inc.lat?.toFixed(4)}, {inc.lng?.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">Sin ubicación</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(inc.createdAt).toLocaleDateString('es-PE', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <div className="relative">
                            <select
                              value={inc.status}
                              onChange={(e) =>
                                handleStatusChange(inc, e.target.value as IncidentStatus)
                              }
                              disabled={updatingId === inc.id}
                              className={`appearance-none text-xs font-medium px-2 py-1 pr-6 rounded-full
                                border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400
                                disabled:opacity-50 ${status.cls}`}
                            >
                              {STATUS_ORDER.map((s) => (
                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                              ))}
                            </select>
                            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
                          </div>
                        ) : (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.cls}`}>
                            {status.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Reportar incidencia */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h2 className="font-semibold text-slate-900">Reportar incidencia</h2>
              <button onClick={() => { setShowModal(false); removeImage() }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-4">
                {/* Type */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tipo de incidencia *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {Object.entries(INCIDENT_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Descripción * <span className="font-normal text-slate-400">(mínimo 10 caracteres)</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    rows={3}
                    placeholder="Describe el problema con el mayor detalle posible..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                {/* Location */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700">
                      <MapPin size={11} className="inline mr-1" />Ubicación
                    </label>
                    <button
                      type="button"
                      onClick={useMyLocation}
                      disabled={geoLoading}
                      className="text-xs text-amber-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      {geoLoading
                        ? <><Loader2 size={11} className="animate-spin" /> Obteniendo...</>
                        : 'Usar mi ubicación'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Dirección o referencia (Ej: Av. El Sol 123, Cusco)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2"
                  />
                  {(form.lat || form.lng) && (
                    <p className="text-xs text-slate-400 font-mono">
                      GPS: {form.lat}, {form.lng}
                    </p>
                  )}
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Foto <span className="font-normal text-slate-400">(opcional, máx. 5 MB)</span>
                  </label>
                  {imagePreview ? (
                    <div className="relative rounded-lg overflow-hidden border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imagePreview} alt="Preview" className="w-full max-h-40 object-cover" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-lg text-red-500
                          hover:bg-white transition-colors"
                        title="Eliminar imagen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 w-full h-24
                      border-2 border-dashed border-slate-300 rounded-lg cursor-pointer
                      hover:border-amber-400 hover:bg-amber-50 transition-colors">
                      <ImagePlus size={20} className="text-slate-400" />
                      <span className="text-xs text-slate-400">Click para adjuntar foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
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
                  disabled={saving || uploadingImage}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {(saving || uploadingImage) && <Loader2 size={14} className="animate-spin" />}
                  {uploadingImage ? 'Subiendo imagen...' : saving ? 'Enviando...' : 'Enviar reporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
