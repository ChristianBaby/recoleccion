export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Panel izquierdo — branding (solo en desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🌿</span>
            <span className="text-2xl font-bold tracking-tight">EcoRutas Cusco</span>
          </div>
          <p className="text-green-100 text-sm">Sistema Inteligente de Recolección de Residuos</p>
        </div>

        <div className="space-y-6">
          {[
            { icon: '🗺️', title: 'Rutas en tiempo real', desc: 'Sigue el camión recolector desde tu teléfono' },
            { icon: '♻️', title: 'Aprende a segregar', desc: 'Guías visuales para clasificar tus residuos' },
            { icon: '🔔', title: 'Alertas de recolección', desc: 'Notificaciones cuando el camión se acerca' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-4">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-green-200 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-green-300 text-xs">
          Municipalidad del Cusco © {new Date().getFullYear()}
        </p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Logo en mobile */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <span className="text-3xl">🌿</span>
            <span className="text-xl font-bold text-green-700">EcoRutas Cusco</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
