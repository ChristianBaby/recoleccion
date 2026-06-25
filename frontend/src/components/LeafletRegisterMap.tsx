'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Polygon, CircleMarker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Zone } from '@/types'
import { toast } from 'sonner'

const CUSCO_CENTER: [number, number] = [-13.5319, -71.9675]

interface SelectedPoint {
  lat: number
  lng: number
}

interface Props {
  zones: Zone[]
  selectedZoneId?: string | null
  selectedPoint?: { lat: number; lng: number } | null
  onZoneDetected: (zone: Zone | null, lat: number, lng: number) => void
}

function ClickHandler({ onPoint }: { onPoint: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPoint(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface MapControllerProps {
  zones: Zone[]
  selectedZoneId?: string | null
  mapRef: React.MutableRefObject<L.Map | null>
}

function MapController({ zones, selectedZoneId, mapRef }: MapControllerProps) {
  const map = useMap()

  // Capturar la instancia del mapa para el botón GPS
  useEffect(() => {
    mapRef.current = map
  }, [map, mapRef])

  // Centrar y ajustar la vista del mapa para abarcar todas las zonas activas al cargar
  useEffect(() => {
    const activeZones = zones.filter((z) => z.isActive)
    if (activeZones.length === 0) return

    const points = activeZones.flatMap((z) =>
      z.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])
    )
    if (points.length === 0) return

    try {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: false })
    } catch (e) {
      console.error('Error fitting map bounds to active zones:', e)
    }
  }, [map, zones])

  // Centrar en la zona seleccionada en la lista
  useEffect(() => {
    if (!selectedZoneId) return
    const zone = zones.find((z) => z.id === selectedZoneId)
    if (!zone) return

    const points = zone.geometry.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number])
    try {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true })
    } catch (e) {
      console.error('Error fitting bounds to selected zone:', e)
    }
  }, [map, selectedZoneId, zones])

  return null
}

export default function LeafletRegisterMap({ zones, selectedZoneId, selectedPoint, onZoneDetected }: Props) {
  const [selected, setSelected] = useState<SelectedPoint | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  // Sincronizar el punto seleccionado con la prop del componente padre
  useEffect(() => {
    if (selectedPoint) {
      setSelected(selectedPoint)
    } else {
      setSelected(null)
    }
  }, [selectedPoint])

  function detectZone(lat: number, lng: number): Zone | null {
    for (const zone of zones) {
      if (!zone.isActive) continue
      const ring = (zone.geometry.coordinates[0]) as [number, number][]
      if (pointInPolygon(lat, lng, ring)) return zone
    }
    return null
  }

  const handlePoint = useCallback((lat: number, lng: number) => {
    setSelected({ lat, lng })
    const zone = detectZone(lat, lng)
    onZoneDetected(zone, lat, lng)
  }, [zones, onZoneDetected])

  function useGPS() {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setGpsLoading(false)
        handlePoint(latitude, longitude)
        mapRef.current?.setView([latitude, longitude], 15, { animate: true })
      },
      () => {
        setGpsLoading(false)
        toast.error('No se pudo obtener tu ubicación por GPS')
      },
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
          bg-white border border-slate-200 rounded-lg shadow-sm text-xs font-semibold text-slate-700
          hover:bg-slate-50 disabled:opacity-50 transition-all select-none active:scale-95"
      >
        {gpsLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="text-[14px]">📍</span>
        )}
        {gpsLoading ? 'Obteniendo GPS…' : 'Usar mi ubicación'}
      </button>

      <MapContainer
        center={CUSCO_CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomAnimation={false}
        fadeAnimation={false}
        markerZoomAnimation={false}
      >
        <MapController zones={zones} selectedZoneId={selectedZoneId} mapRef={mapRef} />
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
          const isSelected = zone.id === selectedZoneId
          return (
            <Polygon
              key={zone.id}
              positions={positions}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: isSelected ? 0.35 : 0.12,
                weight: isSelected ? 3 : 1.5,
              }}
            />
          )
        })}

        {/* Selected point marker */}
        {selected && (
          <CircleMarker
            center={[selected.lat, selected.lng]}
            radius={7}
            pathOptions={{ color: '#0f766e', fillColor: '#14b8a6', fillOpacity: 1, weight: 2 }}
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
    const [xi, yi] = ring[i] // xi = lng, yi = lat
    const [xj, yj] = ring[j] // xj = lng, yj = lat
    const intersect = ((yi > lat) !== (yj > lat))
        && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}
