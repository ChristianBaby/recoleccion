'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { ApiResponse, Zone, Route } from '@/types'
import Link from 'next/link'
import { toast } from 'sonner'

interface Stats {
  zones: number
  activeZones: number
  routes: number
  activeRoutes: number
}

interface AssignedZone {
  id: string
  name: string
  district: string
  color: string
}

// ─── Paneles Laterales Contextuales (sin iconos) ──────────────────────────────

function CitizenSidebarPanel() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between h-full">
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">
          Educación Ambiental
        </span>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Guía de Segregación</h3>
        
        <div className="space-y-4">
          <div className="border-l-2 border-emerald-600 pl-3">
            <h4 className="text-xs font-semibold text-slate-800 uppercase">Orgánicos</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Restos de comida, cáscaras de frutas y verduras. Depositar en bolsas biodegradables.
            </p>
          </div>
          
          <div className="border-l-2 border-blue-600 pl-3">
            <h4 className="text-xs font-semibold text-slate-800 uppercase">Aprovechables</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Papel, cartón, plástico duro, latas de metal limpias, secas y compactadas.
            </p>
          </div>
          
          <div className="border-l-2 border-slate-400 pl-3">
            <h4 className="text-xs font-semibold text-slate-800 uppercase">No Aprovechables</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Servilletas usadas, envolturas de golosinas, tecnopor y residuos sanitarios.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-100">
        <span className="text-[9px] font-bold text-teal-850 uppercase tracking-wider block mb-1">
          Dato Ecológico
        </span>
        <p className="text-[11px] text-slate-600 leading-relaxed italic">
          "Separar los residuos adecuadamente reduce hasta en un 60% la cantidad de basura que termina en los rellenos sanitarios de la municipalidad."
        </p>
      </div>
    </div>
  )
}

function AdminSidebarPanel() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between h-full">
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">
          Actividad del Sistema
        </span>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Eventos Recientes</h3>
        
        <div className="space-y-4">
          <div className="relative pl-4 border-l border-slate-100">
            <span className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 block">Hace 15 min</span>
            <p className="text-[11px] text-slate-700 leading-normal">
              Ruta <span className="font-semibold">Sector Centro A</span> iniciada por Vehículo V-102.
            </p>
          </div>

          <div className="relative pl-4 border-l border-slate-100">
            <span className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 block">Hace 45 min</span>
            <p className="text-[11px] text-slate-700 leading-normal">
              Zona de recolección <span className="font-semibold">Urb. Las Flores</span> asignada con éxito.
            </p>
          </div>

          <div className="relative pl-4 border-l border-slate-100">
            <span className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 block">Hace 2 horas</span>
            <p className="text-[11px] text-slate-700 leading-normal">
              Incidencia de <span className="font-semibold">Contenedor Lleno</span> resuelta en Av. Principal.
            </p>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col gap-2">
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-500">Estado del servidor:</span>
          <span className="font-bold text-emerald-700 uppercase">Óptimo</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span className="text-slate-500">Alertas activas:</span>
          <span className="font-bold text-slate-900">0</span>
        </div>
      </div>
    </div>
  )
}

function OperatorSidebarPanel() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between h-full">
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">
          Guía de la Jornada
        </span>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Recomendaciones de Ruta</h3>
        
        <div className="space-y-4 text-[11px] text-slate-650 leading-relaxed">
          <p className="border-l-2 border-amber-500 pl-3">
            <span className="font-bold text-slate-800 block">Seguridad Vial</span>
            Mantener la velocidad por debajo de los 30 km/h en calles residenciales y zonas escolares.
          </p>
          
          <p className="border-l-2 border-teal-500 pl-3">
            <span className="font-bold text-slate-800 block">Registro de Horarios</span>
            Marcar la ruta como finalizada inmediatamente al regresar al depósito municipal.
          </p>
          
          <p className="border-l-2 border-slate-400 pl-3">
            <span className="font-bold text-slate-800 block">Equipo de Protección</span>
            Uso obligatorio de guantes de protección y chaleco de alta visibilidad durante el recorrido.
          </p>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-100">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Estado del Clima
        </span>
        <p className="text-[11px] text-slate-700 font-semibold">
          Despejado · 18°C
        </p>
        <p className="text-[10px] text-slate-450 mt-0.5">
          Vías en condiciones normales de tránsito.
        </p>
      </div>
    </div>
  )
}

