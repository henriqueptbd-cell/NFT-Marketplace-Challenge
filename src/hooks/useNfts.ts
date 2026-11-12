import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getNft,
  getNftReviews,
  getNfts,
  type NFTSearchParams,
} from '@/api/endpoints'

export const nftQueryKeys = {
  all: ['nfts'] as const,
  list: (params: NFTSearchParams) => ['nfts', params] as const,
  detail: (id: string) => ['nft', id] as const,
  reviews: (id: string) => ['nft', id, 'reviews'] as const,
}

export function useNfts(
  params: NFTSearchParams = {},
  options: { enabled?: boolean } = {},
) {
  const requestParams = { ...params }
  delete requestParams.page
  return useQuery({
    queryKey: nftQueryKeys.list(params),
    queryFn: ({ signal }) => getNfts(requestParams, signal),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  })
}

export function useNft(id: string) {
  return useQuery({
    queryKey: nftQueryKeys.detail(id),
    queryFn: ({ signal }) => getNft(id, signal),
    enabled: id.length > 0,
  })
}

export function useNftReviews(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: nftQueryKeys.reviews(id),
    queryFn: ({ signal }) => getNftReviews(id, signal),
    enabled: (options.enabled ?? true) && id.length > 0,
  })
}
