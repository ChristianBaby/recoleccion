'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import type { ApiResponse, Zone } from '@/types'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

const LeafletRegisterMap = dynamic(() => import('@/components/LeafletRegisterMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-50 rounded-lg border border-slate-200">
      <span className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin" />
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
        <span className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-teal-700 animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  const isCitizen = user?.role === 'CITIZEN'

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      {/* Cabecera de Página */}
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h1 className="text-3xl font-light text-slate-900 tracking-tight">Mi Perfil</h1>
        <p className="text-slate-500 text-xs tracking-wider uppercase mt-1.5 font-bold">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      {/* Grid de Dos Columnas (Distribución Balanceada) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Columna Izquierda (Resumen de Identidad, Territorio y Seguridad, 1/3) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Tarjeta de Identidad (no editable) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-850 font-bold text-xl mb-4">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            <h2 className="font-bold text-lg text-slate-900 leading-tight">{profile.firstName} {profile.lastName}</h2>
            <span className="text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase mt-2 block">
              {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
            
            <div className="w-full border-t border-slate-100 mt-6 pt-5 space-y-3.5 text-left text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Correo electrónico</span>
                <span className="text-slate-700 font-medium">{profile.email}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Número de DNI</span>
                <span className="text-slate-700 font-mono font-medium">{profile.dni}</span>
              </div>
            </div>
          </div>

          {/* Territorio / Zona de Recolección */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
              Territorio
            </span>
            <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Zona de recolección</h3>
            
            {profile.zone ? (
              <div className="flex items-center justify-between p-4 bg-teal-50/30 border border-teal-100 rounded-lg">
                <div>
                  <p className="font-bold text-teal-900 text-xs uppercase tracking-wide">{profile.zone.name}</p>
                  <p className="text-[11px] text-teal-800 mt-0.5">{profile.zone.district}</p>
                </div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">Asignada</span>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg text-xs text-amber-900">
                Sin zona de recolección asignada
              </div>
            )}

            {isCitizen && (
              <button
                onClick={() => { setShowZoneMap(true); setZoneState({ status: 'none' }) }}
                className="w-full mt-4 px-4 py-2 border border-slate-200 hover:border-slate-800 text-[10px] font-bold tracking-widest text-slate-700 hover:text-slate-900 uppercase transition-all rounded"
              >
                {profile.zone ? 'Modificar zona en mapa' : 'Asignar zona en mapa'}
              </button>
            )}

            {!isCitizen && !profile.zone && (
              <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                Tu cuenta tiene rol municipal. El administrador asignará la zona si es necesario.
              </p>
            )}
          </div>

          {/* Seguridad / Contraseña */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
              Credenciales
            </span>
            <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider font-mono">Seguridad</h3>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full px-4 py-2 border border-slate-200 hover:border-slate-800 text-[10px] font-bold tracking-widest text-slate-700 hover:text-slate-900 uppercase transition-all rounded"
            >
              Cambiar contraseña
            </button>
          </div>

        </div>

        {/* Columna Derecha (Formulario de Datos Personales y Alertas de Proximidad, 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Formulario de Datos Personales */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">
              Información básica
            </span>
            <h2 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">Datos personales</h2>
            
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nombres *</label>
                  <input 
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)} 
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-800 focus:ring-0 transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Apellidos *</label>
                  <input 
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)} 
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-800 focus:ring-0 transition-colors" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Teléfono</label>
                  <input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="987654321"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-800 focus:ring-0 transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Dirección *</label>
                  <input 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-800 focus:ring-0 transition-colors" 
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={savingProfile}
                  className="inline-flex items-center justify-center px-4 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-teal-400 text-white text-xs font-bold tracking-wider uppercase rounded transition-colors"
                >
                  {savingProfile && (
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                  )}
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>

          {/* Alertas de proximidad (solo ciudadanos) */}
          {isCitizen && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">
                Notificaciones
              </span>
              <h2 className="text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wider">Alertas de cercanía del camión</h2>
              <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">
                Recibirás una notificación en tiempo real cuando el camión recolector esté dentro del radio seleccionado de tu domicilio.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">Radio de alerta</span>
                  <span className="text-xs font-bold text-teal-800 tabular-nums bg-teal-50 border border-teal-100 px-2.5 py-1 rounded">
                    {alertRadius >= 1000 ? `${(alertRadius / 1000).toFixed(1)} km` : `${alertRadius} m`}
                  </span>
                </div>
                <input
                  type="range"
                  min={100} max={2000} step={50}
                  value={alertRadius}
                  onChange={(e) => setAlertRadius(Number(e.target.value))}
                  className="w-full accent-teal-700 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  <span>100 m</span>
                  <span>500 m</span>
                  <span>1 km</span>
                  <span>1.5 km</span>
                  <span>2 km</span>
                </div>
                <p className="text-[10px] text-slate-500 bg-slate-50 rounded px-3 py-2 leading-relaxed">
                  * Recuerda guardar los cambios en el formulario de arriba para aplicar el nuevo radio.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ── Modal cambiar contraseña ───────────────────────────────────── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900 text-sm">Cambiar contraseña</h3>
              <button 
                onClick={() => setShowPasswordModal(false)} 
                className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-900 uppercase transition-colors"
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="px-6 py-5 space-y-4">
              {[
                { label: 'Contraseña actual', val: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
                { label: 'Nueva contraseña', val: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(!showNew) },
                { label: 'Confirmar nueva contraseña', val: confirmPassword, set: setConfirmPassword, show: showNew, toggle: () => {} },
              ].map(({ label, val, set, show, toggle }) => (
                <div key={label}>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      value={val}
                      onChange={(e) => set(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-slate-800 focus:ring-0 pr-9 transition-colors"
                    />
                    {toggle !== (() => {}) && (
                      <button type="button" onClick={toggle}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                        {show ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-bold tracking-wider text-slate-600 border border-slate-200 rounded hover:bg-slate-50 uppercase transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={savingPassword}
                  className="inline-flex items-center justify-center px-4 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-teal-400 text-white text-xs font-bold tracking-wider uppercase rounded transition-colors">
                  {savingPassword && (
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                  )}
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
              <h3 className="font-semibold text-slate-900 text-sm">Selecciona tu zona</h3>
              <button 
                onClick={() => setShowZoneMap(false)} 
                className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 hover:text-slate-900 uppercase transition-colors"
              >
                Cerrar
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left: instructions + result */}
              <div className="w-64 shrink-0 border-r border-slate-200 p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-500 space-y-1">
                    <p className="font-bold text-slate-700">Instrucciones</p>
                    <p>• Haz clic en el mapa para seleccionar tu ubicación</p>
                    <p>• O usa el botón GPS para detectar tu posición actual</p>
                  </div>

                  {zoneState.status === 'found' && (
                    <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                      <p className="text-[10px] font-bold text-teal-800 uppercase tracking-wide mb-1">Zona detectada:</p>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: zoneState.zone.color }} />
                        <p className="text-sm font-bold text-teal-900">{zoneState.zone.name}</p>
                      </div>
                      <p className="text-xs text-teal-700 mt-0.5">{zoneState.zone.district}</p>
                    </div>
                  )}

                  {zoneState.status === 'invalid' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                      <p className="font-bold mb-1">Zona no válida</p>
                      <p>Tu ubicación no pertenece a ninguna zona registrada. Intenta otro punto.</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
                  <button
                    onClick={handleSaveZone}
                    disabled={zoneState.status !== 'found' || savingZone}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-teal-800 hover:bg-teal-900 disabled:bg-teal-400 text-white text-xs font-bold tracking-wider uppercase rounded transition-colors"
                  >
                    {savingZone && (
                      <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                    )}
                    Confirmar zona
                  </button>
                  <button 
                    onClick={() => setShowZoneMap(false)}
                    className="w-full px-4 py-2 text-xs font-bold tracking-wider text-slate-600 border border-slate-200 rounded hover:bg-slate-50 uppercase transition-colors"
                  >
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
