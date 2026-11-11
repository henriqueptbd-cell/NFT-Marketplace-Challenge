import { http, HttpResponse } from 'msw'
import { networkSchema } from '@/api/types'
import { apiErrorResponse } from '@/mocks/handlers/common'
import { getActiveMockScenario } from '@/mocks/scenarios'
import { getMockState } from '@/mocks/store'

export const nftHandlers = [
  http.get('/api/nfts', ({ request }) => {
    const url = new URL(request.url)
    const pageRaw = url.searchParams.get('page')
    const pageSizeRaw = url.searchParams.get('pageSize')
    const rareRaw = url.searchParams.get('isRare')
    const networkRaw = url.searchParams.get('network')
    const page = pageRaw === null ? 1 : Number(pageRaw)
    const pageSize = pageSizeRaw === null ? 100 : Number(pageSizeRaw)
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return apiErrorResponse(
        400,
        'BAD_REQUEST',
        'Pagination parameters are invalid.',
      )
    }
    if (rareRaw !== null && rareRaw !== 'true' && rareRaw !== 'false') {
      return apiErrorResponse(
        400,
        'BAD_REQUEST',
        'isRare must be true or false.',
      )
    }
    const parsedNetwork =
      networkRaw === null ? undefined : networkSchema.safeParse(networkRaw)
    if (parsedNetwork && !parsedNetwork.success) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'network is not supported.')
    }
    if (getActiveMockScenario() === 'empty') return HttpResponse.json([])

    const state = getMockState()
    const query = url.searchParams.get('query')?.trim().toLowerCase()
    const collection = url.searchParams.get('collection')
    const network = parsedNetwork?.success ? parsedNetwork.data : undefined
    const isRare = rareRaw === null ? undefined : rareRaw === 'true'
    const filtered = state.nfts.filter((nft) => {
      if (
        query &&
        !`${nft.name} ${nft.collection} ${nft.description}`
          .toLowerCase()
          .includes(query)
      )
        return false
      if (collection && nft.collection !== collection) return false
      if (network && nft.network !== network) return false
      if (isRare !== undefined && nft.isRare !== isRare) return false
      return true
    })
    const start = (page - 1) * pageSize
    return HttpResponse.json(filtered.slice(start, start + pageSize))
  }),

  http.get('/api/nfts/:nftId', ({ params }) => {
    const nftId = String(params.nftId)
    const nft = getMockState().nfts.find((item) => item.id === nftId)
    return nft
      ? HttpResponse.json(nft)
      : apiErrorResponse(404, 'NOT_FOUND', 'NFT was not found.')
  }),
]
