'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polygon, Tooltip, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Zone } from '@/types'

const CUSCO_CENTER: [number, number] = [-13.5319, -71.9675]

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

// Ícono personalizado para el camión
function makeTruckIcon(isOwn: boolean) {
  return L.divIcon({
    html: `
      <div style="
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

// Ícono para la posición propia del operador
const myPositionIcon = L.divIcon({
  html: `
    <div style="
      width:16px;height:16px;border-radius:50%;
      background:#3b82f6;border:3px solid white;
      box-shadow:0 0 0 3px rgba(59,130,246,0.3);
    "></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

interface Props {
  zones: Zone[]
  trucks: TruckPosition[]
  myPosition?: { lat: number; lng: number } | null
  ownSocketId?: string
}

export default function LeafletTrackingMap({ zones, trucks, myPosition, ownSocketId }: Props) {
  return (
    <MapContainer center={CUSCO_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Zonas como polígonos */}
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

      {/* Camiones activos */}
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

      {/* Posición propia del operador */}
      {myPosition && (
        <Marker position={[myPosition.lat, myPosition.lng]} icon={myPositionIcon}>
          <Popup>
            <p className="text-xs font-medium">Mi posición actual</p>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
