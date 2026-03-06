import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000'

let socket = null

export function getSocket() {
  return socket
}

export function connectSocket(userId) {
  if (socket?.connected) return socket

  socket = io(BACKEND_URL, {
    auth: { userId: String(userId) },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => console.log('Socket connected:', socket.id))
  socket.on('disconnect', () => console.log('Socket disconnected'))

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}