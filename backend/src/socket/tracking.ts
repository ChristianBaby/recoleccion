import { Server, Socket } from 'socket.io'
import { prisma } from '../config/prisma'
import { haversineDistance } from '../utils/geoUtils'
import { createProximityDebouncer } from '../services/proximity.service'
import { sendRouteDelayEmail } from '../services/email.service'

const PROXIMITY_RADIUS_METERS = 500
const ALERT_DEBOUNCE_MS = 5 * 60 * 1000 // 5 minutos entre alertas por ciudadano

// debounce: userId → timestamp del último alert enviado
const proximityDebouncer = createProximityDebouncer(ALERT_DEBOUNCE_MS)

interface CitizenEntry {
  id: string
  homeLat: number
  homeLng: number
  alertRadius: number
}

// caché de ciudadanos por zona (evita consultar BD en cada position update)
const citizenCache = new Map<string, CitizenEntry[]>()
const citizenCacheTTL = new Map<string, number>()
const CACHE_TTL_MS = 60_000 // 1 minuto

async function getCitizensInZone(zoneId: string): Promise<CitizenEntry[]> {
  const now = Date.now()
  const cacheTime = citizenCacheTTL.get(zoneId) ?? 0
  if (now - cacheTime < CACHE_TTL_MS && citizenCache.has(zoneId)) {
    return citizenCache.get(zoneId)!
  }

  const citizens = await prisma.user.findMany({
    where: {
      zoneId,
      role: 'CITIZEN',
      isActive: true,
      homeLat: { not: null },
      homeLng: { not: null },
    },
    select: { id: true, homeLat: true, homeLng: true, alertRadius: true },
  })

  const result: CitizenEntry[] = citizens
    .filter((c) => c.homeLat !== null && c.homeLng !== null)
    .map((c) => ({
      id: c.id,
      homeLat: c.homeLat!,
      homeLng: c.homeLng!,
      alertRadius: c.alertRadius ?? PROXIMITY_RADIUS_METERS,
    }))

  citizenCache.set(zoneId, result)
  citizenCacheTTL.set(zoneId, now)
  return result
}

async function checkProximityAlerts(io: Server, truck: ActiveTruck) {
  if (!truck.zoneId) return

  const now = Date.now()
  const citizens = await getCitizensInZone(truck.zoneId)

  for (const citizen of citizens) {
    if (!proximityDebouncer.canNotify(citizen.id, now)) continue

    const distance = haversineDistance(truck.lat, truck.lng, citizen.homeLat, citizen.homeLng)
    if (distance <= citizen.alertRadius) {
      proximityDebouncer.markNotified(citizen.id, now)
      io.to(`user:${citizen.id}`).emit('proximity:alert', {
        vehicleCode: truck.vehicleCode,
        distance: Math.round(distance),
        alertRadius: citizen.alertRadius,
        zoneId: truck.zoneId,
        timestamp: new Date().toISOString(),
      })
    }
  }
}

interface ActiveTruck {
  socketId: string
  operatorId: string
  operatorName: string
  vehicleCode: string
  routeId: string | null
  zoneId: string | null
  lat: number
  lng: number
  speed?: number
  heading?: number
  lastSeen: string
}

// In-memory store: socketId → truck info
const activeTrucks = new Map<string, ActiveTruck>()

function anonymizeTruck(truck: ActiveTruck): ActiveTruck {
  return {
    ...truck,
    operatorId: '',
    operatorName: 'Operador Autorizado',
  }
}

function broadcastTruckUpdate(io: Server, truck: ActiveTruck) {
  if (truck.zoneId) {
    io.to(`zone:${truck.zoneId}`).emit('tracking:truck_update', anonymizeTruck(truck))
  }
  // El admin siempre recibe todo
  io.to('admin_room').emit('tracking:truck_update', truck)
}

function leaveSubscribedZone(socket: Socket) {
  const previousZoneId = socket.data.subscribedZoneId as string | undefined
  if (previousZoneId) {
    socket.leave(`zone:${previousZoneId}`)
    socket.data.subscribedZoneId = undefined
  }
}

