import { nftFixtures } from '@/mocks/fixtures/nfts'
import type { NFT } from '@/api/types/nft'

let currentNfts: NFT[] = structuredClone(nftFixtures)

export function listMockNfts(): NFT[] {
  return structuredClone(currentNfts)
}

export function findMockNft(id: string): NFT | undefined {
  const nft = currentNfts.find((item) => item.id === id)
  return nft ? structuredClone(nft) : undefined
}

export function updateMockNftPrice(
  id: string,
  priceEth: string,
): NFT | undefined {
  const index = currentNfts.findIndex((item) => item.id === id)
  const current = currentNfts[index]
  if (!current) return undefined

  const updated: NFT = { ...current, priceEth }
  currentNfts = currentNfts.map((item) => (item.id === id ? updated : item))
  return structuredClone(updated)
}

export function resetMockStore(): void {
  currentNfts = structuredClone(nftFixtures)
}
