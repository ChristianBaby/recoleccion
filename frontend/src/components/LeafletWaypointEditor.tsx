'use client'

import { useEffect } from 'react'
import {
  MapContainer, TileLayer, Marker, Polyline,
  Polygon, Tooltip, useMapEvents, useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Zone } from '@/types'

const CUSCO_CENTER: [number, number] = [-13.5319, -71.9675]

export interface WaypointDraft {
  order: number
  lat: number
  lng: number
  name: string
}

function makeIcon(label: string, color: string) {
  return L.divIcon({
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};color:#fff;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;
      border:2.5px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,.35);
    ">${label}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function ClickToAdd({ onAdd }: { onAdd: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onAdd(e.latlng.lat, e.latlng.lng) })
  return null
}

function FitZone({ zone }: { zone: Zone | null }) {
  const map = useMap()
  useEffect(() => {
    if (!zone) return
    const coords = zone.geometry.coordinates[0].map(
      ([lng, lat]) => [lat, lng] as [number, number],
    )
    map.stop()
    map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], animate: false })
  }, [map, zone])
  return null
}

interface Props {
  waypoints: WaypointDraft[]
  onChange: (wps: WaypointDraft[]) => void
  zone: Zone | null
}

export default function LeafletWaypointEditor({ waypoints, onChange, zone }: Props) {
  const zoneColor = zone?.color ?? '#2563eb'
  const polyline: [number, number][] = waypoints.map((wp) => [wp.lat, wp.lng])

  function wpColor(idx: number) {
    if (waypoints.length <= 1) return '#16a34a'
    if (idx === 0) return '#16a34a'
    if (idx === waypoints.length - 1) return '#dc2626'
    return zoneColor
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
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickToAdd
        onAdd={(lat, lng) =>
          onChange([...waypoints, { order: waypoints.length + 1, lat, lng, name: '' }])
        }
      />
      <FitZone zone={zone} />

      {zone && (
        <Polygon
          positions={zone.geometry.coordinates[0].map(
            ([lng, lat]) => [lat, lng] as [number, number],
          )}
          pathOptions={{ color: zoneColor, fillOpacity: 0.07, weight: 2, dashArray: '6 4' }}
        />
      )}

      {polyline.length >= 2 && (
        <>
          <Polyline positions={polyline} pathOptions={{ color: '#fff', weight: 7, opacity: 0.5 }} />
          <Polyline
            positions={polyline}
            pathOptions={{ color: zoneColor, weight: 4, opacity: 0.9, dashArray: '10 5' }}
          />
        </>
      )}

      {waypoints.map((wp, idx) => (
        <Marker
          key={idx}
          position={[wp.lat, wp.lng]}
          icon={makeIcon(String(idx + 1), wpColor(idx))}
          draggable
          eventHandlers={{
            dragend(e) {
              const { lat, lng } = (e.target as L.Marker).getLatLng()
              onChange(waypoints.map((w, i) => (i === idx ? { ...w, lat, lng } : w)))
            },
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -20]}>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>
              {wp.name || `Parada ${wp.order}`}
            </span>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  )
}
