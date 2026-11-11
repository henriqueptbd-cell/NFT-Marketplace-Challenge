import { delay, http, HttpResponse } from 'msw'
import { activeMockScenario } from '@/mocks/scenarios'
import { findMockNft, listMockNfts } from '@/mocks/store/nft-store'

const responseDelay = activeMockScenario === 'latency' ? 1_500 : 0

export const nftHandlers = [
  http.get('/api/nfts', async () => {
    if (activeMockScenario === 'server-error') {
      return HttpResponse.json(
        { message: 'Mock server error' },
        { status: 500 },
      )
    }
    if (responseDelay > 0) await delay(responseDelay)
    return HttpResponse.json(listMockNfts())
  }),
  http.get('/api/nfts/:id', async ({ params }) => {
    if (activeMockScenario === 'server-error') {
      return HttpResponse.json(
        { message: 'Mock server error' },
        { status: 500 },
      )
    }
    if (responseDelay > 0) await delay(responseDelay)

    const id = String(params.id)
    const nft = findMockNft(id)
    return nft
      ? HttpResponse.json(nft)
      : HttpResponse.json({ message: 'NFT not found' }, { status: 404 })
  }),
]
