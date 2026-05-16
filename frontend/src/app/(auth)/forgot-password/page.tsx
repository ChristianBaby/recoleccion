'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Correo electrónico inválido'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    try {
      await api.post('/auth/forgot-password', { email: data.email })
      setSubmittedEmail(data.email)
      setSent(true)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('Error al enviar el correo. Intenta nuevamente.')
      }
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-6 py-8">
        <CheckCircle size={64} className="text-green-500 mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Correo enviado</h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Si <strong>{submittedEmail}</strong> está registrado, recibirás un enlace para
            restablecer tu contraseña. Revisa también la carpeta de spam.
          </p>
          <p className="text-slate-400 text-xs mt-3">El enlace expira en 1 hora.</p>
        </div>
        <Link
          href="/login"
          className="block w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition-colors text-center"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              {...register('email')}
              className={`w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm transition-colors outline-none
                focus:ring-2 focus:ring-green-500 focus:border-transparent
                ${errors.email
                  ? 'border-red-400 bg-red-50'
                  : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600
            hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg
            transition-colors text-sm"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={14} />
        Volver al inicio de sesión
      </Link>
    </div>
  )
}
