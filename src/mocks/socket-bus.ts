import type { NFT, Order } from '@/api/types'

export interface VersionedPayload<TData> {
  id: string
  version: number
  data: TData
}

export interface MockSocketEvents {
  'nft.updated': VersionedPayload<NFT>
  'order.updated': VersionedPayload<Order>
}

export type MockSocketListener = <TEvent extends keyof MockSocketEvents>(
  event: TEvent,
  payload: MockSocketEvents[TEvent],
) => void

const listeners = new Set<MockSocketListener>()

export function subscribeMockSocket(listener: MockSocketListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function publishMockSocket<TEvent extends keyof MockSocketEvents>(
  event: TEvent,
  payload: MockSocketEvents[TEvent],
): void {
  for (const listener of listeners) listener(event, payload)
}
