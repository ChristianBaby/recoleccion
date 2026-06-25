'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Zone } from '@/types'

// Poroy, Cusco, Peru
const POROY_CENTER: [number, number] = [-13.495, -72.025]

function FitBounds({ zones }: { zones: Zone[] }) {
  const map = useMap()

  useEffect(() => {
    if (!zones.length) return
    try {
      const allPoints = zones.flatMap((z) =>
        z.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]),
      )
      if (allPoints.length) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [20, 20], animate: false })
      }
    } catch {
      // ignore fitBounds errors on empty zones
    }
  }, [zones, map])

  return null
}

interface Props {
  zones: Zone[]
  onZoneClick?: (zone: Zone) => void
  selectedZoneId?: string | null
}

export default function LeafletZoneMap({ zones, onZoneClick, selectedZoneId }: Props) {
  return (
    <MapContainer
      center={POROY_CENTER}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
      zoomAnimation={false}
      fadeAnimation={false}
      markerZoomAnimation={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {zones.map((zone) => {
        // GeoJSON: [lng, lat] → Leaflet: [lat, lng]
        const positions = zone.geometry.coordinates[0].map(
          ([lng, lat]) => [lat, lng] as [number, number],
        )
        const isSelected = zone.id === selectedZoneId

        // Inactive styling: gray border/fill, dashed stroke
        const color = zone.isActive ? zone.color : '#94a3b8'
        const fillOpacity = zone.isActive 
          ? (isSelected ? 0.35 : 0.15) 
          : (isSelected ? 0.15 : 0.05)
        const weight = isSelected ? 3 : (zone.isActive ? 2 : 1)
        const dashArray = zone.isActive ? undefined : '5, 10'

        return (
          <Polygon
            key={zone.id}
            positions={positions}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity,
              weight,
              dashArray,
            }}
            eventHandlers={{ click: () => onZoneClick?.(zone) }}
          >
            <Tooltip sticky>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-slate-800">{zone.name}</span>
                {!zone.isActive && (
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">
                    Inactiva
                  </span>
                )}
              </div>
            </Tooltip>
          </Polygon>
        )
      })}

      {zones.length > 0 && <FitBounds zones={zones} />}
    </MapContainer>
  )
}
