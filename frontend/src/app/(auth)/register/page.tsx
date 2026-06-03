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

const CUSCO_DISTRICTS = [
  'Cusco', 'San Sebastián', 'San Jerónimo', 'Santiago', 'Wanchaq',
  'Saylla', 'Ccorca', 'Poroy',
]

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
  phone:    z.string().optional(),
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

  const { register, handleSubmit, watch, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const password = watch('password', '')

  // Load zones for the map (now public endpoint)
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/zones`)
      .then((r) => r.json())
      .then((json) => { if (json.data) setZones(json.data) })
      .catch(() => {})
  }, [])

  function handleZoneDetected(zone: Zone | null, lat: number, lng: number) {
    if (zone) {
      setZoneState({ status: 'found', zone, lat, lng })
    } else {
      setZoneState({ status: 'invalid', lat, lng })
    }
  }

  async function goToStep2() {
    const valid = await trigger(['firstName', 'lastName', 'dni', 'email', 'password', 'address', 'district', 'phone'])
    if (valid) setStep(2)
  }

  async function onSubmit(data: FormData) {
    try {
      const payload: Record<string, unknown> = { ...data }
      if (zoneState.status === 'found') {
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
        <CheckCircle size={64} className="text-green-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">¡Registro exitoso!</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Enviamos un correo de confirmación a<br />
            <strong className="text-slate-700">{registeredEmail}</strong>
          </p>
          {zoneState.status === 'found' && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
              <MapPin size={12} /> Zona asignada: {zoneState.zone.name}
            </div>
          )}
          {zoneState.status === 'invalid' && (
            <p className="text-amber-600 text-xs mt-2">
              Tu ubicación no pertenece a una zona registrada. El administrador te asignará una.
            </p>
          )}
        </div>
        <button
          onClick={() => router.push('/login')}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          Ir al inicio de sesión
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
          <span className="text-xs text-slate-400 font-medium">Paso {step} de 2</span>
        </div>
        <div className="flex gap-1 mb-3">
          <div className="h-1 flex-1 rounded-full bg-green-500" />
          <div className={`h-1 flex-1 rounded-full ${step === 2 ? 'bg-green-500' : 'bg-slate-200'}`} />
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

            <Field label="Distrito" error={errors.district?.message}>
              <select {...register('district')} className={inputCls(!!errors.district)}>
                <option value="">Selecciona tu distrito</option>
                {CUSCO_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>

            <Field label="Dirección" error={errors.address?.message}>
              <input placeholder="Av. El Sol 123, Cusco" {...register('address')} className={inputCls(!!errors.address)} />
            </Field>

            <Field label="Teléfono (opcional)" error={errors.phone?.message}>
              <input type="tel" placeholder="987654321" inputMode="numeric" {...register('phone')} className={inputCls(!!errors.phone)} />
            </Field>

            <button
              type="button"
              onClick={goToStep2}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600
                hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm"
            >
              Siguiente — Seleccionar zona <ArrowRight size={16} />
            </button>
          </>
        )}

        {/* ── Step 2: Zone map ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-3">
            {/* Zone status banner */}
            {zoneState.status === 'found' && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                <MapPin size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-800">Zona detectada: {zoneState.zone.name}</p>
                  <p className="text-emerald-600 text-xs">{zoneState.zone.district}</p>
                </div>
                <div className="ml-auto w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: zoneState.zone.color }} />
              </div>
            )}

            {zoneState.status === 'invalid' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800">Zona no válida</p>
                  <p className="text-amber-700 text-xs">
                    Tu ubicación no pertenece a ninguna zona registrada. Puedes seleccionar otro punto
                    o registrarte así y el administrador te asignará una zona.
                  </p>
                </div>
              </div>
            )}

            {zoneState.status === 'none' && (
              <p className="text-xs text-slate-500 text-center">
                Haz clic en el mapa o usa el botón GPS para seleccionar tu ubicación
              </p>
            )}

            {/* Map */}
            <div className="h-72 rounded-xl overflow-hidden border border-slate-200">
              <LeafletRegisterMap zones={zones} onZoneDetected={handleZoneDetected} />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-600
                  border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={15} /> Atrás
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600
                  hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg
                  transition-colors text-sm"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                {isSubmitting ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </div>

            <p className="text-xs text-center text-slate-400">
              La selección de zona en el mapa es opcional pero recomendada
            </p>
          </div>
        )}
      </form>

      <p className="text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">Inicia sesión</Link>
      </p>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return `w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
    focus:ring-2 focus:ring-green-500 focus:border-transparent
    ${hasError ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'}`
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
  const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? colors[strength] : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className={`text-xs ${strength >= 3 ? 'text-green-600' : 'text-slate-400'}`}>{labels[strength]}</p>
    </div>
  )
}