export function setupTrackingHandlers(io: Server, socket: Socket) {
  const user = socket.data.user as { id: string; email: string; role: string; name: string }

  // Admin se une a su sala para ver todos los camiones
  if (user.role === 'ADMIN') {
    socket.join('admin_room')
    socket.emit('tracking:trucks', Array.from(activeTrucks.values()))
  }

  // ── Operador: iniciar seguimiento ─────────────────────────────────────────
  socket.on('tracking:start', async ({ routeId }: { routeId?: string }) => {
    if (user.role !== 'OPERATOR' && user.role !== 'ADMIN') return

    let zoneId: string | null = null
    let executionId: string | null = null
    let vehicleCode = 'Vehiculo municipal'

    if (routeId) {
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        select: { zoneId: true, vehicleId: true, vehicle: { select: { plate: true } } },
      })
      if (route) {
        zoneId = route.zoneId
        vehicleCode = route.vehicle?.plate ?? route.vehicleId ?? vehicleCode
        socket.join(`zone:${zoneId}`)

        if (route.vehicleId) {
          try {
            const execution = await prisma.routeExecution.create({
              data: {
                routeId,
                operatorId: user.id,
                vehicleId: route.vehicleId,
                date: new Date(),
                startedAt: new Date(),
                status: 'IN_PROGRESS',
              },
            })
            executionId = execution.id
          } catch { /* La ruta puede no tener vehículo asignado */ }
        }
      }
    }

    socket.data.routeId = routeId ?? null
    socket.data.zoneId = zoneId
    socket.data.executionId = executionId
    socket.data.vehicleCode = vehicleCode

    socket.emit('tracking:started', { routeId, zoneId, executionId })
    const filteredTrucks = Array.from(activeTrucks.values()).filter(
      (t) => !zoneId || t.zoneId === zoneId,
    )
    socket.emit('tracking:trucks', user.role === 'ADMIN' ? filteredTrucks : filteredTrucks.map(anonymizeTruck))
  })

  // ── Operador: enviar posición ──────────────────────────────────────────────
  socket.on('tracking:position', async ({
    lat, lng, speed, heading,
  }: { lat: number; lng: number; speed?: number; heading?: number }) => {
    if (user.role !== 'OPERATOR' && user.role !== 'ADMIN') return

    const truck: ActiveTruck = {
      socketId: socket.id,
      operatorId: user.id,
      operatorName: user.name,
      vehicleCode: socket.data.vehicleCode ?? 'Vehiculo municipal',
      routeId: socket.data.routeId ?? null,
      zoneId: socket.data.zoneId ?? null,
      lat,
      lng,
      speed,
      heading,
      lastSeen: new Date().toISOString(),
    }
    activeTrucks.set(socket.id, truck)
    broadcastTruckUpdate(io, truck)
    checkProximityAlerts(io, truck).catch(() => { /* no bloquear el flujo de tracking */ })

    // Guardar en BD si hay RouteExecution
    if (socket.data.executionId) {
      prisma.gpsTrack.create({
        data: {
          routeExecutionId: socket.data.executionId,
          lat, lng,
          speed: speed ?? null,
          heading: heading ?? null,
        },
      }).catch(() => { /* ignorar errores de BD en tracking */ })
    }
  })

  // ── Ciudadano/Admin: suscribirse a zona ───────────────────────────────────
  socket.on('tracking:subscribe', ({ zoneId }: { zoneId: string }) => {
    leaveSubscribedZone(socket)
    socket.join(`zone:${zoneId}`)
    socket.data.subscribedZoneId = zoneId
    // Enviar camiones activos en esa zona
    const zoneTrucks = Array.from(activeTrucks.values()).filter((t) => t.zoneId === zoneId)
    socket.emit('tracking:trucks', user.role === 'ADMIN' ? zoneTrucks : zoneTrucks.map(anonymizeTruck))
  })

  // ── Ciudadano sin zona: recibe todos los camiones activos ─────────────────
  socket.on('tracking:all', () => {
    leaveSubscribedZone(socket)
    const allTrucks = Array.from(activeTrucks.values())
    socket.emit('tracking:trucks', user.role === 'ADMIN' ? allTrucks : allTrucks.map(anonymizeTruck))
  })

  // ── Operador: reportar retraso (RF-13) ───────────────────────────────────
  socket.on('tracking:report_delay', async ({
    delayMinutes,
    reason,
  }: { delayMinutes: number; reason?: string }) => {
    if (user.role !== 'OPERATOR' && user.role !== 'ADMIN') return
    if (!socket.data.executionId || !socket.data.zoneId) return

    const zoneId = socket.data.zoneId as string

    // Persiste el retraso en la ejecución activa
    const execution = await prisma.routeExecution.update({
      where: { id: socket.data.executionId },
      data: { status: 'DELAYED', delayMinutes, notes: reason ?? null },
      include: { route: { select: { name: true } } },
    }).catch(() => null)

    if (!execution) return

    // Notifica a los ciudadanos de la zona y al admin
    const alert = {
      routeName: execution.route.name,
      delayMinutes,
      reason: reason ?? '',
      zoneId,
      operatorName: user.name,
      timestamp: new Date().toISOString(),
    }
    io.to(`zone:${zoneId}`).emit('route:delay_alert', alert)
    io.to('admin_room').emit('route:delay_alert', alert)

    prisma.user.findMany({
      where: { zoneId, role: 'CITIZEN', isActive: true, isVerified: true },
      select: { id: true, email: true, firstName: true },
    }).then((citizens) => {
      citizens.forEach((citizen) => {
        sendRouteDelayEmail(
          citizen.email,
          citizen.firstName,
          execution.route.name,
          delayMinutes,
          reason ?? '',
        ).catch((err) => console.error('Error enviando alerta de retraso:', err))
      })
    }).catch(() => { /* no bloquear alerta websocket */ })

    socket.emit('tracking:delay_reported', { ok: true })
  })

  // ── Operador: detener seguimiento ─────────────────────────────────────────
  socket.on('tracking:stop', async () => {
    await cleanupTracking(socket, io)
  })

  // ── Limpieza al desconectar ───────────────────────────────────────────────
  socket.on('disconnect', async () => {
    if (activeTrucks.has(socket.id)) {
      await cleanupTracking(socket, io)
    }
  })
}

export function invalidateCitizenCache(zoneId: string) {
  citizenCache.delete(zoneId)
  citizenCacheTTL.delete(zoneId)
}

async function cleanupTracking(socket: Socket, io: Server) {
  const truck = activeTrucks.get(socket.id)
  if (!truck) return

  activeTrucks.delete(socket.id)

  // Notificar a la zona y al admin
  const removed = { socketId: socket.id }
  if (truck.zoneId) {
    io.to(`zone:${truck.zoneId}`).emit('tracking:truck_removed', removed)
  }
  io.to('admin_room').emit('tracking:truck_removed', removed)

  // Cerrar RouteExecution
  if (socket.data.executionId) {
    prisma.routeExecution.update({
      where: { id: socket.data.executionId },
      data: { status: 'COMPLETED', endedAt: new Date() },
    }).catch(() => { })
  }
}
