import { z } from 'zod'
import { apiClient } from '@/api/client'
import { favoriteSchema, type Favorite } from '@/api/types'

const favoriteListSchema = z.array(favoriteSchema)

export async function getFavorites(): Promise<Favorite[]> {
  const { data } = await apiClient.get<unknown>('/favorites')
  return favoriteListSchema.parse(data)
}

export async function addFavorite(nftId: string): Promise<Favorite> {
  const { data } = await apiClient.post<unknown>(
    `/favorites/${encodeURIComponent(nftId)}`,
  )
  return favoriteSchema.parse(data)
}

export async function removeFavorite(nftId: string): Promise<void> {
  await apiClient.delete(`/favorites/${encodeURIComponent(nftId)}`)
}
