'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Target } from 'lucide-react'
import type { Zone } from '@/types'

const CUSCO_CENTER: [number, number] = [-13.5319, -71.9675]

// Icono personalizado para los marcadores de los vértices
const getVertexIcon = () => {
  if (typeof window === 'undefined') return null
  return L.divIcon({
    className: 'custom-vertex-icon',
    html: '<div style="width: 14px; height: 14px; background-color: #22c55e; border: 2.5px solid white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.35); cursor: grab; transition: transform 0.1s;" class="hover:scale-125"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

// Componente para autocentrar el mapa al montar el polígono
function MapAutoCenter({ vertices, otherZones = [] }: { vertices: [number, number][], otherZones?: Zone[] }) {
  const map = useMap()

  useEffect(() => {
    // 1. Si estamos editando una zona existente con vértices
    if (vertices && vertices.length >= 3) {
      const bounds = L.latLngBounds(vertices)
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 1.2 })
    }
    // 2. Si es una nueva zona y hay otras zonas registradas, centramos en ellas combinadamente
    else if (otherZones && otherZones.length > 0) {
      const allPoints: [number, number][] = []
      otherZones.forEach((zone) => {
        zone.geometry.coordinates[0].forEach(([lng, lat]) => {
          allPoints.push([lat, lng])
        })
      })

      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints)
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true, duration: 1.2 })
      }
    }
  }, [map]) // Se ejecuta una sola vez cuando se inicializa el mapa con los vértices

  return null
}

// Botón flotante para centrar la vista en el polígono en cualquier momento
function CenterButton({ vertices }: { vertices: [number, number][] }) {
  const map = useMap()

  if (vertices.length < 3) return null

  function handleCenter() {
    const bounds = L.latLngBounds(vertices)
    map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.0 })
  }

  return (
    <button
      type="button"
      onClick={handleCenter}
      className="absolute bottom-3 right-3 z-[999] flex items-center justify-center p-2.5
        bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-lg
        text-slate-600 hover:text-emerald-700 transition-all active:scale-95"
      title="Centrar en la zona"
    >
      <Target size={16} />
    </button>
  )
}

function ClickHandler({ onAdd }: { onAdd: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onAdd(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface Props {
  vertices: [number, number][]
  onChange: (vertices: [number, number][]) => void
  otherZones?: Zone[]
}

export default function LeafletPolygonEditor({ vertices, onChange, otherZones = [] }: Props) {
  const closed =
    vertices.length >= 3
      ? ([...vertices, vertices[0]] as [number, number][])
      : null

  const vertexIcon = getVertexIcon()

  // Listener para capturar Ctrl+Z y deshacer el último vértice en el mapa
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const activeEl = document.activeElement
        const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')
        if (!isInput && vertices.length > 0) {
          e.preventDefault()
          onChange(vertices.slice(0, -1))
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [vertices, onChange])

  return (
    <div className="relative w-full h-full min-h-[400px] bg-slate-50">
      <MapContainer center={CUSCO_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} doubleClickZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onAdd={(lat, lng) => onChange([...vertices, [lat, lng]])} />
        
        {/* Autocentrado al montar */}
        <MapAutoCenter vertices={vertices} otherZones={otherZones} />

        {/* Botón manual de centrar */}
        <CenterButton vertices={vertices} />

        {/* Renderizar otras zonas como referencia */}
        {otherZones.map((zone) => {
          const positions = zone.geometry.coordinates[0].map(
            ([lng, lat]) => [lat, lng] as [number, number],
          )
          return (
            <Polygon
              key={zone.id}
              positions={positions}
              pathOptions={{
                color: '#94a3b8',
                fillColor: '#94a3b8',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4, 4',
              }}
            />
          )
        })}

        {closed && (
          <Polygon
            positions={closed}
            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.15, weight: 2.5 }}
          />
        )}

        {vertices.map(([lat, lng], i) => (
          vertexIcon ? (
            <Marker
              key={i}
              position={[lat, lng]}
              draggable={true}
              icon={vertexIcon}
              eventHandlers={{
                dragend(e) {
                  const marker = e.target
                  const latLng = marker.getLatLng()
                  const newVertices = [...vertices]
                  newVertices[i] = [latLng.lat, latLng.lng]
                  onChange(newVertices)
                },
                click(e) {
                  if (e.originalEvent) {
                    e.originalEvent.stopPropagation()
                  }
                },
                dblclick(e) {
                  if (e.originalEvent) {
                    e.originalEvent.stopPropagation()
                    e.originalEvent.preventDefault()
                  }
                  const newVertices = vertices.filter((_, idx) => idx !== i)
                  onChange(newVertices)
                },
                contextmenu(e) {
                  if (e.originalEvent) {
                    e.originalEvent.stopPropagation()
                    e.originalEvent.preventDefault()
                  }
                  const newVertices = vertices.filter((_, idx) => idx !== i)
                  onChange(newVertices)
                }
              }}
            />
          ) : null
        ))}
      </MapContainer>
    </div>
  )
}
