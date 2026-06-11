'use client'

import { useEffect, useRef } from 'react'
import {
  MapContainer, TileLayer, Polygon, Tooltip,
  Marker, Popup, Polyline, useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Zone } from '@/types'

const CUSCO_CENTER: [number, number] = [-13.5319, -71.9675]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TruckPosition {
  socketId: string
  operatorId: string
  operatorName: string
  routeId: string | null
  zoneId: string | null
  lat: number
  lng: number
  speed?: number
  lastSeen: string
}

export interface WaypointOverlay {
  id: string
  order: number
  name: string | null
  lat: number
  lng: number
  estimatedTime?: string | null
}

export interface RouteOverlay {
  routeId: string
  waypoints: WaypointOverlay[]
  zoneColor: string
  visitedIds: Set<string>
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function makeTruckIcon(isOwn: boolean) {
  return L.divIcon({
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${isOwn ? '#2563eb' : '#dc2626'};
      display:flex;align-items:center;justify-content:center;
      font-size:18px;border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    ">🚛</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

const myPositionIcon = L.divIcon({
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:#3b82f6;border:3px solid white;
    box-shadow:0 0 0 4px rgba(59,130,246,0.25);
  "></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

// Idle position (operator not yet tracking)
const idlePositionIcon = L.divIcon({
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#64748b;border:3px solid white;
    box-shadow:0 0 0 4px rgba(100,116,139,0.2);
  "></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

function makeWaypointIcon(label: string, color: string, visited: boolean) {
  if (visited) {
    return L.divIcon({
      html: `<div style="
        width:26px;height:26px;border-radius:50%;
        background:#d1fae5;border:2px solid #6ee7b7;
        display:flex;align-items:center;justify-content:center;
        font-size:13px;opacity:0.8;
      ">✓</div>`,
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    })
  }
  return L.divIcon({
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;
      border:2.5px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    ">${label}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

// Pulsing icon for the first waypoint (start of route)
function makeStartIcon(color: string) {
  return L.divIcon({
    html: `<div style="position:relative;width:36px;height:36px;">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:${color};opacity:0.2;
        animation:pulse-ring 1.5s ease-out infinite;
      "></div>
      <div style="
        position:absolute;inset:4px;border-radius:50%;
        background:${color};color:#fff;
        display:flex;align-items:center;justify-content:center;
        font-size:11px;font-weight:700;
        border:2px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
      ">1</div>
    </div>
    <style>
      @keyframes pulse-ring {
        0% { transform:scale(0.8);opacity:0.4; }
        100% { transform:scale(1.8);opacity:0; }
      }
    </style>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })
}

// ─── FitToRoute (auto-zoom when route changes) ────────────────────────────────

function FitToRoute({ routeId, waypoints }: { routeId: string | null; waypoints: WaypointOverlay[] }) {
  const map = useMap()
  const lastId = useRef<string | null>(null)

  useEffect(() => {
    if (!routeId || routeId === lastId.current || waypoints.length === 0) return
    lastId.current = routeId
    const bounds = L.latLngBounds(waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
  }, [map, routeId, waypoints])

  return null
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  zones: Zone[]
  trucks: TruckPosition[]
  myPosition?: { lat: number; lng: number } | null   // live position (tracking active)
  idlePosition?: { lat: number; lng: number } | null // position before tracking starts
  ownSocketId?: string
  routeOverlay?: RouteOverlay | null
  isTracking?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeafletTrackingMap({
  zones, trucks, myPosition, idlePosition,
  ownSocketId, routeOverlay, isTracking = false,
}: Props) {
  const waypoints = routeOverlay?.waypoints ?? []
  const polyline: [number, number][] = waypoints.map((wp) => [wp.lat, wp.lng])
  const zoneColor = routeOverlay?.zoneColor ?? '#2563eb'
  const visitedIds = routeOverlay?.visitedIds ?? new Set<string>()

  function wpColor(idx: number) {
    if (waypoints.length <= 1) return '#16a34a'
    if (idx === 0) return '#16a34a'
    if (idx === waypoints.length - 1) return '#dc2626'
    return zoneColor
  }

  return (
    <MapContainer center={CUSCO_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Auto-fit when a new route is selected */}
      <FitToRoute routeId={routeOverlay?.routeId ?? null} waypoints={waypoints} />

      {/* Zone polygons */}
      {zones.filter((z) => z.isActive).map((zone) => {
        const positions = zone.geometry.coordinates[0].map(
          ([lng, lat]) => [lat, lng] as [number, number],
        )
        return (
          <Polygon
            key={zone.id}
            positions={positions}
            pathOptions={{ color: zone.color, fillOpacity: 0.08, weight: 1.5 }}
          >
            <Tooltip sticky>{zone.name}</Tooltip>
          </Polygon>
        )
      })}

      {/* ── Route overlay ─────────────────────────────────────────────────── */}
      {routeOverlay && waypoints.length >= 2 && (
        <>
          {/* White shadow for contrast */}
          <Polyline
            positions={polyline}
            pathOptions={{ color: '#ffffff', weight: 7, opacity: 0.5 }}
          />
          {/* Route line — dashed while not tracking, solid while tracking */}
          <Polyline
            positions={polyline}
            pathOptions={{
              color: zoneColor,
              weight: 4,
              opacity: 0.85,
              dashArray: isTracking ? undefined : '10 6',
            }}
          />
        </>
      )}

      {/* Waypoint markers */}
      {routeOverlay && waypoints.map((wp, idx) => {
        const visited = visitedIds.has(wp.id)
        const color = wpColor(idx)
        // First unvisited waypoint gets a pulsing icon while not yet tracking
        const isFirstUnvisited = !isTracking && idx === 0 && !visited
        const icon = isFirstUnvisited
          ? makeStartIcon(color)
          : makeWaypointIcon(String(idx + 1), color, visited)

        return (
          <Marker key={wp.id} position={[wp.lat, wp.lng]} icon={icon}
            zIndexOffset={isFirstUnvisited ? 100 : 0}>
            <Popup>
              <div className="text-xs min-w-[130px]">
                <p className="font-semibold text-slate-800 leading-tight">
                  {wp.name ?? `Parada ${wp.order}`}
                </p>
                {wp.estimatedTime && (
                  <p className="text-slate-500 mt-1">⏱ {wp.estimatedTime}</p>
                )}
                <p className={`mt-1 font-medium ${visited ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {visited ? '✓ Visitada' : 'Pendiente'}
                </p>
                {idx === 0 && !isTracking && (
                  <p className="mt-1 text-blue-500 font-medium">← Inicio de ruta</p>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}

      {/* Active trucks */}
      {trucks.map((truck) => (
        <Marker
          key={truck.socketId}
          position={[truck.lat, truck.lng]}
          icon={makeTruckIcon(truck.socketId === ownSocketId)}
        >
          <Popup>
            <div className="text-xs">
              <p className="font-semibold">{truck.operatorName}</p>
              {truck.speed !== undefined && (
                <p className="text-slate-500">{Math.round(truck.speed)} km/h</p>
              )}
              <p className="text-slate-400">
                Última señal: {new Date(truck.lastSeen).toLocaleTimeString('es-PE')}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Live position (during tracking) */}
      {myPosition && (
        <Marker position={[myPosition.lat, myPosition.lng]} icon={myPositionIcon}
          zIndexOffset={200}>
          <Popup>
            <p className="text-xs font-medium">Mi posición actual</p>
          </Popup>
        </Marker>
      )}

      {/* Idle position (before tracking — so operator can see where they are) */}
      {idlePosition && !myPosition && (
        <Marker position={[idlePosition.lat, idlePosition.lng]} icon={idlePositionIcon}
          zIndexOffset={150}>
          <Popup>
            <p className="text-xs text-slate-600 font-medium">Tu ubicación actual</p>
            <p className="text-xs text-slate-400 mt-0.5">GPS inactivo</p>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
