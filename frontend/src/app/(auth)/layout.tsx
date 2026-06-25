export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Panel izquierdo — branding institucional (solo en desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-950 via-slate-950 to-slate-950 flex-col justify-between p-16 text-white border-r border-teal-950/40 relative overflow-hidden">
        {/* Patrón geométrico sutil de fondo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div>
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold tracking-[0.25em] text-teal-400 uppercase">
              Gobierno Municipal
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
              Sistema de Recolección
            </h1>
          </div>
          <p className="text-slate-400 text-xs mt-3.5 max-w-sm leading-relaxed">
            Plataforma digital para la gestión, optimización y seguimiento en tiempo real del servicio de recolección de residuos sólidos segregados.
          </p>
        </div>

        {/* Tarjetas de características clave (Bypass de timeline genérico de acuerdo con frontend-design) */}
        <div className="space-y-4 max-w-md my-auto">
          {[
            { tag: 'SISTEMA DE MONITOREO', title: 'Rutas y Cobertura Geográfica', desc: 'Visualización y trazado de zonas de recolección activa mediante coordenadas GeoJSON.' },
            { tag: 'SEGUIMIENTO EN VIVO', title: 'Geolocalización en Tiempo Real', desc: 'Rastreo satelital activo de los camiones compactadores y estimación de arribo por zona.' },
            { tag: 'ALERTAS DE PROXIMIDAD', title: 'Notificaciones Ciudadanas', desc: 'Emisión automática de alertas por proximidad para optimizar los tiempos de disposición.' },
          ].map((item) => (
            <div 
              key={item.title} 
              className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-teal-500/20 transition-all duration-300 group"
            >
              <p className="text-[9px] font-bold tracking-wider text-teal-400 mb-1.5 group-hover:text-teal-350 transition-colors">{item.tag}</p>
              <h3 className="text-sm font-semibold text-slate-200">{item.title}</h3>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-slate-500 text-[10px] tracking-wider uppercase font-semibold">
          <span>Gobierno Municipal</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-16 bg-white">
        <div className="w-full max-w-md">
          {/* Logo en mobile */}
          <div className="flex lg:hidden flex-col items-center justify-center gap-1 mb-8 text-center">
            <span className="text-[9px] font-bold tracking-[0.2em] text-teal-600 uppercase">
              Gobierno Municipal
            </span>
            <span className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Sistema de Recolección
            </span>
            <div className="w-12 h-0.5 bg-teal-700 mt-2 rounded-full" />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
