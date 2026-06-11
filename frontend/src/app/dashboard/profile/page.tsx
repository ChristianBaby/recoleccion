'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import type { ApiResponse, Zone } from '@/types'
import { toast } from 'sonner'
import {
  User, MapPin, Lock, Loader2, Eye, EyeOff, X, CheckCircle2, Bell,
} from 'lucide-react'

const LeafletRegisterMap = dynamic(() => import('@/components/LeafletRegisterMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-100 rounded-lg">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  ),
})

interface FullProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  dni: string
  phone: string | null
  address: string | null
  district: string | null
  role: string
  zoneId: string | null
  alertRadius: number
  zone: { id: string; name: string; district: string; color: string } | null
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  OPERATOR: 'Operador municipal',
  CITIZEN: 'Ciudadano',
}

export default function ProfilePage() {
  const { user, accessToken, updateUser, updateZone } = useAuth()
  const [profile, setProfile] = useState<FullProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [zones, setZones] = useState<Zone[]>([])

  // Profile form
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [alertRadius, setAlertRadius] = useState(500)
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Zone map
  const [showZoneMap, setShowZoneMap] = useState(false)
  const [zoneState, setZoneState] = useState<
    { status: 'none' } | { status: 'found'; zone: Zone; lat: number; lng: number } | { status: 'invalid' }
  >({ status: 'none' })
  const [savingZone, setSavingZone] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    Promise.all([
      api.get<ApiResponse<FullProfile>>('/auth/me', accessToken),
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/zones`)
        .then((r) => r.json()),
    ]).then(([profileRes, zonesJson]) => {
      if (profileRes.data) {
        const p = profileRes.data
        setProfile(p)
        setFirstName(p.firstName)
        setLastName(p.lastName)
        setPhone(p.phone ?? '')
        setAddress(p.address ?? '')
        setAlertRadius(p.alertRadius ?? 500)
      }
      if (zonesJson.data) setZones(zonesJson.data)
    }).catch(() => toast.error('Error al cargar el perfil')).finally(() => setLoadingProfile(false))
  }, [accessToken])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken) return
    setSavingProfile(true)
    try {
      const res = await api.patch<ApiResponse<FullProfile>>('/auth/me/profile', {
        firstName, lastName, phone: phone || undefined, address,
        ...(user?.role === 'CITIZEN' && { alertRadius }),
      }, accessToken)
      if (res.data) {
        setProfile((p) => p ? { ...p, ...res.data! } : p)
        updateUser({ firstName: res.data.firstName, lastName: res.data.lastName })
        toast.success('Perfil actualizado')
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al guardar')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden')
      return
    }
    if (!accessToken) return
    setSavingPassword(true)
    try {
      await api.patch('/auth/me/password', { currentPassword, newPassword }, accessToken)
      toast.success('Contraseña actualizada correctamente')
      setShowPasswordModal(false)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al cambiar contraseña')
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleSaveZone() {
    if (zoneState.status !== 'found' || !accessToken) return
    setSavingZone(true)
    try {
      await api.post('/zones/assign-me', { lat: zoneState.lat, lng: zoneState.lng }, accessToken)
      const newZone = zoneState.zone
      setProfile((p) => p ? { ...p, zoneId: newZone.id, zone: newZone } : p)
      updateZone(newZone.id)
      toast.success(`Zona actualizada: ${newZone.name}`)
      setShowZoneMap(false)
      setZoneState({ status: 'none' })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Error al cambiar zona')
    } finally {
      setSavingZone(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!profile) return null

  const isCitizen = user?.role === 'CITIZEN'

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Perfil</h1>
        <p className="text-slate-500 text-sm mt-1">Gestiona tu información personal y configuración de cuenta</p>
      </div>

      {/* ── Identidad (no editable) ────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center
            text-emerald-700 font-bold text-lg shrink-0">
            {profile.firstName[0]}{profile.lastName[0]}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{profile.firstName} {profile.lastName}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Correo electrónico</p>
            <p className="text-slate-700 font-medium">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">DNI</p>
            <p className="text-slate-700 font-mono font-medium">{profile.dni}</p>
          </div>
        </div>
      </div>

      {/* ── Datos editables ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <User size={15} className="text-emerald-600" /> Datos personales
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nombres *</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Apellidos *</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="987654321"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Dirección *</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600
                hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors">
              {savingProfile && <Loader2 size={14} className="animate-spin" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>

      {/* ── Zona de recolección ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <MapPin size={15} className="text-emerald-600" /> Zona de recolección
        </h2>
        {profile.zone ? (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
            <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: profile.zone.color }} />
            <div className="flex-1">
              <p className="font-semibold text-emerald-900 text-sm">{profile.zone.name}</p>
              <p className="text-xs text-emerald-700">{profile.zone.district}</p>
            </div>
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg mb-3">
            <MapPin size={16} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700">Sin zona asignada</p>
          </div>
        )}

        {isCitizen && (
          <button
            onClick={() => { setShowZoneMap(true); setZoneState({ status: 'none' }) }}
            className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700
              border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            <MapPin size={14} />
            {profile.zone ? 'Cambiar zona en el mapa' : 'Seleccionar zona en el mapa'}
          </button>
        )}

        {!isCitizen && !profile.zone && (
          <p className="text-xs text-slate-400 mt-2">
            El administrador asignará tu zona de recolección.
          </p>
        )}
      </div>

      {/* ── Alertas de proximidad (solo ciudadanos) ────────────────────── */}
      {isCitizen && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
            <Bell size={15} className="text-emerald-600" /> Alertas de cercanía del camión
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Recibirás una notificación cuando el camión recolector esté dentro de este radio de tu domicilio.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Radio de alerta</span>
              <span className="text-sm font-bold text-emerald-700 tabular-nums w-16 text-right">
                {alertRadius >= 1000 ? `${(alertRadius / 1000).toFixed(1)} km` : `${alertRadius} m`}
              </span>
            </div>
            <input
              type="range"
              min={100} max={2000} step={50}
              value={alertRadius}
              onChange={(e) => setAlertRadius(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>100 m</span>
              <span>500 m</span>
              <span>1 km</span>
              <span>1.5 km</span>
              <span>2 km</span>
            </div>
            <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">
              Guarda los cambios del formulario superior para aplicar el nuevo radio.
            </p>
          </div>
        </div>
      )}

      {/* ── Seguridad ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Lock size={15} className="text-emerald-600" /> Seguridad
        </h2>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700
            border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Lock size={14} /> Cambiar contraseña
        </button>
      </div>

      {/* ── Modal cambiar contraseña ───────────────────────────────────── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Cambiar contraseña</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="px-6 py-5 space-y-4">
              {[
                { label: 'Contraseña actual', val: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
                { label: 'Nueva contraseña', val: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(!showNew) },
                { label: 'Confirmar nueva contraseña', val: confirmPassword, set: setConfirmPassword, show: showNew, toggle: () => {} },
              ].map(({ label, val, set, show, toggle }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-9"
                    />
                    {toggle !== (() => {}) && (
                      <button type="button" onClick={toggle}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                        {show ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={savingPassword}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                    bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg">
                  {savingPassword && <Loader2 size={14} className="animate-spin" />}
                  Actualizar contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal mapa de zona (solo ciudadanos) ──────────────────────── */}
      {showZoneMap && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col"
            style={{ height: 'min(90vh, 580px)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <h3 className="font-semibold text-slate-900">Selecciona tu zona</h3>
              <button onClick={() => setShowZoneMap(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left: instructions + result */}
              <div className="w-64 shrink-0 border-r border-slate-200 p-5 flex flex-col gap-4">
                <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
                  <p className="font-medium text-slate-700">Instrucciones</p>
                  <p>• Haz clic en el mapa para seleccionar tu ubicación</p>
                  <p>• O usa el botón GPS para detectar tu posición actual</p>
                </div>

                {zoneState.status === 'found' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-xs font-semibold text-emerald-800 mb-1">Zona detectada:</p>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: zoneState.zone.color }} />
                      <p className="text-sm font-bold text-emerald-900">{zoneState.zone.name}</p>
                    </div>
                    <p className="text-xs text-emerald-700 mt-0.5">{zoneState.zone.district}</p>
                  </div>
                )}

                {zoneState.status === 'invalid' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                    <p className="font-semibold mb-1">Zona no válida</p>
                    <p>Tu ubicación no pertenece a ninguna zona registrada. Intenta otro punto.</p>
                  </div>
                )}

                <div className="mt-auto flex flex-col gap-2">
                  <button
                    onClick={handleSaveZone}
                    disabled={zoneState.status !== 'found' || savingZone}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm
                      font-medium text-white bg-emerald-600 hover:bg-emerald-700
                      disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    {savingZone && <Loader2 size={14} className="animate-spin" />}
                    Confirmar zona
                  </button>
                  <button onClick={() => setShowZoneMap(false)}
                    className="w-full px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">
                    Cancelar
                  </button>
                </div>
              </div>

              {/* Right: map */}
              <div className="flex-1 relative">
                <LeafletRegisterMap
                  zones={zones}
                  onZoneDetected={(zone, lat, lng) => {
                    if (zone) setZoneState({ status: 'found', zone, lat, lng })
                    else setZoneState({ status: 'invalid' })
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
