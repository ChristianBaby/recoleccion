import { Server, Socket } from 'socket.io'
import { prisma } from '../config/prisma'

interface ActiveTruck {
  socketId: string
  operatorId: string
  operatorName: string
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

function broadcastTruckUpdate(io: Server, truck: ActiveTruck) {
  if (truck.zoneId) {
    io.to(`zone:${truck.zoneId}`).emit('tracking:truck_update', truck)
  }
  // El admin siempre recibe todo
  io.to('admin_room').emit('tracking:truck_update', truck)
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

    if (routeId) {
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        select: { zoneId: true, vehicleId: true },
      })
      if (route) {
        zoneId = route.zoneId
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

    socket.emit('tracking:started', { routeId, zoneId, executionId })
    socket.emit('tracking:trucks', Array.from(activeTrucks.values()).filter(
      (t) => !zoneId || t.zoneId === zoneId,
    ))
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
    socket.join(`zone:${zoneId}`)
    // Enviar camiones activos en esa zona
    const zoneTrucks = Array.from(activeTrucks.values()).filter((t) => t.zoneId === zoneId)
    socket.emit('tracking:trucks', zoneTrucks)
  })

  // ── Ciudadano sin zona: recibe todos los camiones activos ─────────────────
  socket.on('tracking:all', () => {
    socket.emit('tracking:trucks', Array.from(activeTrucks.values()))
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
