'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { api, ApiError } from '@/lib/api'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe tener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (!token) {
    return (
      <div className="text-center space-y-6 py-8">
        <XCircle size={64} className="text-red-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Enlace inválido</h2>
          <p className="text-slate-500 text-sm mt-2">
            Este enlace de restablecimiento no es válido o ya fue utilizado.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="block w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors text-center"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center space-y-6 py-8">
        <CheckCircle size={64} className="text-green-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">¡Contraseña actualizada!</h2>
          <p className="text-slate-500 text-sm mt-2">
            Tu contraseña fue restablecida exitosamente. Ya puedes iniciar sesión.
          </p>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors"
        >
          Iniciar sesión
        </button>
      </div>
    )
  }

  async function onSubmit(data: FormData) {
    try {
      await api.post('/auth/reset-password', { token, password: data.password })
      setSuccess(true)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Error al restablecer la contraseña.')
      }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nueva contraseña</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Crea una contraseña segura para tu cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Nueva contraseña */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Nueva contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              {...register('password')}
              className={`w-full px-4 py-2.5 pr-10 rounded-lg border text-sm transition-colors outline-none
                focus:ring-2 focus:ring-green-500 focus:border-transparent
                ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'}`}
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

        {/* Confirmar contraseña */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Confirmar contraseña</label>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Repite la contraseña"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
              focus:ring-2 focus:ring-green-500 focus:border-transparent
              ${errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white hover:border-slate-400'}`}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Reglas de contraseña */}
        <ul className="text-xs text-slate-400 space-y-1 pl-1">
          <li>• Al menos 8 caracteres</li>
          <li>• Al menos una letra mayúscula</li>
          <li>• Al menos un número</li>
        </ul>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600
            hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg
            transition-colors text-sm"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? 'Guardando...' : 'Restablecer contraseña'}
        </button>
      </form>
    </div>
  )
}
