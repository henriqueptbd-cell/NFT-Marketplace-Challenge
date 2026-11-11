import { io, type Socket } from 'socket.io-client'
import type { NFT, Order } from '@/api/types'

export interface VersionedPayload<TData> {
  id: string
  version: number
  data: TData
}

export interface ServerToClientEvents {
  'nft.updated': (payload: VersionedPayload<NFT>) => void
  'order.updated': (payload: VersionedPayload<Order>) => void
}

export interface ClientToServerEvents {
  'nft.subscribe': (nftId: string) => void
  'order.subscribe': (orderId: string) => void
}

export function createRealtimeClient(): Socket<
  ServerToClientEvents,
  ClientToServerEvents
> {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin
  return io(socketUrl, {
    path: '/socket.io',
    transports: ['websocket'],
    autoConnect: false,
  }) as unknown as Socket<ServerToClientEvents, ClientToServerEvents>
}
