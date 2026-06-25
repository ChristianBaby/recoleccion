'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { ApiResponse, Zone, Route, Incident, IncidentStatus, Vehicle } from '@/types'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  MapPin,
  Truck,
  Calendar,
  AlertTriangle,
  Play,
  CheckCircle2,
  TrendingUp,
  Navigation,
  Settings,
  Activity,
  ShieldAlert,
  Trash2,
  PlusCircle,
  Sparkles,
  BookOpen,
  Leaf,
  Apple,
  RefreshCw,
  Clock,
  CloudSun,
  AlertOctagon,
  Users,
  ExternalLink,
  ChevronRight,
  Shield,
  ThumbsUp,
  Map,
  CheckCircle,
  CircleDot
} from 'lucide-react'

interface Stats {
  zones: number
  activeZones: number
  routes: number
  activeRoutes: number
  vehicles: number
  activeVehicles: number
}

interface AssignedZone {
  id: string
  name: string
  district: string
  color: string
}

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  WASTE_ACCUMULATION: 'Acumulación de residuos',
  DAMAGED_CONTAINER:  'Contenedor dañado',
  MISSED_COLLECTION:  'Recolección no realizada',
  OTHER:              'Otro',
}

const STATUS_CONFIG: Record<IncidentStatus, { label: string; bg: string; text: string; dot: string }> = {
  OPEN:      { label: 'Abierta',       bg: 'bg-red-50 text-red-700 border-red-100',      text: 'text-red-700',      dot: 'bg-red-500' },
  IN_REVIEW: { label: 'En revisión',   bg: 'bg-amber-50 text-amber-700 border-amber-100',    text: 'text-amber-700',    dot: 'bg-amber-500' },
  RESOLVED:  { label: 'Resuelta',      bg: 'bg-emerald-55/10 text-emerald-700 border-emerald-100',  text: 'text-emerald-700',  dot: 'bg-emerald-500' },
  CLOSED:    { label: 'Cerrada',       bg: 'bg-slate-100 text-slate-650 border-slate-200',      text: 'text-slate-650',    dot: 'bg-slate-400' },
}

const DAYS_MAP: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  0: 'Dom'
}

function getDaysLabel(days: number[]): string {
  if (!days || days.length === 0) return 'No especificado'
  if (days.length === 7) return 'Todos los días'
  if (days.length === 5 && !days.includes(6) && !days.includes(0)) return 'Lun a Vie'
  return days.map(d => DAYS_MAP[d]).join(', ')
}

// ─── Paneles Laterales Contextuales (Premium con Iconos) ───────────────────────────

function CitizenSidebarPanel() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Educación Ambiental
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Guía de Segregación en Casa</h3>
        
        <div className="space-y-4">
          <div className="border-l-4 border-emerald-500 pl-3 py-0.5">
            <div className="flex items-center gap-1.5">
              <Apple className="w-3.5 h-3.5 text-emerald-600" />
              <h4 className="text-xs font-semibold text-slate-800 uppercase">Orgánicos</h4>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Restos de comida, cáscaras de frutas y verduras. Depositar en bolsas biodegradables o composteras.
            </p>
          </div>
          
          <div className="border-l-4 border-blue-500 pl-3 py-0.5">
            <div className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <h4 className="text-xs font-semibold text-slate-800 uppercase">Aprovechables</h4>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Papel, cartón, botellas plásticas duras, latas de metal limpias, secas y compactadas para reciclaje.
            </p>
          </div>
          
          <div className="border-l-4 border-slate-400 pl-3 py-0.5">
            <div className="flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <h4 className="text-xs font-semibold text-slate-800 uppercase">No Aprovechables</h4>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Servilletas usadas, pañales, envolturas de golosinas metalizadas, tecnopor y residuos sanitarios comunes.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-100 bg-emerald-50/30 p-3 rounded-lg">
        <div className="flex items-center gap-1 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider">
            Dato Ecológico
          </span>
        </div>
        <p className="text-[11px] text-slate-650 leading-relaxed italic">
          "Separar los residuos adecuadamente reduce hasta en un 60% la cantidad de basura que termina en los vertederos del distrito."
        </p>
      </div>
    </div>
  )
}

