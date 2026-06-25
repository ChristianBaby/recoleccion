'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Popup, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Route, Zone, Waypoint } from '@/types'

const CUSCO_CENTER: [number, number] = [-13.5319, -71.9675]

function makeWaypointIcon(label: string, bg: string) {
  return L.divIcon({
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${bg};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;
      border:2.5px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
      line-height:1;
    ">${label}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

function FitWaypoints({ waypoints }: { waypoints: Waypoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (waypoints.length === 0) return
    const bounds = L.latLngBounds(waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16, animate: false })
  }, [map, waypoints])
  return null
}

interface Props {
  route: Route
  zones?: Zone[]
}

export default function LeafletRouteMap({ route, zones = [] }: Props) {
  const waypoints = [...(route.waypoints ?? [])].sort((a, b) => a.order - b.order)
  const polyline: [number, number][] = waypoints.map((wp) => [wp.lat, wp.lng])
  const routeColor = route.zone?.color ?? '#2563eb'

  // Color per waypoint: first=green, last=red, rest=zone color
  function wpColor(idx: number) {
    if (idx === 0) return '#16a34a'
    if (idx === waypoints.length - 1) return '#dc2626'
    return routeColor
  }

  return (
    <MapContainer
      center={CUSCO_CENTER}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      zoomAnimation={false}
      fadeAnimation={false}
      markerZoomAnimation={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Zona de la ruta como fondo */}
      {zones
        .filter((z) => z.isActive && z.id === route.zoneId)
        .map((zone) => {
          const positions = zone.geometry.coordinates[0].map(
            ([lng, lat]) => [lat, lng] as [number, number],
          )
          return (
            <Polygon
              key={zone.id}
              positions={positions}
              pathOptions={{ color: zone.color, fillOpacity: 0.07, weight: 2, dashArray: '6 4' }}
            >
              <Tooltip sticky>{zone.name}</Tooltip>
            </Polygon>
          )
        })}

      {/* Polilínea de la trayectoria */}
      {polyline.length >= 2 && (
        <>
          {/* Sombra/borde para contraste */}
          <Polyline
            positions={polyline}
            pathOptions={{ color: '#fff', weight: 7, opacity: 0.6 }}
          />
          <Polyline
            positions={polyline}
            pathOptions={{ color: routeColor, weight: 4, opacity: 0.9 }}
          />
        </>
      )}

      {/* Marcadores de waypoints */}
      {waypoints.map((wp, idx) => (
        <Marker
          key={wp.id}
          position={[wp.lat, wp.lng]}
          icon={makeWaypointIcon(String(idx + 1), wpColor(idx))}
        >
          <Popup>
            <div className="text-xs min-w-[130px]">
              <p className="font-semibold text-slate-800 leading-tight">
                {wp.name ?? `Parada ${wp.order}`}
              </p>
              {wp.estimatedTime && (
                <p className="text-slate-500 mt-1">⏱ {wp.estimatedTime}</p>
              )}
              <p className="text-slate-400 mt-0.5">
                {wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {waypoints.length > 0 && <FitWaypoints waypoints={waypoints} />}
    </MapContainer>
  )
}
