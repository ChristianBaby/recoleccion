import { haversineDistance } from '../../src/utils/geoUtils'
import {
  createProximityDebouncer,
  shouldTriggerProximityAlert,
} from '../../src/services/proximity.service'

describe('RF-12 proximidad del camion', () => {
  it('calcula distancia Haversine en metros entre dos puntos cercanos', () => {
    const meters = haversineDistance(-13.5319, -71.9675, -13.5319, -71.9630)

    expect(Math.round(meters)).toBeGreaterThanOrEqual(480)
    expect(Math.round(meters)).toBeLessThanOrEqual(500)
  })

  it('dispara alerta solo cuando el camion esta dentro del radio configurado', () => {
    expect(shouldTriggerProximityAlert({
      truckLat: -13.5319,
      truckLng: -71.9675,
      homeLat: -13.5319,
      homeLng: -71.9630,
      radiusMeters: 500,
    })).toBe(true)

    expect(shouldTriggerProximityAlert({
      truckLat: -13.5319,
      truckLng: -71.9675,
      homeLat: -13.5319,
      homeLng: -71.9600,
      radiusMeters: 500,
    })).toBe(false)
  })

  it('aplica debounce de 5 minutos por ciudadano y evento', () => {
    const debounce = createProximityDebouncer(5 * 60 * 1000)

    expect(debounce.canNotify('citizen-1', 1_000)).toBe(true)
    debounce.markNotified('citizen-1', 1_000)
    expect(debounce.canNotify('citizen-1', 1_000 + 60_000)).toBe(false)
    expect(debounce.canNotify('citizen-1', 1_000 + 301_000)).toBe(true)
  })
})
