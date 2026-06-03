'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polygon, CircleMarker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Zone } from '@/types'

const CUSCO_CENTER: [number, number] = [-13.5319, -71.9675]

interface SelectedPoint {
  lat: number
  lng: number
}

interface Props {
  zones: Zone[]
  onZoneDetected: (zone: Zone | null, lat: number, lng: number) => void
}

function ClickHandler({ onPoint }: { onPoint: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onPoint(e.latlng.lat, e.latlng.lng) },
  })
  return null
}

export default function LeafletRegisterMap({ zones, onZoneDetected }: Props) {
  const [selected, setSelected] = useState<SelectedPoint | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  function detectZone(lat: number, lng: number): Zone | null {
    for (const zone of zones) {
      if (!zone.isActive) continue
      const ring = (zone.geometry.coordinates[0]) as [number, number][]
      if (pointInPolygon(lat, lng, ring)) return zone
    }
    return null
  }

  function handlePoint(lat: number, lng: number) {
    setSelected({ lat, lng })
    const zone = detectZone(lat, lng)
    onZoneDetected(zone, lat, lng)
  }

  function useGPS() {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setGpsLoading(false)
        handlePoint(latitude, longitude)
        mapRef.current?.flyTo([latitude, longitude], 15, { duration: 1.2 })
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* GPS button */}
      <button
        type="button"
        onClick={useGPS}
        disabled={gpsLoading}
        className="absolute top-3 right-3 z-[9999] flex items-center gap-1.5 px-3 py-2
          bg-white border border-slate-300 rounded-lg shadow text-xs font-medium text-slate-700
          hover:bg-slate-50 disabled:opacity-50 transition-colors"
      >
        {gpsLoading ? (
          <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>📍</span>
        )}
        {gpsLoading ? 'Obteniendo GPS…' : 'Usar mi ubicación'}
      </button>

      <MapContainer
        center={CUSCO_CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef as any}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPoint={handlePoint} />

        {/* Render all active zones */}
        {zones.filter((z) => z.isActive).map((zone) => {
          const positions = zone.geometry.coordinates[0].map(
            ([lng, lat]) => [lat, lng] as [number, number],
          )
          return (
            <Polygon
              key={zone.id}
              positions={positions}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: 0.15,
                weight: 2,
              }}
            />
          )
        })}

        {/* Selected point marker */}
        {selected && (
          <CircleMarker
            center={[selected.lat, selected.lng]}
            radius={8}
            pathOptions={{ color: '#1d4ed8', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}
          />
        )}
      </MapContainer>
    </div>
  )
}

// Ray-casting point-in-polygon (GeoJSON ring: [lng, lat][])
function pointInPolygon(lat: number, lng: number, ring: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}
