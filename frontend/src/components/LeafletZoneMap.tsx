'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from 'react-leaflet'
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
        const L = require('leaflet')
        map.fitBounds(L.latLngBounds(allPoints), { padding: [20, 20] })
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
  const activeZones = zones.filter((z) => z.isActive)

  return (
    <MapContainer
      center={POROY_CENTER}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {activeZones.map((zone) => {
        // GeoJSON: [lng, lat] → Leaflet: [lat, lng]
        const positions = zone.geometry.coordinates[0].map(
          ([lng, lat]) => [lat, lng] as [number, number],
        )
        const isSelected = zone.id === selectedZoneId

        return (
          <Polygon
            key={zone.id}
            positions={positions}
            pathOptions={{
              color: zone.color,
              fillColor: zone.color,
              fillOpacity: isSelected ? 0.35 : 0.15,
              weight: isSelected ? 3 : 2,
            }}
            eventHandlers={{ click: () => onZoneClick?.(zone) }}
          >
            <Tooltip sticky>{zone.name}</Tooltip>
          </Polygon>
        )
      })}

      {activeZones.length > 0 && <FitBounds zones={activeZones} />}
    </MapContainer>
  )
}
