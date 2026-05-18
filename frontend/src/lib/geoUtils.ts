import type { GeoJsonPolygon } from '@/types'

// Convierte vértices [lat, lng][] a GeoJSON Polygon (cierra el anillo)
export function verticesToGeoJson(vertices: [number, number][]): GeoJsonPolygon | null {
  if (vertices.length < 3) return null
  const ring: [number, number][] = [
    ...vertices.map(([lat, lng]) => [lng, lat] as [number, number]),
    [vertices[0][1], vertices[0][0]], // cierre
  ]
  return { type: 'Polygon', coordinates: [ring] }
}

// Convierte GeoJSON Polygon a vértices [lat, lng][]
export function geoJsonToVertices(geo: GeoJsonPolygon): [number, number][] {
  const ring = geo.coordinates[0]
  // Excluir el último punto (cierra el anillo repitiendo el primero)
  return ring.slice(0, -1).map(([lng, lat]) => [lat, lng] as [number, number])
}