function OperatorSidebarPanel() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-amber-600" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Guía de la Jornada
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Seguridad y Eficiencia</h3>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-700 shrink-0 h-fit">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-800">Seguridad Vial</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Mantener la velocidad por debajo de los 30 km/h en calles estrechas y urbanas. Dar preferencia al peatón.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="p-1.5 bg-teal-50 rounded-lg text-teal-700 shrink-0 h-fit">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-800">Registro de Ruta</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Activa el rastreo antes de salir del garaje municipal y márcalo como finalizado al retornar al centro de descarga.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700 shrink-0 h-fit">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-800">Uso de EPP</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Uso obligatorio de guantes reforzados, calzado de seguridad y chaleco de alta visibilidad reflectiva en todo momento.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <CloudSun className="w-5 h-5 text-amber-500" />
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
              Clima del Recorrido
            </span>
            <p className="text-[11px] text-slate-700 font-semibold mt-0.5">
              Despejado · 18°C
            </p>
          </div>
        </div>
        <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
          Vías Seguras
        </span>
      </div>
    </div>
  )
}

function AdminSidebarPanel({ stats }: { stats: Stats | null }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-teal-700 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Infraestructura del Sistema
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-4">Estado de Servidores</h3>
        
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
            <span className="text-xs font-medium text-slate-655">Servidor API:</span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              Óptimo (100%)
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
            <span className="text-xs font-medium text-slate-655">Base de Datos:</span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              Conectada
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
            <span className="text-xs font-medium text-slate-655">Rastreadores GPS activos:</span>
            <span className="text-[11px] font-bold text-slate-900">
              {stats?.activeRoutes ?? 0} vehículos
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center flex flex-col gap-1">
        <span>Último respaldo automático:</span>
        <span className="font-semibold text-slate-700 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" /> Hoy, 03:00 AM
        </span>
      </div>
    </div>
  )
}

// ─── Componentes Auxiliares del Dashboard ──────────────────────────────────────────

function ZoneBanner({
  onZoneAssigned,
}: {
  onZoneAssigned: (zone: AssignedZone) => void
}) {
  const { accessToken, updateZone } = useAuth()
  const [detecting, setDetecting] = useState(false)

  const handleDetect = useCallback(() => {
    if (!('geolocation' in navigator)) {
      toast.error('Tu navegador no soporta geolocalización')
      return
    }

    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await api.post<ApiResponse<AssignedZone | null>>(
            '/zones/assign-me',
            { lat: pos.coords.latitude, lng: pos.coords.longitude },
            accessToken!,
          )
          if (res.data) {
            updateZone(res.data.id)
            onZoneAssigned(res.data)
            toast.success(`Zona asignada: ${res.data.name}`)
          } else {
            toast.warning('Tu ubicación no pertenece a ninguna zona registrada aún.')
          }
        } catch {
          toast.error('Error al detectar la zona. Intenta nuevamente.')
        } finally {
          setDetecting(false)
        }
      },
      () => {
        toast.error('No se pudo obtener tu ubicación. Verifica los permisos del navegador.')
        setDetecting(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [accessToken, updateZone, onZoneAssigned])

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/80 to-orange-50/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-amber-805">
          <MapPin className="w-4 h-4 animate-bounce" />
          <p className="text-xs font-bold uppercase tracking-widest">Sin Zona de Recolección</p>
        </div>
        <p className="text-base font-bold text-amber-950 mt-1">¿Dónde resides actualmente?</p>
        <p className="text-xs text-amber-850 mt-1 leading-relaxed max-w-xl">
          Detecta tu ubicación geográfica para asignarte automáticamente la zona correspondiente. Con esto podrás visualizar horarios específicos, alertas locales y rastrear el camión recolector en tiempo real.
        </p>
      </div>
      <button
        onClick={handleDetect}
        disabled={detecting}
        className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-amber-800
          hover:bg-amber-900 disabled:bg-amber-400 text-white text-xs font-bold tracking-wider uppercase
          transition-all shadow hover:shadow-md active:translate-y-0.5"
      >
        {detecting ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
            Detectando…
          </>
        ) : (
          'Detectar mi zona'
        )}
      </button>
    </div>
  )
}

