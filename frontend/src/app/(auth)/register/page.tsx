'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, UserPlus, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/api'

const CUSCO_DISTRICTS = [
  'Cusco', 'San Sebastián', 'San Jerónimo', 'Santiago', 'Wanchaq',
  'Saylla', 'Ccorca', 'Poroy',
]

const schema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres').max(50).trim(),
  lastName: z.string().min(2, 'Mínimo 2 caracteres').max(50).trim(),
  dni: z.string().length(8, 'El DNI debe tener exactamente 8 dígitos').regex(/^\d{8}$/, 'Solo dígitos'),
  email: z.string().email('Correo electrónico inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
  address: z.string().min(5, 'Mínimo 5 caracteres').max(200).trim(),
  district: z.string().min(1, 'Selecciona un distrito'),
  phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const password = watch('password', '')
  const passwordStrength = getPasswordStrength(password)

  async function onSubmit(data: FormData) {
    try {
      await api.post('/auth/register', data)
      setRegisteredEmail(data.email)
      setRegistered(true)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors?.length) {
          err.errors.forEach((e) => toast.error(`${e.message}`))
        } else {
          toast.error(err.message)
        }
      } else {
        toast.error('Error al registrarse. Intenta nuevamente.')
      }
    }
  }

  if (registered) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="flex justify-center">
          <CheckCircle size={64} className="text-green-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">¡Registro exitoso!</h2>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            Enviamos un correo de confirmación a<br />
            <strong className="text-slate-700">{registeredEmail}</strong>
          </p>
          <p className="text-slate-400 text-xs mt-3">
            Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            El enlace expira en 24 horas.
          </p>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Crear cuenta</h1>
        <p className="text-slate-500 mt-1 text-sm">Regístrate para acceder al sistema</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Nombres */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombres" error={errors.firstName?.message}>
            <input
              placeholder="Juan"
              {...register('firstName')}
              className={inputClass(!!errors.firstName)}
            />
          </Field>
          <Field label="Apellidos" error={errors.lastName?.message}>
            <input
              placeholder="Quispe"
              {...register('lastName')}
              className={inputClass(!!errors.lastName)}
            />
          </Field>
        </div>

        {/* DNI */}
        <Field label="DNI" error={errors.dni?.message}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={8}
            placeholder="12345678"
            {...register('dni')}
            className={inputClass(!!errors.dni)}
          />
        </Field>

        {/* Email */}
        <Field label="Correo electrónico" error={errors.email?.message}>
          <input
            type="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            {...register('email')}
            className={inputClass(!!errors.email)}
          />
        </Field>

        {/* Contraseña */}
        <Field label="Contraseña" error={errors.password?.message}>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              {...register('password')}
              className={`${inputClass(!!errors.password)} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password && <PasswordStrengthBar strength={passwordStrength} />}
        </Field>

        {/* Distrito */}
        <Field label="Distrito" error={errors.district?.message}>
          <select {...register('district')} className={inputClass(!!errors.district)}>
            <option value="">Selecciona tu distrito</option>
            {CUSCO_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>

        {/* Dirección */}
        <Field label="Dirección" error={errors.address?.message}>
          <input
            placeholder="Av. El Sol 123, Cusco"
            {...register('address')}
            className={inputClass(!!errors.address)}
          />
        </Field>

        {/* Teléfono (opcional) */}
        <Field label="Teléfono (opcional)" error={errors.phone?.message}>
          <input
            type="tel"
            placeholder="987654321"
            inputMode="numeric"
            {...register('phone')}
            className={inputClass(!!errors.phone)}
          />
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600
            hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg
            transition-colors text-sm"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <UserPlus size={16} />
          )}
          {isSubmitting ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inputClass(hasError: boolean) {
  return `w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
    focus:ring-2 focus:ring-green-500 focus:border-transparent
    ${hasError ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'}`
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function getPasswordStrength(password: string): number {
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++
  return strength
}

function PasswordStrengthBar({ strength }: { strength: number }) {
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Excelente']
  const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? colors[strength] : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength >= 3 ? 'text-green-600' : 'text-slate-400'}`}>
        {labels[strength]}
      </p>
    </div>
  )
}
