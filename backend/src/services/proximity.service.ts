import { haversineDistance } from '../utils/geoUtils'

export function shouldTriggerProximityAlert(input: {
  truckLat: number
  truckLng: number
  homeLat: number
  homeLng: number
  radiusMeters: number
}) {
  const distance = haversineDistance(
    input.truckLat,
    input.truckLng,
    input.homeLat,
    input.homeLng,
  )
  return distance <= input.radiusMeters
}

export function createProximityDebouncer(windowMs: number) {
  const lastNotificationByCitizen = new Map<string, number>()

  return {
    canNotify(citizenId: string, now = Date.now()) {
      const last = lastNotificationByCitizen.get(citizenId)
      if (last === undefined) return true
      return now - last >= windowMs
    },
    markNotified(citizenId: string, now = Date.now()) {
      lastNotificationByCitizen.set(citizenId, now)
    },
    clear(citizenId?: string) {
      if (citizenId) {
        lastNotificationByCitizen.delete(citizenId)
        return
      }
      lastNotificationByCitizen.clear()
    },
  }
}
