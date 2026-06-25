'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { api, ApiError } from '@/lib/api'

type Status = 'loading' | 'success' | 'error'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Enlace de verificación inválido.')
      return
    }

    api.post<{ message?: string }>('/auth/verify-email', { token })
      .then((res) => {
        setStatus('success')
        setMessage(res.message ?? 'Cuenta verificada exitosamente.')
      })
      .catch((err: unknown) => {
        setStatus('error')
        setMessage(
          err instanceof ApiError
            ? err.message
            : 'Error al verificar la cuenta. Intenta nuevamente.',
        )
      })
  }, [searchParams])

  return (
    <div className="text-center space-y-6 py-8">
      {status === 'loading' && (
        <>
          <Loader2 size={64} className="animate-spin text-teal-600 mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Verificando tu cuenta...</h2>
            <p className="text-slate-500 text-sm mt-1">Por favor espera un momento.</p>
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle size={64} className="text-teal-600 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">¡Cuenta verificada!</h2>
            <p className="text-slate-500 text-sm mt-2">{message}</p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Iniciar sesión
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle size={64} className="text-red-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Error de verificación</h2>
            <p className="text-slate-500 text-sm mt-2">{message}</p>
          </div>
          <button
            onClick={() => router.push('/register')}
            className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            Registrarse nuevamente
          </button>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center space-y-6 py-8">
          <Loader2 size={64} className="animate-spin text-teal-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Cargando...</h2>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
