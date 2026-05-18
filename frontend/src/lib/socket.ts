import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001'

let socket: Socket | null = null

export function getSocket(token: string): Socket {
  if (socket && socket.connected) return socket

  if (socket) {
    socket.disconnect()
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
