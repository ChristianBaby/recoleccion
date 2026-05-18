'use client'

import { MapContainer, TileLayer, Polygon, CircleMarker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const CUSCO_CENTER: [number, number] = [-13.5319, -71.9675]

function ClickHandler({ onAdd }: { onAdd: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onAdd(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface Props {
  // [lat, lng][] — formato interno
  vertices: [number, number][]
  onChange: (vertices: [number, number][]) => void
}

export default function LeafletPolygonEditor({ vertices, onChange }: Props) {
  const closed =
    vertices.length >= 3
      ? ([...vertices, vertices[0]] as [number, number][])
      : null

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
        <span>Haz clic en el mapa para agregar vértices</span>
        {vertices.length > 0 && (
          <>
            <span className="text-slate-300">·</span>
            <span className="font-medium">{vertices.length} punto(s)</span>
            <button
              type="button"
              onClick={() => onChange(vertices.slice(0, -1))}
              className="text-amber-600 hover:underline"
            >
              Deshacer
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-red-500 hover:underline"
            >
              Limpiar
            </button>
          </>
        )}
      </div>

      <div className="flex-1 rounded-lg overflow-hidden border border-slate-200">
        <MapContainer center={CUSCO_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onAdd={(lat, lng) => onChange([...vertices, [lat, lng]])} />

          {closed && (
            <Polygon
              positions={closed}
              pathOptions={{ color: '#22c55e', fillOpacity: 0.2, weight: 2 }}
            />
          )}

          {vertices.map(([lat, lng], i) => (
            <CircleMarker
              key={i}
              center={[lat, lng]}
              radius={5}
              pathOptions={{ color: '#22c55e', fillColor: '#fff', fillOpacity: 1, weight: 2 }}
            />
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
