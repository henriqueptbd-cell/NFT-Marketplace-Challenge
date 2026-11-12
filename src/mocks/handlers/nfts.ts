import { http, HttpResponse } from 'msw'
import { decimalStringSchema, networkSchema, nftSortSchema } from '@/api/types'
import { compareDecimalStrings } from '@/lib/decimal'
import { apiErrorResponse } from '@/mocks/handlers/common'
import { buildNftReviews } from '@/mocks/fixtures/reviews'
import { getActiveMockScenario } from '@/mocks/scenarios'
import { getMockState } from '@/mocks/store'

export const nftHandlers = [
  http.get('/api/nfts', ({ request }) => {
    const url = new URL(request.url)
    const pageRaw = url.searchParams.get('page')
    const pageSizeRaw = url.searchParams.get('pageSize')
    const rareRaw = url.searchParams.get('isRare')
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

    const networkValues = [
      ...url.searchParams.getAll('network'),
      ...url.searchParams.getAll('networks'),
    ]
    const parsedNetworks = networkValues.map((value) =>
      networkSchema.safeParse(value),
    )
    if (parsedNetworks.some((value) => !value.success)) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'network is not supported.')
    }
    const networks = parsedNetworks.flatMap((value) =>
      value.success ? [value.data] : [],
    )

    const collectionValues = [
      ...url.searchParams.getAll('collection'),
      ...url.searchParams.getAll('collections'),
      ...url.searchParams.getAll('collections[]'),
    ]
    const collections = new Set(collectionValues.filter(Boolean))
    const minRaw = url.searchParams.get('priceMin') ?? undefined
    const maxRaw = url.searchParams.get('priceMax') ?? undefined
    const parsedMin =
      minRaw === undefined ? undefined : decimalStringSchema.safeParse(minRaw)
    const parsedMax =
      maxRaw === undefined ? undefined : decimalStringSchema.safeParse(maxRaw)
    if (
      (parsedMin && !parsedMin.success) ||
      (parsedMax && !parsedMax.success)
    ) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'Price filters are invalid.')
    }
    const priceMin = parsedMin?.success ? parsedMin.data : undefined
    const priceMax = parsedMax?.success ? parsedMax.data : undefined
    if (
      priceMin !== undefined &&
      priceMax !== undefined &&
      compareDecimalStrings(priceMin, priceMax) > 0
    ) {
      return apiErrorResponse(
        400,
        'BAD_REQUEST',
        'Minimum price cannot exceed maximum price.',
      )
    }

    const sortRaw = url.searchParams.get('sort') ?? undefined
    const parsedSort =
      sortRaw === undefined ? undefined : nftSortSchema.safeParse(sortRaw)
    if (parsedSort && !parsedSort.success) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'Sort order is invalid.')
    }
    const sort = parsedSort?.success ? parsedSort.data : 'relevance'
    if (getActiveMockScenario() === 'empty') return HttpResponse.json([])

    const state = getMockState()
    const query = url.searchParams.get('query')?.trim().toLowerCase()
    const isRare = rareRaw === null ? undefined : rareRaw === 'true'
    const filtered = state.nfts.filter((nft) => {
      if (
        query &&
        !`${nft.name} ${nft.collection} ${nft.description}`
          .toLowerCase()
          .includes(query)
      )
        return false
      if (collections.size > 0 && !collections.has(nft.collection)) return false
      if (networks.length > 0 && !networks.includes(nft.network)) return false
      if (priceMin && compareDecimalStrings(nft.priceString, priceMin) < 0)
        return false
      if (priceMax && compareDecimalStrings(nft.priceString, priceMax) > 0)
        return false
      if (isRare !== undefined && nft.isRare !== isRare) return false
      return true
    })

    const sorted = filtered.slice().sort((left, right) => {
      if (sort === 'newest')
        return Date.parse(right.createdAt) - Date.parse(left.createdAt)
      if (sort === 'price-asc')
        return compareDecimalStrings(left.priceString, right.priceString)
      if (sort === 'price-desc')
        return compareDecimalStrings(right.priceString, left.priceString)
      return right.trendingScore - left.trendingScore
    })
    const start = (page - 1) * pageSize
    return HttpResponse.json(sorted.slice(start, start + pageSize))
  }),

  http.get('/api/nfts/:nftId/reviews', ({ params }) => {
    const nftId = String(params.nftId)
    const nft = getMockState().nfts.find((item) => item.id === nftId)
    if (!nft) return apiErrorResponse(404, 'NOT_FOUND', 'NFT was not found.')
    if (getActiveMockScenario() === 'empty') return HttpResponse.json([])
    return HttpResponse.json(buildNftReviews(nftId))
  }),

  http.get('/api/nfts/:nftId', ({ params }) => {
    const nftId = String(params.nftId)
    const nft = getMockState().nfts.find((item) => item.id === nftId)
    return nft
      ? HttpResponse.json(nft)
      : apiErrorResponse(404, 'NOT_FOUND', 'NFT was not found.')
  }),
]
