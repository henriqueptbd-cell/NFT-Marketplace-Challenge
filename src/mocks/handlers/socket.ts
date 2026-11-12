import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type { NFT, Order } from '@/api/types'
import { readSessionUser } from '@/mocks/handlers/common'
import { getActiveMockScenario } from '@/mocks/scenarios'
import { subscribeMockSocket } from '@/mocks/socket-bus'
import { getMockState, nextMockVersion } from '@/mocks/store'

const socketUrl = new URL('/', window.location.origin)
socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:'
const socketLink = ws.link(socketUrl.href)

interface VersionedPayload<TData> {
  id: string
  version: number
  data: TData
}

async function readSocketUser(cookieHeader: string) {
  const request = new Request(window.location.href, {
    headers: { cookie: cookieHeader },
  })
  return readSessionUser(request)
}

export const socketHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    const { client } = toSocketIo(connection)
    const subscribedOrders = new Map<string, string>()

    const emitAuthorizedOrderUpdate = async (
      payload: VersionedPayload<Order>,
    ) => {
      const ownerId = subscribedOrders.get(payload.id)
      if (!ownerId || payload.data.userId !== ownerId) return

      const cookieHeader = document.cookie
      try {
        const user = await readSocketUser(cookieHeader)
        if (!user || user.id !== ownerId || document.cookie !== cookieHeader) {
          subscribedOrders.delete(payload.id)
          return
        }

        const currentOrder = getMockState().orders.find(
          (order) => order.id === payload.id && order.userId === ownerId,
        )
        if (!currentOrder || currentOrder.version !== payload.version) return

        client.emit('order.updated', payload)
      } catch {
        subscribedOrders.delete(payload.id)
      }
    }

    const unsubscribe = subscribeMockSocket((event, payload) => {
      if (event === 'order.updated') {
        void emitAuthorizedOrderUpdate(payload as VersionedPayload<Order>)
        return
      }
      client.emit(event, payload as VersionedPayload<NFT>)
    })
    connection.server.addEventListener(
      'close',
      () => {
        subscribedOrders.clear()
        unsubscribe()
      },
      { once: true },
    )

    client.on('nft.subscribe', (_event, nftId: unknown) => {
      if (typeof nftId !== 'string') return
      const nft = getMockState().nfts.find((item) => item.id === nftId)
      if (!nft) return

      const first = { id: nft.id, version: nextMockVersion(), data: nft }
      if (getActiveMockScenario() === 'out-of-order') {
        const second = { id: nft.id, version: nextMockVersion(), data: nft }
        client.emit('nft.updated', second)
        window.setTimeout(() => client.emit('nft.updated', first), 25)
        return
      }
      client.emit('nft.updated', first)
    })

    client.on('order.subscribe', (_event, orderId: unknown) => {
      if (typeof orderId !== 'string') return
      void (async () => {
        const cookieHeader = document.cookie
        const user = await readSocketUser(cookieHeader)
        if (!user || document.cookie !== cookieHeader) return

        const order = getMockState().orders.find(
          (item) => item.id === orderId && item.userId === user.id,
        )
        if (!order) return

        subscribedOrders.set(order.id, user.id)
        const version = nextMockVersion()
        client.emit('order.updated', {
          id: order.id,
          version,
          data: { ...order, version },
        })
      })().catch(() => undefined)
    })

    client.on('order.unsubscribe', (_event, orderId: unknown) => {
      if (typeof orderId === 'string') subscribedOrders.delete(orderId)
    })
  }),
]
