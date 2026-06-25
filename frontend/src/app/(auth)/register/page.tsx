'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, UserPlus, CheckCircle, MapPin, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/api'
import type { Zone } from '@/types'

const LeafletRegisterMap = dynamic(() => import('@/components/LeafletRegisterMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-100 rounded-lg">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  ),
})

const CUSCO_DISTRICTS = ['Poroy']

const schema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres').max(50).trim(),
  lastName:  z.string().min(2, 'Mínimo 2 caracteres').max(50).trim(),
  dni:       z.string().length(8, 'El DNI debe tener exactamente 8 dígitos').regex(/^\d{8}$/, 'Solo dígitos'),
  email:     z.string().email('Correo electrónico inválido'),
  password:  z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
  address:  z.string().min(5, 'Mínimo 5 caracteres').max(200).trim(),
  district: z.string().min(1, 'Selecciona un distrito'),
  phone:    z.string().regex(/^(\+?51)?\d{9}$/, 'Número de teléfono inválido (ej: 987654321)').optional().or(z.literal('')),
  consent:  z.literal(true, {
    message: 'Debes aceptar los términos y condiciones de privacidad',
  }),
})

type FormData = z.infer<typeof schema>

type ZoneState =
  | { status: 'none' }
  | { status: 'found'; zone: Zone; lat: number; lng: number }
  | { status: 'invalid'; lat: number; lng: number }

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [zones, setZones] = useState<Zone[]>([])
  const [zoneState, setZoneState] = useState<ZoneState>({ status: 'none' })
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null)

  const { register, handleSubmit, watch, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      district: 'Poroy',
    }
  })

  const password = watch('password', '')

  // Load zones for the map (now public endpoint)
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/zones`)
      .then((r) => r.json())
      .then((json) => { if (json.data) setZones(json.data) })
      .catch(() => {})
  }, [])

  function getPolygonCenter(coordinates: [number, number][][]): [number, number] {
    const points = coordinates[0]
    let sumLat = 0
    let sumLng = 0
    points.forEach(([lng, lat]) => {
      sumLat += lat
      sumLng += lng
    })
    return [sumLat / points.length, sumLng / points.length]
  }

  function handleSelectZoneFromList(zoneId: string) {
    if (!zoneId) {
      setZoneState({ status: 'none' })
      setSelectedPoint(null)
      return
    }
    const zone = zones.find(z => z.id === zoneId)
    if (zone) {
      const [lat, lng] = getPolygonCenter(zone.geometry.coordinates)
      setZoneState({ status: 'found', zone, lat, lng })
      setSelectedPoint({ lat, lng })
    }
  }

  function handleZoneDetected(zone: Zone | null, lat: number, lng: number) {
    if (zone) {
      setZoneState({ status: 'found', zone, lat, lng })
    } else {
      setZoneState({ status: 'invalid', lat, lng })
    }
    setSelectedPoint({ lat, lng })
  }

  async function goToStep2() {
    const valid = await trigger(['firstName', 'lastName', 'dni', 'email', 'password', 'address', 'district', 'phone', 'consent'])
    if (valid) setStep(2)
  }

  async function onSubmit(data: FormData) {
    try {
      const payload: Record<string, unknown> = { ...data }
      if (zoneState.status === 'found' || zoneState.status === 'invalid') {
        payload.lat = zoneState.lat
        payload.lng = zoneState.lng
      }
      await api.post('/auth/register', payload)
      setRegisteredEmail(data.email)
      setRegistered(true)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors?.length) err.errors.forEach((e) => toast.error(e.message))
        else toast.error(err.message)
      } else {
        toast.error('Error al registrarse. Intenta nuevamente.')
      }
    }
  }

  if (registered) {
    return (
      <div className="text-center space-y-6 py-8">
        <CheckCircle size={64} className="text-teal-600 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">¡Registro exitoso!</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Enviamos un correo de confirmación a<br />
            <strong className="text-slate-700">{registeredEmail}</strong>
          </p>
          {zoneState.status === 'found' && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-805 rounded-full text-xs font-medium">
              <MapPin size={12} /> Zona asignada: {zoneState.zone.name}
            </div>
          )}
          {zoneState.status === 'invalid' && (
            <p className="text-amber-650 text-xs mt-2">
              Tu ubicación no pertenece a una zona registrada. El administrador te asignará una.
            </p>
          )}
        </div>
        <button
          onClick={() => router.push('/login')}
          className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          Ir al inicio de sesión
        </button>
      </div>
    )
  }

  return (
    <div className={(step === 2 && !registered) ? "lg:-mx-40 lg:max-w-4xl lg:w-[850px] transition-all duration-350 space-y-5" : "transition-all duration-350 space-y-5"}>
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
          <span className="text-xs text-slate-400 font-medium">Paso {step} de 2</span>
        </div>
        <div className="flex gap-1 mb-3">
          <div className="h-1 flex-1 rounded-full bg-teal-700" />
          <div className={`h-1 flex-1 rounded-full ${step === 2 ? 'bg-teal-700' : 'bg-slate-200'}`} />
        </div>
        <p className="text-slate-500 text-sm">
          {step === 1 ? 'Datos personales' : 'Selecciona tu ubicación en el mapa'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ── Step 1: Personal data ─────────────────────────────── */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombres" error={errors.firstName?.message}>
                <input placeholder="Juan" {...register('firstName')} className={inputCls(!!errors.firstName)} />
              </Field>
              <Field label="Apellidos" error={errors.lastName?.message}>
                <input placeholder="Quispe" {...register('lastName')} className={inputCls(!!errors.lastName)} />
              </Field>
            </div>

            <Field label="DNI" error={errors.dni?.message}>
              <input type="text" inputMode="numeric" maxLength={8} placeholder="12345678" {...register('dni')} className={inputCls(!!errors.dni)} />
            </Field>

            <Field label="Correo electrónico" error={errors.email?.message}>
              <input type="email" placeholder="tu@correo.com" autoComplete="email" {...register('email')} className={inputCls(!!errors.email)} />
            </Field>

            <Field label="Contraseña" error={errors.password?.message}>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  {...register('password')}
                  className={`${inputCls(!!errors.password)} pr-10`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && <PasswordStrengthBar strength={getPasswordStrength(password)} />}
            </Field>

            <input type="hidden" value="Poroy" {...register('district')} />

            <Field label="Dirección" error={errors.address?.message}>
              <input placeholder="Av. El Sol 123" {...register('address')} className={inputCls(!!errors.address)} />
            </Field>

            <Field label="Teléfono (opcional)" error={errors.phone?.message}>
              <input type="tel" placeholder="987654321" inputMode="numeric" {...register('phone')} className={inputCls(!!errors.phone)} />
            </Field>

            <div className="space-y-1">
              <div className="bg-teal-50/40 border border-teal-100 rounded-xl p-3.5 transition-all hover:bg-teal-50/60">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register('consent')}
                    className="mt-1 w-4 h-4 text-teal-700 border-slate-300 rounded focus:ring-teal-600 accent-teal-700 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    Acepto el tratamiento de mis datos personales para la gestión del servicio de recolección de residuos, conforme a la <strong>Ley N.º 29733 (Ley de Protección de Datos Personales)</strong> y a la <Link href="/privacy" target="_blank" className="text-teal-700 hover:underline font-semibold inline-flex items-center gap-1">Política de Privacidad<svg className="w-3 h-3 inline-block shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg><span className="sr-only">(se abre en una nueva pestaña)</span></Link>.
                  </span>
                </label>
              </div>
              {errors.consent && <p className="text-xs text-red-600 pl-1">{errors.consent.message}</p>}
            </div>

            <button
              type="button"
              onClick={goToStep2}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-700
                hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Siguiente — Seleccionar zona <ArrowRight size={16} />
            </button>
          </>
        )}

        {/* ── Step 2: Zone map ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
              
              {/* Columna Izquierda: Selector de Zona en Lista */}
              <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                    Selecciona tu Barrio / Urbanización
                  </label>
                  
                  <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                    {/* Opción de no asignar o no en la lista */}
                    <button
                      type="button"
                      onClick={() => handleSelectZoneFromList('')}
                      className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                        zoneState.status === 'none' || zoneState.status === 'invalid'
                          ? 'border-slate-850 bg-slate-50 ring-2 ring-slate-800/10'
                          : 'border-slate-205 hover:border-slate-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                        No estoy seguro / No está en la lista
                      </div>
                      <p className="text-slate-500 text-[10px] leading-relaxed">
                        Puedes registrarte sin zona; el administrador te asignará una manualmente más tarde.
                      </p>
                    </button>

                    {/* Zonas activas del sistema */}
                    {zones.filter(z => z.isActive).map((z) => {
                      const isSelected = zoneState.status === 'found' && zoneState.zone.id === z.id
                      return (
                        <button
                          key={z.id}
                          type="button"
                          onClick={() => handleSelectZoneFromList(z.id)}
                          className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                            isSelected
                              ? 'bg-teal-50/40 border-teal-800 ring-2 ring-teal-700/10'
                              : 'border-slate-205 hover:border-slate-400 bg-white'
                          }`}
                          style={{ borderLeftWidth: '5px', borderLeftColor: z.color }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{z.name}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{z.district}</span>
                          </div>
                          {z.description && (
                            <p className="text-slate-500 text-[10px] leading-normal line-clamp-2">
                              {z.description}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Banner de estado de zona actual */}
                <div className="pt-2">
                  {zoneState.status === 'found' && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-teal-50/50 border border-teal-150 rounded-xl text-xs">
                      <MapPin size={16} className="text-teal-700 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-teal-900">Ubicación Asignada con Éxito</p>
                        <p className="text-teal-800 text-[10px] mt-0.5 leading-normal">
                          Perteneces a la zona <span className="font-bold text-teal-950">{zoneState.zone.name}</span>. Verás los horarios de esta zona en tu dashboard.
                        </p>
                      </div>
                      <div className="w-3.5 h-3.5 rounded-full border border-white shrink-0 shadow-sm" style={{ backgroundColor: zoneState.zone.color }} />
                    </div>
                  )}

                  {zoneState.status === 'invalid' && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl text-xs">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-amber-850">Ubicación Fuera de Cobertura</p>
                        <p className="text-amber-700 text-[10px] mt-0.5 leading-normal">
                          El punto marcado está fuera de las zonas registradas. El administrador revisará tu dirección para asignarte la zona correcta.
                        </p>
                      </div>
                    </div>
                  )}

                  {zoneState.status === 'none' && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5 animate-bounce" />
                      <div className="flex-1">
                        <p className="font-bold text-slate-700">Sin Zona Seleccionada</p>
                        <p className="text-slate-500 text-[10px] mt-0.5 leading-normal">
                          Haz clic en cualquier punto del mapa para geolocalizar tu domicilio o elige tu barrio de la lista de arriba.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Mapa de Zonas */}
              <div className="lg:col-span-3 h-[380px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
                <LeafletRegisterMap 
                  zones={zones} 
                  selectedZoneId={zoneState.status === 'found' ? zoneState.zone.id : null}
                  selectedPoint={selectedPoint}
                  onZoneDetected={handleZoneDetected} 
                />
              </div>

            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold tracking-wider text-slate-655
                  border border-slate-300 bg-white rounded-lg hover:bg-slate-50 uppercase transition-colors"
              >
                <ArrowLeft size={15} /> Atrás
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-700
                  hover:bg-teal-800 disabled:bg-teal-400 text-white font-bold uppercase tracking-wider rounded-lg
                  transition-colors text-xs shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    Finalizar Registro
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400">
              * La geolocalización nos permite enviarte notificaciones en tiempo real cuando el camión de basura se aproxime a tu casa.
            </p>
          </div>
        )}
      </form>

      <p className="text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-teal-700 hover:text-teal-800 font-medium">Inicia sesión</Link>
      </p>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return `w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
    focus:ring-2 focus:ring-teal-600 focus:border-transparent
    \${hasError ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'}`
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function getPasswordStrength(p: string) {
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^a-zA-Z0-9]/.test(p)) s++
  return s
}

function PasswordStrengthBar({ strength }: { strength: number }) {
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Excelente']
  const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-teal-600']
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? colors[strength] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className={`text-xs ${strength >= 3 ? 'text-teal-700' : 'text-slate-400'}`}>{labels[strength]}</p>
    </div>
  )
}
