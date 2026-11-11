import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addFavorite, getFavorites, removeFavorite } from '@/api/endpoints'

export const favoriteQueryKey = ['favorites'] as const

type FavoriteMutation = {
  nftId: string
  shouldFavorite: boolean
}

type FavoriteContext = { previous: string[] | undefined }

export function useFavorite(nftId: string) {
  const queryClient = useQueryClient()
  const favoritesQuery = useQuery({
    queryKey: favoriteQueryKey,
    queryFn: async () =>
      (await getFavorites()).map((favorite) => favorite.nftId),
    retry: false,
  })

  const mutation = useMutation<void, Error, FavoriteMutation, FavoriteContext>({
    mutationFn: async ({ nftId: targetId, shouldFavorite }) => {
      if (shouldFavorite) await addFavorite(targetId)
      else await removeFavorite(targetId)
    },
    onMutate: async ({ nftId: targetId, shouldFavorite }) => {
      await queryClient.cancelQueries({ queryKey: favoriteQueryKey })
      const previous = queryClient.getQueryData<string[]>(favoriteQueryKey)
      const current = previous ?? []
      const next = shouldFavorite
        ? current.includes(targetId)
          ? current
          : [...current, targetId]
        : current.filter((id) => id !== targetId)
      queryClient.setQueryData(favoriteQueryKey, next)
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous === undefined) {
        queryClient.removeQueries({ queryKey: favoriteQueryKey })
        return
      }
      queryClient.setQueryData(favoriteQueryKey, context.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: favoriteQueryKey })
      void queryClient.invalidateQueries({ queryKey: ['nfts'] })
    },
  })

  return {
    isFavorite: favoritesQuery.data?.includes(nftId) ?? false,
    isPending: mutation.isPending,
    error: mutation.error,
    toggle: (shouldFavorite: boolean) =>
      mutation.mutate({ nftId, shouldFavorite }),
  }
}