// ─── Banner de zona para ciudadanos (sin iconos) ──────────────────────────────

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
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">Estado de Zona</p>
        <p className="text-sm font-bold text-amber-950 mt-1">Sin zona de recolección asignada</p>
        <p className="text-xs text-amber-850 mt-1 leading-relaxed">
          Detecta tu ubicación actual para asignarte la zona correspondiente y ver horarios y mapas de rastreo.
        </p>
      </div>
      <button
        onClick={handleDetect}
        disabled={detecting}
        className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded bg-amber-855
          hover:bg-amber-900 disabled:bg-amber-400 text-white text-xs font-bold tracking-wider uppercase
          transition-colors"
      >
        {detecting && (
          <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
        )}
        {detecting ? 'Detectando…' : 'Detectar mi zona'}
      </button>
    </div>
  )
}

// ─── Tarjeta de zona asignada (sin iconos) ────────────────────────────────────

function ZoneAssignedCard({
  zone,
  onDismiss,
}: {
  zone: AssignedZone
  onDismiss: () => void
}) {
  return (
    <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50/40 p-5 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold text-teal-855 uppercase tracking-widest font-mono">
          Confirmación de asignación
        </span>
        <p className="text-sm font-semibold text-teal-950 mt-1">
          Zona asignada:{' '}
          <span style={{ color: zone.color }} className="font-bold">{zone.name}</span>
        </p>
        <p className="text-xs text-teal-850 mt-0.5">{zone.district}</p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 px-3 py-1.5 text-[10px] font-bold tracking-wider text-teal-700 hover:text-teal-900 hover:bg-teal-100/50 rounded uppercase transition-colors"
        aria-label="Cerrar notificación"
      >
        Cerrar
      </button>
    </div>
  )
}

// ─── Página principal del dashboard (sin iconos, 2 columnas) ─────────────────

