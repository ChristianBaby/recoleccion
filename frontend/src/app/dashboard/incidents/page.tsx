'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import type { ApiResponse, Incident, IncidentStatus } from '@/types'
import { toast } from 'sonner'
import {
  Plus, X, Loader2, AlertTriangle, MapPin, Copy, Check,
  ChevronDown, ImagePlus, Trash2, Filter, AlertCircle,
} from 'lucide-react'
import ZoneGuard from '@/components/ZoneGuard'
import type { Zone } from '@/types'
import { saveOfflineIncident, getOfflineIncidents, deleteOfflineIncident } from '@/lib/offlineDb'

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
  const [filterZoneId, setFilterZoneId] = useState('')
  const [zones, setZones] = useState<Zone[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [offlineCount, setOfflineCount] = useState(0)

  const loadOfflineCount = useCallback(async () => {
    const list = await getOfflineIncidents()
    setOfflineCount(list.length)
  }, [])

  const fetchIncidents = useCallback(async () => {
    if (!accessToken) return
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'ALL') params.set('status', filterStatus)
      if (isAdmin && filterZoneId) params.set('zoneId', filterZoneId)
      const res = await api.get<ApiResponse<Incident[]>>(`/incidents?${params}`, accessToken)
      setIncidents(res.data ?? [])
    } catch {
      toast.error('Error al cargar las incidencias')
    } finally {
      setLoading(false)
    }
  }, [accessToken, filterStatus, filterZoneId, isAdmin])

  useEffect(() => {
    if (!accessToken || !isAdmin) return
    api.get<ApiResponse<Zone[]>>('/zones', accessToken)
      .then((r) => setZones((r.data ?? []).filter((z) => z.isActive)))
      .catch(() => {})
  }, [accessToken, isAdmin])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  const syncOfflineIncidents = useCallback(async () => {
    if (!accessToken) return
    if (typeof window !== 'undefined' && !navigator.onLine) {
      toast.error('No hay conexión a internet para sincronizar.')
      return
    }

    try {
      const offline = await getOfflineIncidents()
      if (offline.length === 0) return

      toast.info(`Sincronizando ${offline.length} reporte(s) guardado(s) localmente...`)
      let successCount = 0

      for (const item of offline) {
        try {
          let imageUrl = ''
          if (item.base64Image) {
            const resBlob = await fetch(item.base64Image)
            const blob = await resBlob.blob()
            const file = new File([blob], 'offline-image.jpg', { type: 'image/jpeg' })
            imageUrl = await uploadToImgBB(file)
          }

          const payload: Record<string, unknown> = {
            type: item.type,
            description: item.description,
          }
          if (imageUrl) payload.imageUrl = imageUrl
          if (item.address) payload.address = item.address
          if (item.lat && item.lng) {
            payload.lat = item.lat
            payload.lng = item.lng
          }

          await api.post('/incidents', payload, accessToken)
          await deleteOfflineIncident(item.id!)
          successCount++
        } catch (error) {
          console.error('Error al sincronizar item offline:', error)
        }
      }

      await loadOfflineCount()
      if (successCount > 0) {
        toast.success(`Sincronización exitosa: ${successCount} reporte(s) enviado(s).`)
        fetchIncidents()
      }
    } catch (err) {
      console.error('Fallo en la sincronización offline:', err)
    }
  }, [accessToken, fetchIncidents, loadOfflineCount])

  useEffect(() => {
    if (!accessToken) return
    loadOfflineCount()

    const handleOnline = () => {
      toast.success('¡Conexión de red restablecida! Sincronizando reportes locales...')
      syncOfflineIncidents()
    }

    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [accessToken, loadOfflineCount, syncOfflineIncidents])

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

  function compressImage(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.75): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                resolve(file)
              }
            },
            'image/jpeg',
            quality
          )
        }
        img.onerror = () => resolve(file)
      }
      reader.onerror = () => resolve(file)
    })
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingImage(true)
    try {
      toast.info('Procesando y comprimiendo imagen localmente...')
      const compressed = await compressImage(file)
      
      // Si el tamaño sigue siendo superior a 500KB, forzar una compresión más agresiva
      let finalFile = compressed
      if (compressed.size > 500 * 1024) {
        finalFile = await compressImage(compressed, 800, 800, 0.55)
      }
      
      setImageFile(finalFile)
      setImagePreview(URL.createObjectURL(finalFile))
      toast.success(`Imagen lista (${(finalFile.size / 1024).toFixed(1)} KB). Cumple con el límite de 500 KB.`)
    } catch {
      toast.error('Error al procesar la imagen')
    } finally {
      setUploadingImage(false)
    }
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

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  async function handleOfflineSave() {
    try {
      let base64Image = ''
      if (imageFile) {
        base64Image = await fileToBase64(imageFile)
      }

      await saveOfflineIncident({
        type: form.type,
        description: form.description,
        address: form.address.trim() || undefined,
        lat: form.lat ? parseFloat(form.lat) : undefined,
        lng: form.lng ? parseFloat(form.lng) : undefined,
        base64Image: base64Image || undefined
      })

      toast.success('Sin conexión o error de red. Reporte guardado localmente (Offline). Se enviará al recuperar conexión.')
      setShowModal(false)
      setForm(defaultForm)
      removeImage()
      loadOfflineCount()
    } catch (err) {
      console.error(err)
      toast.error('No se pudo guardar el reporte localmente')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return

    setSaving(true)

    // Si detectamos explícitamente offline
    if (typeof window !== 'undefined' && !navigator.onLine) {
      await handleOfflineSave()
      setSaving(false)
      return
    }

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
      // Si es un error de red (por ejemplo, TypeError: Failed to fetch)
      const isNetworkError = !(err instanceof ApiError)
      if (isNetworkError) {
        await handleOfflineSave()
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Error al reportar')
      }
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
    <ZoneGuard role={user?.role ?? ''} zoneId={user?.zoneId}>
    <div className="flex flex-col h-full">
      {/* Banner de reportes offline pendientes */}
      {offlineCount > 0 && (
        <div className="mx-8 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-pulse shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Reportes locales pendientes ({offlineCount})</h4>
              <p className="text-xs text-slate-500">
                Tienes reportes guardados en la base de datos de tu dispositivo debido a la falta de conexión.
              </p>
            </div>
          </div>
          <button
            onClick={() => syncOfflineIncidents()}
            className="px-3.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors shadow-sm"
          >
            Sincronizar ahora
          </button>
        </div>
      )}

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
              {!isAdmin && ' · Incidencias de tu zona'}
            </p>
          </div>
          {!isAdmin && (
            <button
              onClick={() => { setForm(defaultForm); setShowModal(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg
                text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              <Plus size={16} /> Reportar incidencia
            </button>
          )}
        </div>

        {/* Admin zone filter */}
        {isAdmin && (
          <div className="flex items-center gap-3 mb-3">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterZoneId}
              onChange={(e) => setFilterZoneId(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="">Todas las zonas</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name} — {z.district}</option>
              ))}
            </select>
            <button
              onClick={() => { setForm(defaultForm); setShowModal(true) }}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg
                text-sm font-medium hover:bg-amber-600 transition-colors"
            >
              <Plus size={16} /> Registrar incidencia
            </button>
          </div>
        )}

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

                {/* Advertencia Ético-Legal (Privacidad) */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
                  <AlertCircle size={16} className="shrink-0 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-semibold">Aviso de Privacidad (Ley N.º 29733):</span> Al capturar la fotografía, evite registrar rostros de personas o placas de vehículos ajenos para proteger los datos personales de terceros.
                  </div>
                </div>

                {/* Consentimiento obligatorio */}
                <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="checkbox"
                    id="termsConsent"
                    required
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="termsConsent" className="text-xs text-slate-600 select-none leading-relaxed cursor-pointer">
                    Doy mi consentimiento para el tratamiento de mis datos personales y autorizo el acceso a mi cámara y ubicación GPS con el único fin de procesar esta incidencia conforme a la <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-amber-600 underline">Política de Privacidad</a> de la Ley N.º 29733. *
                  </label>
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
    </ZoneGuard>
  )
}
