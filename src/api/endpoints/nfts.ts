import { z } from 'zod'
import { apiClient } from '@/api/client'
import {
  networkSchema,
  nftListSchema,
  nftSchema,
  type Network,
  type NFT,
} from '@/api/types'

export interface NFTSearchParams {
  query?: string
  collection?: string
  network?: Network
  isRare?: boolean
  page?: number
  pageSize?: number
}

const nftSearchParamsSchema = z
  .object({
    query: z.string().optional(),
    collection: z.string().optional(),
    network: networkSchema.optional(),
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
