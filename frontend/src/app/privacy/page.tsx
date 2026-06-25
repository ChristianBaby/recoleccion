'use client'

import Link from 'next/link'
import { Shield, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Encabezado */}
        <div className="bg-gradient-to-br from-green-700 to-emerald-600 p-8 sm:p-10 text-white relative">
          <div className="absolute top-4 right-4 text-white/10">
            <Shield size={120} />
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-100 hover:text-white mb-6 transition-colors bg-white/10 px-3 py-1.5 rounded-full"
          >
            <ArrowLeft size={12} /> Volver al registro
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Política de Privacidad</h1>
          <p className="text-green-100 mt-2 text-sm max-w-xl">
            Tratamiento de datos personales en el Sistema Inteligente de Recolección de Residuos Sólidos Segregados (SIRRSS) - EcoRutas Cusco.
          </p>
        </div>

        {/* Contenido de la Política */}
        <div className="p-8 sm:p-10 space-y-8">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-sm">
            <Lock className="shrink-0 text-emerald-600" size={20} />
            <p>
              Esta política cumple estrictamente con las directrices de la <strong>Ley N.º 29733 (Ley de Protección de Datos Personales del Perú)</strong> y su reglamento.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green-600 rounded-full" />
              1. Datos recolectados y finalidad
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              La Municipalidad del Cusco recopila datos con la única finalidad de prestar, gestionar y optimizar el servicio inteligente de recolección de residuos. Los datos específicos que solicitamos son:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 mt-2">
              <li className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={14} />
                <span><strong>Identidad:</strong> Nombres, apellidos y Documento Nacional de Identidad (DNI) para acreditar la condición de vecino.</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={14} />
                <span><strong>Contacto:</strong> Correo electrónico y teléfono para enviar alertas de cercanía del camión e incidencias.</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <CheckCircle2 className="text-green-600 shrink-0 mt-0.5" size={14} />
                <span><strong>Ubicación domiciliaria:</strong> Dirección y coordenadas geográficas para asignarle automáticamente una zona de recolección.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-green-600 rounded-full" />
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
              <span className="w-1.5 h-6 bg-green-600 rounded-full" />
              3. Consentimiento y Derechos ARCO
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Al registrarte en EcoRutas Cusco y aceptar de forma explícita nuestra casilla de términos, prestas tu consentimiento libre, previo, expreso, informado e inequívoco para el tratamiento de tus datos.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Como titular de los datos personales, puedes ejercer en cualquier momento tus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (Derechos ARCO)</strong> comunicándote con las oficinas de la Municipalidad del Cusco o escribiendo al canal oficial del proyecto.
            </p>
          </section>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <FileText size={14} />
              <span>Última actualización: Junio de 2026</span>
            </div>
            <span>Municipalidad del Cusco - Gestión Ambiental</span>
          </div>
        </div>
      </div>
    </div>
  )
}
