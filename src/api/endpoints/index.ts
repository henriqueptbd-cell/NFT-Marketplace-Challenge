import { apiClient } from '@/api/client'
import { nftListSchema, nftSchema, type NFT } from '@/api/types/nft'

export async function getNfts(signal?: AbortSignal): Promise<NFT[]> {
  const response = await apiClient.get<unknown>('/nfts', { signal })
  return nftListSchema.parse(response.data)
}

export async function getNftById(
  id: string,
  signal?: AbortSignal,
): Promise<NFT> {
  const response = await apiClient.get<unknown>(
    `/nfts/${encodeURIComponent(id)}`,
    {
      signal,
    },
  )
  return nftSchema.parse(response.data)
}
