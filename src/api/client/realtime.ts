import { io } from 'socket.io-client'

export function createRealtimeClient() {
  const url = import.meta.env.VITE_SOCKET_URL || window.location.origin
  return io(url, {
    path: '/socket.io/',
    transports: ['websocket'],
    autoConnect: false,
  })
}
