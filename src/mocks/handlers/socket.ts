import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { getActiveMockScenario } from '@/mocks/scenarios'
import { subscribeMockSocket } from '@/mocks/socket-bus'
import { getMockState, nextMockVersion } from '@/mocks/store'

const socketUrl = new URL('/', window.location.origin)
socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:'
const socketLink = ws.link(socketUrl.href)

export const socketHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    const { client } = toSocketIo(connection)
    const unsubscribe = subscribeMockSocket((event, payload) => {
      client.emit(event, payload)
    })
    connection.server.addEventListener('close', unsubscribe, { once: true })

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
      const order = getMockState().orders.find((item) => item.id === orderId)
      if (!order) return
      const version = nextMockVersion()
      client.emit('order.updated', {
        id: order.id,
        version,
        data: { ...order, version },
      })
    })
  }),
]
