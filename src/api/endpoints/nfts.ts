import { z } from 'zod'
import { apiClient } from '@/api/client'
import {
  decimalStringSchema,
  networkSchema,
  nftListSchema,
  nftReviewListSchema,
  nftSchema,
  nftSortSchema,
  type Network,
  type NFT,
  type NFTSort,
  type NftReview,
} from '@/api/types'

export interface NFTSearchParams {
  query?: string
  collection?: string
  collections?: string[]
  network?: Network
  networks?: Network[]
  priceMin?: string
  priceMax?: string
  sort?: NFTSort
  isRare?: boolean
  page?: number
  pageSize?: number
}

const nftSearchParamsSchema = z
  .object({
    query: z.string().optional(),
    collection: z.string().optional(),
    collections: z.array(z.string()).optional(),
    network: networkSchema.optional(),
    networks: z.array(networkSchema).optional(),
    priceMin: decimalStringSchema.optional(),
    priceMax: decimalStringSchema.optional(),
    sort: nftSortSchema.optional(),
    isRare: z.boolean().optional(),
    page: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().max(100).optional(),
  })
  .strict()

export async function getNfts(
  params: NFTSearchParams = {},
  signal?: AbortSignal,
): Promise<NFT[]> {
  const validated = nftSearchParamsSchema.parse(params)
  const { data } = await apiClient.get<unknown>('/nfts', {
    params: validated,
    paramsSerializer: { indexes: null },
    signal,
  })
  return nftListSchema.parse(data)
}

export async function getNft(
  nftId: string,
  signal?: AbortSignal,
): Promise<NFT> {
  const { data } = await apiClient.get<unknown>(
    `/nfts/${encodeURIComponent(nftId)}`,
    { signal },
  )
  return nftSchema.parse(data)
}

export async function getNftReviews(
  nftId: string,
  signal?: AbortSignal,
): Promise<NftReview[]> {
  const { data } = await apiClient.get<unknown>(
    `/nfts/${encodeURIComponent(nftId)}/reviews`,
    { signal },
  )
  return nftReviewListSchema.parse(data)
}
