import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { findMockNft } from '@/mocks/store/nft-store'

const socketUrl = new URL('/socket.io/', window.location.origin)
socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:'
const socketLink = ws.link(socketUrl.href)

export const socketHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    const { client, server } = toSocketIo(connection)

    client.on('price.subscribe', (_event, nftId: unknown) => {
      if (typeof nftId !== 'string') return
      const nft = findMockNft(nftId)
      if (!nft) return

      server.emit('nft.updated', {
        id: nft.id,
        priceEth: nft.priceEth,
        version: Date.now(),
      })
    })
  }),
]