export default function DashboardPage() {
  const { user, accessToken } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [assignedZone, setAssignedZone] = useState<AssignedZone | null>(null)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)

  useEffect(() => {
    if (!accessToken) return

    Promise.all([
      api.get<ApiResponse<Zone[]>>('/zones', accessToken),
      api.get<ApiResponse<Route[]>>('/routes', accessToken),
    ])
      .then(([zonesRes, routesRes]) => {
        const zones = zonesRes.data ?? []
        const routes = routesRes.data ?? []
        setStats({
          zones: zones.length,
          activeZones: zones.filter((z) => z.isActive).length,
          routes: routes.length,
          activeRoutes: routes.filter((r) => r.status === 'ACTIVE').length,
        })
      })
      .catch(() => setStats({ zones: 0, activeZones: 0, routes: 0, activeRoutes: 0 }))
  }, [accessToken])

  const handleZoneAssigned = useCallback((zone: AssignedZone) => {
    setAssignedZone(zone)
    setShowSuccessBanner(true)
  }, [])

  const activeRole = user?.role || 'CITIZEN'
  const isCitizen = activeRole === 'CITIZEN'
  const hasZone = !!user?.zoneId
  const showDetectBanner = isCitizen && !hasZone && !showSuccessBanner

  const cards = [
    {
      label: 'Zonas registradas',
      value: stats?.zones ?? 0,
      sub: `${stats?.activeZones ?? 0} activas`,
      href: '/dashboard/zones',
    },
    {
      label: 'Rutas de recolección',
      value: stats?.routes ?? 0,
      sub: `${stats?.activeRoutes ?? 0} activas`,
      href: '/dashboard/routes',
    },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      {/* Cabecera Principal */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-light text-slate-900 tracking-tight">
            Bienvenido, <span className="font-semibold text-teal-900">{user?.firstName}</span>
          </h1>
          <p className="text-slate-500 text-xs tracking-wider uppercase mt-1.5 font-bold">
            Panel de control · Gestión Municipal
          </p>
        </div>
      </div>

      {/* Grid de Dos Columnas (Contenido Principal y Columna Lateral) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Columna Izquierda (Principal, 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* RF-04: Banner de detección de zona para ciudadano */}
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

          {/* Tarjeta de zona ya asignada (regresa con sesión activa) */}
          {isCitizen && hasZone && !showSuccessBanner && (
            <div className="py-3 px-4 rounded-lg bg-teal-50/30 border border-teal-100 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: '#0f766e' }}
                />
                <span>Tu zona de recolección está asignada.</span>
              </div>
              <Link href="/dashboard/schedules" className="text-teal-800 hover:text-teal-950 font-bold uppercase tracking-wider text-[10px]">
                Ver horarios
              </Link>
            </div>
          )}

          {/* Tarjetas de estadísticas (solo ADMIN y OPERATOR) */}
          {activeRole !== 'CITIZEN' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {cards.map((card) => {
                const total = typeof card.value === 'number' ? card.value : 0
                const activeText = card.sub.split(' ')[0]
                const active = parseInt(activeText) || 0
                const percent = total > 0 ? (active / total) * 100 : 0

                return (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-400
                      hover:shadow-sm transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {card.label}
                      </p>
                      <p className="text-4xl font-light text-slate-900 mt-2 tracking-tight">
                        {card.value}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{card.sub}</p>
                    </div>
                    {/* Barra de progreso sutil (CSS puro) */}
                    <div className="w-full bg-slate-100 h-1 rounded-full mt-5 overflow-hidden">
                      <div
                        className="bg-teal-700 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Acciones de administración (solo ADMIN) */}
          {activeRole === 'ADMIN' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Acciones de administración
              </h2>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/zones"
                  className="px-4 py-2 rounded border border-slate-200 hover:border-slate-800 text-xs font-bold tracking-wider text-slate-700 hover:text-slate-900 uppercase transition-all hover:-translate-y-0.5 duration-200"
                >
                  Gestionar zonas
                </Link>
                <Link
                  href="/dashboard/routes"
                  className="px-4 py-2 rounded border border-slate-200 hover:border-slate-800 text-xs font-bold tracking-wider text-slate-700 hover:text-slate-900 uppercase transition-all hover:-translate-y-0.5 duration-200"
                >
                  Gestionar rutas
                </Link>
              </div>
            </div>
          )}

          {/* Accesos directos para CITIZEN */}
          {isCitizen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Link
                href="/dashboard/schedules"
                className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-400
                  hover:shadow-sm transition-all flex flex-col justify-between min-h-[160px]"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Servicio y Horarios
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-2">
                    Horarios de recolección
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Consulta las horas exactas y días asignados a tu zona de residencia.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-bold tracking-wider text-teal-700 uppercase group-hover:text-teal-900 transition-colors">
                  <span>Ver horarios</span>
                  <span className="ml-1.5 transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
              
              <Link
                href="/dashboard/tracking"
                className="group bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-400
                  hover:shadow-sm transition-all flex flex-col justify-between min-h-[160px]"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Geolocalización GPS
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-2">
                    Rastreo en tiempo real
                  </p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Ubica visualmente el camión recolector de basura sobre el mapa de la ciudad.
                  </p>
                </div>
                <div className="mt-6 flex items-center text-xs font-bold tracking-wider text-teal-700 uppercase group-hover:text-teal-900 transition-colors">
                  <span>Ver mapa</span>
                  <span className="ml-1.5 transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Columna Derecha (Lateral, 1/3) */}
        <div className="lg:col-span-1 h-full lg:sticky lg:top-6">
          {activeRole === 'CITIZEN' && <CitizenSidebarPanel />}
          {activeRole === 'ADMIN' && <AdminSidebarPanel />}
          {activeRole === 'OPERATOR' && <OperatorSidebarPanel />}
        </div>

      </div>
    </div>
  )
}
