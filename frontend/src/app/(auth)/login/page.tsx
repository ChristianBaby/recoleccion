'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, LogIn, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setUnverifiedEmail(null)
    try {
      await login(data.email, data.password)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
        if (err.message.toLowerCase().includes('verificar')) {
          setUnverifiedEmail(data.email)
        }
      } else {
        toast.error('Error al iniciar sesión. Intenta nuevamente.')
      }
    }
  }

  async function handleResendVerification() {
    if (!unverifiedEmail) return
    setResending(true)
    try {
      await api.post('/auth/resend-verification', { email: unverifiedEmail })
      toast.success('Correo de verificación reenviado. Revisa tu bandeja de entrada.')
      setUnverifiedEmail(null)
    } catch {
      toast.error('No se pudo reenviar el correo. Intenta más tarde.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Iniciar sesión</h1>
        <p className="text-slate-500 mt-1 text-sm">Accede a tu cuenta de EcoRutas</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            {...register('email')}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
              focus:ring-2 focus:ring-green-500 focus:border-transparent
              ${errors.email
                ? 'border-red-400 bg-red-50'
                : 'border-slate-300 bg-white hover:border-slate-400'
              }`}
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Contraseña */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Contraseña
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-green-600 hover:text-green-700 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
              className={`w-full px-4 py-2.5 pr-10 rounded-lg border text-sm transition-colors outline-none
                focus:ring-2 focus:ring-green-500 focus:border-transparent
                ${errors.password
                  ? 'border-red-400 bg-red-50'
                  : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
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
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        {unverifiedEmail && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium mb-2">Cuenta pendiente de verificación</p>
            <p className="text-amber-700 mb-3">
              Tu cuenta aún no ha sido verificada. ¿No recibiste el correo?
            </p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700
                disabled:bg-amber-400 text-white text-xs font-semibold rounded-md transition-colors"
            >
              {resending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Mail size={13} />
              )}
              {resending ? 'Enviando...' : 'Reenviar correo de verificación'}
            </button>
          </div>
        )}

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
            <LogIn size={16} />
          )}
          {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="text-green-600 hover:text-green-700 font-medium">
          Regístrate aquí
        </Link>
      </p>
    </div>
  )
}