function ZoneAssignedCard({
  zone,
  onDismiss,
}: {
  zone: AssignedZone
  onDismiss: () => void
}) {
  return (
    <div className="mb-6 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/60 to-teal-50/40 p-5 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex-1 min-w-0 flex items-start gap-3">
        <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg h-fit shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-emerald-805 uppercase tracking-widest font-mono">
            Asignación de Zona Exitosa
          </span>
          <p className="text-base font-bold text-teal-950 mt-0.5">
            Ahora formas parte de la zona:{' '}
            <span style={{ color: zone.color }} className="font-extrabold">{zone.name}</span>
          </p>
          <p className="text-xs text-teal-850 mt-1">Sector administrativo: {zone.district}</p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 px-4 py-2 text-[10px] font-bold tracking-wider text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/50 rounded-lg uppercase transition-colors"
      >
        Aceptar
      </button>
    </div>
  )
}

// ─── Vistas Principales de Dashboard por Rol ──────────────────────────────────────

function CitizenDashboardView({
  user,
  userZoneDetail,
  loadingZone,
  routes,
}: {
  user: any
  userZoneDetail: Zone | null
  loadingZone: boolean
  routes: Route[]
}) {
  // Buscar rutas de la zona asignada
  const myZoneRoutes = routes.filter(r => r.zoneId === user?.zoneId)

  return (
    <div className="space-y-6">
      {/* Detalle de Zona / Dirección del Ciudadano */}
      {user?.zoneId && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-hidden relative">
          {/* Fondo sutil degradado decorativo basado en el color de la zona */}
          <div 
            className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none -mr-16 -mt-16"
            style={{ backgroundColor: userZoneDetail?.color || '#0f766e' }}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block animate-pulse" 
                  style={{ backgroundColor: userZoneDetail?.color || '#0f766e' }}
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Zona Domiciliaria Asignada
                </span>
              </div>
              
              {loadingZone ? (
                <div className="h-6 w-48 bg-slate-100 animate-pulse rounded mt-2" />
              ) : userZoneDetail ? (
                <>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {userZoneDetail.name}
                  </h2>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Distrito: <span className="font-semibold text-slate-700">{userZoneDetail.district}</span></span>
                  </div>
                  {userZoneDetail.description && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed">
                      <span className="font-medium text-slate-700">Cobertura:</span> {userZoneDetail.description}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-500 mt-1">Cargando detalles de tu zona...</p>
              )}
            </div>

            {/* Frecuencias Rápidas */}
            {userZoneDetail && myZoneRoutes.length > 0 && (
              <div className="bg-teal-50/50 border border-teal-105 rounded-xl p-4 md:w-80 shrink-0">
                <div className="flex items-center gap-1.5 text-teal-800 text-[10px] font-bold uppercase tracking-wide mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  Próximas Recolecciones
                </div>
                <div className="space-y-2">
                  {myZoneRoutes.slice(0, 2).map((route) => (
                    <div key={route.id} className="text-xs flex justify-between gap-2 border-b border-teal-100/50 pb-1.5 last:border-0 last:pb-0">
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-teal-700" />
                        {getDaysLabel(route.dayOfWeek)}
                      </span>
                      <span className="font-bold text-teal-900">
                        {route.startTime || 'Sin hora'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejilla de Acciones Principales (Ciudadano) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link
          href="/dashboard/tracking"
          className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Geolocalización GPS
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-red-50 text-red-650 border border-red-100 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-650" />
                EN VIVO
              </span>
            </div>
            <p className="text-base font-bold text-slate-905 mt-3 flex items-center gap-1.5">
              <Truck className="w-5 h-5 text-teal-850" />
              Rastreo en tiempo real
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Visualiza en vivo la ubicación actual del camión recolector sobre el mapa interactivo del distrito.
            </p>
          </div>
          <div className="mt-5 flex items-center text-xs font-bold tracking-wider text-teal-705 uppercase group-hover:text-teal-900 transition-colors">
            <span>Ver camión recolector</span>
            <span className="ml-1.5 transform group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>
        
        <Link
          href="/dashboard/incidents?openModal=true"
          className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
              Participación Ciudadana
            </span>
            <p className="text-base font-bold text-slate-905 mt-3 flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Reportar Incidencia
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              ¿Basura acumulada, contenedor roto o retraso crítico? Envíale un reporte geolocalizado con fotos a la municipalidad.
            </p>
          </div>
          <div className="mt-5 flex items-center text-xs font-bold tracking-wider text-amber-705 uppercase group-hover:text-amber-900 transition-colors">
            <span>Crear reporte rápido</span>
            <span className="ml-1.5 transform group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        <Link
          href="/dashboard/schedules"
          className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
              Servicio y Frecuencias
            </span>
            <p className="text-base font-bold text-slate-905 mt-3 flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-slate-800" />
              Horarios de recolección
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Consulta los días semanales y los bloques horarios de paso que corresponden a tu zona de residencia.
            </p>
          </div>
          <div className="mt-5 flex items-center text-xs font-bold tracking-wider text-slate-705 uppercase group-hover:text-slate-900 transition-colors">
            <span>Ver horarios y rutas</span>
            <span className="ml-1.5 transform group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        <Link
          href="/dashboard/learn"
          className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
              Eco-Educación
            </span>
            <p className="text-base font-bold text-slate-905 mt-3 flex items-center gap-1.5">
              <BookOpen className="w-5 h-5 text-emerald-650" />
              Aprende a Segregar
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Descubre qué residuos van en cada color de contenedor y cómo preparar tus bolsas para el reciclaje.
            </p>
          </div>
          <div className="mt-5 flex items-center text-xs font-bold tracking-wider text-emerald-705 uppercase group-hover:text-emerald-900 transition-colors">
            <span>Aprender ahora</span>
            <span className="ml-1.5 transform group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>
      </div>
    </div>
  )
}

function OperatorDashboardView({
  user,
  myRoutes,
  recentIncidents,
  onUpdateIncidentStatus,
  updatingId,
}: {
  user: any
  myRoutes: Route[]
  recentIncidents: Incident[]
  onUpdateIncidentStatus: (id: string, status: IncidentStatus) => void
  updatingId: string | null
}) {
  return (
    <div className="space-y-8">
      {/* Consola Principal del Operador */}
      <div className="bg-gradient-to-br from-teal-900 via-slate-900 to-teal-950 text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
        {/* Adorno estético en fondo */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-4 right-4 text-teal-400 opacity-20">
          <Navigation className="w-32 h-32 rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-800/40">
              Consola Operativa de Jornada
            </span>
            <h2 className="text-2xl font-light tracking-tight mt-3">
              Rastreo GPS <span className="font-semibold text-teal-300">Activo</span>
            </h2>
            <p className="text-slate-300 text-xs leading-relaxed max-w-lg mt-1">
              Para reportar tu ubicación en vivo a los ciudadanos del sector y cumplir con la fiscalización municipal, debes iniciar la jornada de transmisión GPS en el camión.
            </p>
          </div>
          
          <Link
            href="/dashboard/tracking"
            className="shrink-0 group inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-teal-450 hover:bg-teal-550 text-slate-900 font-bold uppercase text-xs tracking-wider transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 duration-200"
          >
            <Play className="w-4 h-4 fill-slate-900 text-slate-900 group-hover:scale-110 transition-transform" />
            Iniciar Transmisión GPS
          </Link>
        </div>
      </div>

      {/* Rutas Asignadas del Día */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-500" />
          Tus Rutas Asignadas
        </h3>
        
        {myRoutes.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <CheckCircle className="w-8 h-8 text-emerald-650 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No tienes rutas de conducción registradas para hoy.</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Mantente en contacto con la central si crees que esto es un error.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myRoutes.map((route) => (
              <div 
                key={route.id} 
                className="p-4 rounded-lg border border-slate-150 bg-slate-50/50 hover:border-slate-300 transition-colors flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      Código: {route.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span 
                      style={{ color: route.zone?.color, borderColor: route.zone?.color }} 
                      className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border bg-white"
                    >
                      {route.zone?.name || 'General'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">{route.name}</h4>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Salida: <span className="font-semibold text-slate-800">{route.startTime || '---'}</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">Vehículo: <span className="font-semibold text-slate-800">{route.vehicle?.plate || '---'}</span></span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/dashboard/tracking"
                  className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold tracking-wider uppercase text-center border border-slate-200 rounded transition-all flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Comenzar Recorrido
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incidencias del Sector */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-amber-600" />
            Resumen de Incidencias en la Vía
          </h3>
          <Link href="/dashboard/incidents" className="text-teal-705 hover:text-teal-900 text-xs font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
            Ver todas <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {recentIncidents.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-500">Sin reportes de incidencias activos en el sector.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentIncidents.slice(0, 3).map((inc) => (
              <div key={inc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      #{inc.trackingCode}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {INCIDENT_TYPE_LABELS[inc.type] || inc.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-1">
                    Dirección: {inc.address || 'Ubicación sin dirección'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Reportado: {new Date(inc.createdAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>

                {/* Cambio de Estado Rápido para Operador */}
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_CONFIG[inc.status]?.bg || 'bg-slate-100'}`}>
                    {STATUS_CONFIG[inc.status]?.label || inc.status}
                  </span>
                  
                  <select
                    value={inc.status}
                    disabled={updatingId === inc.id}
                    onChange={(e) => onUpdateIncidentStatus(inc.id, e.target.value as IncidentStatus)}
                    className="text-[10px] font-bold tracking-wider text-slate-700 border border-slate-200 rounded-md bg-white p-1 hover:border-slate-400 transition-colors uppercase shrink-0"
                  >
                    <option value="OPEN">Abrir</option>
                    <option value="IN_REVIEW">En revisión</option>
                    <option value="RESOLVED">Resuelta</option>
                    <option value="CLOSED">Cerrar</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AdminDashboardView({
  stats,
  incidentStats,
  recentIncidents,
  onUpdateIncidentStatus,
  updatingId,
}: {
  stats: Stats | null
  incidentStats: { open: number; inReview: number; resolved: number; closed: number }
  recentIncidents: Incident[]
  onUpdateIncidentStatus: (id: string, status: IncidentStatus) => void
  updatingId: string | null
}) {
  const cards = [
    {
      label: 'Zonas Registradas',
      value: stats?.zones ?? 0,
      sub: `${stats?.activeZones ?? 0} activas`,
      colorClass: 'text-teal-900',
      icon: Map,
      percent: stats && stats.zones > 0 ? (stats.activeZones / stats.zones) * 100 : 0,
      href: '/dashboard/zones',
    },
    {
      label: 'Rutas Municipales',
      value: stats?.routes ?? 0,
      sub: `${stats?.activeRoutes ?? 0} activas`,
      colorClass: 'text-indigo-900',
      icon: Navigation,
      percent: stats && stats.routes > 0 ? (stats.activeRoutes / stats.routes) * 100 : 0,
      href: '/dashboard/routes',
    },
    {
      label: 'Flota de Vehículos',
      value: stats?.vehicles ?? 0,
      sub: `${stats?.activeVehicles ?? 0} en ruta`,
      colorClass: 'text-slate-950',
      icon: Truck,
      percent: stats && stats.vehicles > 0 ? (stats.activeVehicles / stats.vehicles) * 100 : 0,
      href: '/dashboard/vehicles',
    },
    {
      label: 'Incidencias Totales',
      value: incidentStats.open + incidentStats.inReview + incidentStats.resolved + incidentStats.closed,
      sub: `${incidentStats.open} abiertas`,
      colorClass: 'text-red-700',
      icon: AlertOctagon,
      percent: (incidentStats.open + incidentStats.inReview + incidentStats.resolved + incidentStats.closed) > 0 
        ? ((incidentStats.resolved + incidentStats.closed) / (incidentStats.open + incidentStats.inReview + incidentStats.resolved + incidentStats.closed)) * 100 
        : 0,
      href: '/dashboard/incidents',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Tarjetas Analíticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-400 hover:shadow-sm transition-all group flex flex-col justify-between min-h-[145px]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {card.label}
                  </span>
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
                <p className="text-3xl font-light text-slate-905 mt-2 tracking-tight">
                  {card.value}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{card.sub}</p>
              </div>
              {/* Barra de Progreso */}
              <div className="w-full bg-slate-100 h-1 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-teal-700 h-full rounded-full transition-all duration-500"
                  style={{ width: `${card.percent}%` }}
                />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Control Rápido de Administración */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
          <Settings className="w-4 h-4 text-slate-500" />
          Panel de Gestión de Servicios
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/dashboard/zones"
            className="px-3 py-2 border border-slate-200 hover:border-slate-800 rounded-lg text-center text-xs font-bold tracking-wider text-slate-700 hover:text-slate-900 uppercase transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Map className="w-3.5 h-3.5" />
            Zonas
          </Link>
          <Link
            href="/dashboard/routes"
            className="px-3 py-2 border border-slate-200 hover:border-slate-800 rounded-lg text-center text-xs font-bold tracking-wider text-slate-700 hover:text-slate-900 uppercase transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5" />
            Rutas
          </Link>
          <Link
            href="/dashboard/users"
            className="px-3 py-2 border border-slate-200 hover:border-slate-800 rounded-lg text-center text-xs font-bold tracking-wider text-slate-700 hover:text-slate-900 uppercase transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Usuarios
          </Link>
          <Link
            href="/dashboard/vehicles"
            className="px-3 py-2 border border-slate-200 hover:border-slate-800 rounded-lg text-center text-xs font-bold tracking-wider text-slate-700 hover:text-slate-900 uppercase transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Truck className="w-3.5 h-3.5" />
            Vehículos
          </Link>
        </div>
      </div>

      {/* Incidencias Críticas */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-650 animate-pulse" />
            Incidencias Abiertas Críticas
          </h3>
          <Link href="/dashboard/incidents" className="text-teal-705 hover:text-teal-900 text-xs font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
            Ver todas <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {recentIncidents.filter(i => i.status === 'OPEN' || i.status === 'IN_REVIEW').length === 0 ? (
          <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-lg">
            <ThumbsUp className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-705">¡Todo al día! Sin incidencias críticas por resolver.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentIncidents.filter(i => i.status === 'OPEN' || i.status === 'IN_REVIEW').slice(0, 4).map((inc) => (
              <div key={inc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-405 font-mono">
                      #{inc.trackingCode}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {INCIDENT_TYPE_LABELS[inc.type] || inc.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-1">
                    Ubicación: {inc.address || 'Sin dirección registrada'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Reportante: {inc.citizen ? `${inc.citizen.firstName} ${inc.citizen.lastName}` : 'Anónimo'} · Hace {Math.max(1, Math.round((Date.now() - new Date(inc.createdAt).getTime()) / (1000 * 60 * 60)))} horas
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${STATUS_CONFIG[inc.status]?.bg}`}>
                    {STATUS_CONFIG[inc.status]?.label}
                  </span>
                  
                  <select
                    value={inc.status}
                    disabled={updatingId === inc.id}
                    onChange={(e) => onUpdateIncidentStatus(inc.id, e.target.value as IncidentStatus)}
                    className="text-[10px] font-bold tracking-wider text-slate-700 border border-slate-200 rounded bg-white p-1 hover:border-slate-400 transition-colors uppercase shrink-0"
                  >
                    <option value="OPEN">Abierta</option>
                    <option value="IN_REVIEW">En revisión</option>
                    <option value="RESOLVED">Resuelta</option>
                    <option value="CLOSED">Cerrada</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, accessToken } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  
  // Estados para Ciudadano
  const [userZoneDetail, setUserZoneDetail] = useState<Zone | null>(null)
  const [loadingZone, setLoadingZone] = useState(false)
  const [assignedZone, setAssignedZone] = useState<AssignedZone | null>(null)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)
  
  // Estados para Operador / Admin
  const [operatorRoutes, setOperatorRoutes] = useState<Route[]>([])
  const [allRoutes, setAllRoutes] = useState<Route[]>([])
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([])
  const [incidentStats, setIncidentStats] = useState({ open: 0, inReview: 0, resolved: 0, closed: 0 })
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const activeRole = user?.role || 'CITIZEN'
  const isCitizen = activeRole === 'CITIZEN'
  const isOperator = activeRole === 'OPERATOR'
  const isAdmin = activeRole === 'ADMIN'
  const hasZone = !!user?.zoneId
  const showDetectBanner = isCitizen && !hasZone && !showSuccessBanner

  // Carga de datos inicial
  useEffect(() => {
    if (!accessToken) return

    const promises: Promise<any>[] = [
      api.get<ApiResponse<Zone[]>>('/zones', accessToken),
      api.get<ApiResponse<Route[]>>('/routes', accessToken),
      api.get<ApiResponse<Incident[]>>('/incidents', accessToken).catch(() => ({ data: [] }))
    ]

    if (isAdmin) {
      promises.push(api.get<ApiResponse<Vehicle[]>>('/vehicles', accessToken).catch(() => ({ data: [] })))
    }

    Promise.all(promises)
      .then(([zonesRes, routesRes, incidentsRes, vehiclesRes]) => {
        const zones = zonesRes.data ?? []
        const routes = routesRes.data ?? []
        const incidents = incidentsRes.data ?? []
        const vehicles = vehiclesRes?.data ?? []

        setAllRoutes(routes)

        setStats({
          zones: zones.length,
          activeZones: zones.filter((z: Zone) => z.isActive).length,
          routes: routes.length,
          activeRoutes: routes.filter((r: Route) => r.status === 'ACTIVE').length,
          vehicles: vehicles.length,
          activeVehicles: vehicles.filter((v: Vehicle) => v.status === 'IN_ROUTE').length,
        })

        // Estadísticas de incidencias
        const open = incidents.filter((i: Incident) => i.status === 'OPEN').length
        const inReview = incidents.filter((i: Incident) => i.status === 'IN_REVIEW').length
        const resolved = incidents.filter((i: Incident) => i.status === 'RESOLVED').length
        const closed = incidents.filter((i: Incident) => i.status === 'CLOSED').length
        setIncidentStats({ open, inReview, resolved, closed })

        // Si es operador, filtrar sus rutas
        if (isOperator) {
          const myRoutes = routes.filter((r: Route) => r.operatorId === user?.id)
          setOperatorRoutes(myRoutes)
        }

        // Incidencias recientes (las últimas creadas)
        const sortedIncidents = [...incidents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setRecentIncidents(sortedIncidents)
      })
      .catch((err) => {
        console.error('Error loading dashboard stats:', err)
        setStats({ zones: 0, activeZones: 0, routes: 0, activeRoutes: 0, vehicles: 0, activeVehicles: 0 })
      })
  }, [accessToken, user, isAdmin, isOperator])

  // Carga de la zona domiciliaria del ciudadano
  useEffect(() => {
    if (!accessToken || !user?.zoneId) return

    setLoadingZone(true)
    api.get<ApiResponse<Zone>>(`/zones/${user.zoneId}`, accessToken)
      .then((res) => {
        if (res.data) {
          setUserZoneDetail(res.data)
        }
      })
      .catch((err) => {
        console.error('Error fetching citizen zone detail:', err)
      })
      .finally(() => {
        setLoadingZone(false)
      })
  }, [accessToken, user?.zoneId])

  const handleZoneAssigned = useCallback((zone: AssignedZone) => {
    setAssignedZone(zone)
    setShowSuccessBanner(true)
    
    // Recargar datos de la zona para mostrar el detalle de inmediato
    if (accessToken) {
      setLoadingZone(true)
      api.get<ApiResponse<Zone>>(`/zones/${zone.id}`, accessToken)
        .then((res) => {
          if (res.data) {
            setUserZoneDetail(res.data)
          }
        })
        .finally(() => {
          setLoadingZone(false)
        })
    }
  }, [accessToken])

  // Modificación rápida de incidencias para operador/administrador
  const handleUpdateIncidentStatus = async (id: string, newStatus: IncidentStatus) => {
    if (!accessToken) return
    setUpdatingId(id)
    try {
      await api.patch<ApiResponse<Incident>>(`/incidents/${id}`, { status: newStatus }, accessToken)
      toast.success('Estado de incidencia actualizado con éxito')
      
      // Recargar incidencias locales para ver reflejado el cambio
      const res = await api.get<ApiResponse<Incident[]>>('/incidents', accessToken)
      const incidents = res.data ?? []
      const sorted = [...incidents].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setRecentIncidents(sorted)
      
      const open = incidents.filter((i: Incident) => i.status === 'OPEN').length
      const inReview = incidents.filter((i: Incident) => i.status === 'IN_REVIEW').length
      const resolved = incidents.filter((i: Incident) => i.status === 'RESOLVED').length
      const closed = incidents.filter((i: Incident) => i.status === 'CLOSED').length
      setIncidentStats({ open, inReview, resolved, closed })
    } catch {
      toast.error('Error al actualizar el estado de la incidencia')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">
            Bienvenido, <span className="font-semibold text-teal-900">{user?.firstName}</span>
          </h1>
          <p className="text-slate-500 text-xs tracking-wider uppercase mt-1.5 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Panel de control · {isAdmin ? 'Administración Municipal' : isOperator ? 'Operador de Servicio' : 'Atención Ciudadana'}
          </p>
        </div>

        {/* Badge del Rol y Fecha */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-505 flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
          <span className={`text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-lg border shadow-sm ${
            isAdmin ? 'bg-teal-50 text-teal-800 border-teal-200' :
            isOperator ? 'bg-amber-50 text-amber-800 border-amber-200' :
            'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            Rol: {activeRole}
          </span>
        </div>
      </div>

      {/* Grid de Dos Columnas (Contenido Principal y Columna Lateral) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Columna Izquierda (Principal, 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Banner de detección de zona para ciudadano */}
          {showDetectBanner && (
            <ZoneBanner onZoneAssigned={handleZoneAssigned} />
          )}

          {/* Confirmación tras asignar zona */}
          {showSuccessBanner && assignedZone && (
            <ZoneAssignedCard
              zone={assignedZone}
              onDismiss={() => setShowSuccessBanner(false)}
            />
          )}

          {/* Renderizado de la vista de Dashboard específica para cada Rol */}
          {isCitizen && (
            <CitizenDashboardView
              user={user}
              userZoneDetail={userZoneDetail}
              loadingZone={loadingZone}
              routes={allRoutes}
            />
          )}

          {isOperator && (
            <OperatorDashboardView
              user={user}
              myRoutes={operatorRoutes}
              recentIncidents={recentIncidents}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
              updatingId={updatingId}
            />
          )}

          {isAdmin && (
            <AdminDashboardView
              stats={stats}
              incidentStats={incidentStats}
              recentIncidents={recentIncidents}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
              updatingId={updatingId}
            />
          )}
        </div>

        {/* Columna Derecha (Lateral Contextual, 1/3) */}
        <div className="lg:col-span-1 h-full lg:sticky lg:top-6">
          {isCitizen && <CitizenSidebarPanel />}
          {isOperator && <OperatorSidebarPanel />}
          {isAdmin && <AdminSidebarPanel stats={stats} />}
        </div>

      </div>
    </div>
  )
}
