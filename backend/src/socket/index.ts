import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { verifyAccessToken } from '../utils/jwt'
import { prisma } from '../config/prisma'
import { setupTrackingHandlers } from './tracking'

export function setupSocketServer(httpServer: HttpServer, frontendUrl: string): Server {
  const allowedOrigins = frontendUrl.split(',').map((u) => u.trim()).filter(Boolean)
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  })

  // JWT auth middleware para cada conexión WebSocket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth['token'] as string | undefined
    if (!token) return next(new Error('Token requerido'))

    try {
      const payload = verifyAccessToken(token)
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, firstName: true, lastName: true },
      })
      if (!user || !user) return next(new Error('Usuario no encontrado'))

      socket.data.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
      }
      next()
    } catch {
      next(new Error('Token inválido o expirado'))
    }
  })

  io.on('connection', (socket) => {
    const connectedUser = socket.data.user as { id: string }
    socket.join(`user:${connectedUser.id}`)
    setupTrackingHandlers(io, socket)
  })

  return io
}
