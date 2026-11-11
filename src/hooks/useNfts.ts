import { useQuery } from '@tanstack/react-query'
import { getNftById, getNfts } from '@/api/endpoints'

export const nftQueryKeys = {
  all: ['nfts'] as const,
  detail: (id: string) => ['nfts', id] as const,
}

export function useNfts() {
  return useQuery({
    queryKey: nftQueryKeys.all,
    queryFn: ({ signal }) => getNfts(signal),
  })
}

export function useNft(id: string) {
  return useQuery({
    queryKey: nftQueryKeys.detail(id),
    queryFn: ({ signal }) => getNftById(id, signal),
    enabled: id.length > 0,
  })
}
