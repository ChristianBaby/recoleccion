'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Shield, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const router = useRouter()
  const { accessToken } = useAuth()

  const handleBack = () => {
    // Si hay un historial previo en la misma pestaña del navegador, retrocedemos
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      // Esperamos un breve instante para validar si retrocedió. Si sigue en la misma página (por ser pestaña nueva),
      // aplicamos el redireccionamiento de fallback.
      setTimeout(() => {
        if (accessToken) {
          router.push('/dashboard')
        } else {
          router.push('/register')
        }
      }, 100)
    } else {
      if (accessToken) {
        router.push('/dashboard')
      } else {
        router.push('/register')
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Encabezado */}
        <div className="bg-gradient-to-br from-teal-950 to-slate-900 p-8 sm:p-10 text-white relative">
          <div className="absolute top-4 right-4 text-white/5">
            <Shield size={120} />
          </div>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-100 hover:text-white mb-6 transition-colors bg-white/10 px-3 py-1.5 rounded-full"
          >
            <ArrowLeft size={12} /> Volver
          </button>
          <h1 className="text-3xl font-extrabold tracking-tight">Política de Privacidad</h1>
          <p className="text-teal-100 mt-2 text-sm max-w-xl">
            Tratamiento de datos personales en el Sistema Inteligente de Recolección de Residuos Sólidos Segregados.
          </p>
        </div>

        {/* Contenido de la Política */}
        <div className="p-8 sm:p-10 space-y-8">
          <div className="flex items-center gap-3 p-4 bg-teal-50/50 border border-teal-100 rounded-xl text-teal-800 text-sm">
            <Lock className="shrink-0 text-teal-700" size={20} />
            <p>
              Esta política cumple estrictamente con las directrices de la <strong>Ley N.º 29733 (Ley de Protección de Datos Personales del Perú)</strong> y su reglamento.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-teal-700 rounded-full" />
              1. Datos recolectados y finalidad
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              La Municipalidad recopila datos con la única finalidad de prestar, gestionar y optimizar el servicio inteligente de recolección de residuos. Los datos específicos que solicitamos son:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 mt-2">
              <li className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <CheckCircle2 className="text-teal-700 shrink-0 mt-0.5" size={14} />
                <span><strong>Identidad:</strong> Nombres, apellidos y Documento Nacional de Identidad (DNI) para acreditar la condición de vecino.</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <CheckCircle2 className="text-teal-700 shrink-0 mt-0.5" size={14} />
                <span><strong>Contacto:</strong> Correo electrónico y teléfono para enviar alertas de cercanía del camión e incidencias.</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <CheckCircle2 className="text-teal-700 shrink-0 mt-0.5" size={14} />
                <span><strong>Ubicación domiciliaria:</strong> Dirección y coordenadas geográficas para asignarle automáticamente una zona de recolección.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-teal-700 rounded-full" />
              2. Confidencialidad y Seguridad
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Nos tomamos muy en serio la seguridad de tu información. Aplicamos medidas técnicas y organizativas para evitar la pérdida, robo, uso indebido o acceso no autorizado:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-2 pl-2">
              <li>Cifrado fuerte (hashing mediante bcrypt) de contraseñas de acceso en base de datos.</li>
              <li>Transmisión de información cifrada en tránsito a través de protocolos seguros HTTPS y SSL.</li>
              <li>Acceso restringido a los datos de geolocalización domiciliaria exclusivamente para los fines operativos del servicio.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-teal-700 rounded-full" />
              3. Consentimiento y Derechos ARCO
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Al registrarte en la plataforma y aceptar de forma explícita nuestra casilla de términos, prestas tu consentimiento libre, previo, expreso, informado e inequívoco para el tratamiento de tus datos.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Como titular de los datos personales, puedes ejercer en cualquier momento tus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (Derechos ARCO)</strong> comunicándote con las oficinas municipales o escribiendo al canal oficial del proyecto.
            </p>
          </section>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <FileText size={14} />
              <span>Última actualización: Junio de 2026</span>
            </div>
            <span>Gobierno Municipal — Gestión Ambiental</span>
          </div>
        </div>
      </div>
    </div>
  )
}
