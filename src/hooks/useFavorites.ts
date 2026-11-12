import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addFavorite, getFavorites, removeFavorite } from '@/api/endpoints'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export const favoriteQueryKey = (userId: string | undefined) =>
  ['favorites', userId] as const

type FavoriteMutation = {
  nftId: string
  shouldFavorite: boolean
}

type FavoriteContext = {
  previous: string[] | undefined
  queryKey: ReturnType<typeof favoriteQueryKey>
}

export function useFavorite(nftId: string) {
  const queryClient = useQueryClient()
  const user = useCurrentUser()
  const queryKey = favoriteQueryKey(user?.id)
  const favoritesQuery = useQuery({
    queryKey,
    queryFn: async () =>
      (await getFavorites()).map((favorite) => favorite.nftId),
    retry: false,
    enabled: Boolean(user),
  })

  const mutation = useMutation<void, Error, FavoriteMutation, FavoriteContext>({
    mutationFn: async ({ nftId: targetId, shouldFavorite }) => {
      if (shouldFavorite) await addFavorite(targetId)
      else await removeFavorite(targetId)
    },
    onMutate: async ({ nftId: targetId, shouldFavorite }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<string[]>(queryKey)
      const current = previous ?? []
      const next = shouldFavorite
        ? current.includes(targetId)
          ? current
          : [...current, targetId]
        : current.filter((id) => id !== targetId)
      queryClient.setQueryData(queryKey, next)
      return { previous, queryKey }
    },
    onError: (_error, _variables, context) => {
      const rollbackKey = context?.queryKey ?? queryKey
      if (context?.previous === undefined) {
        queryClient.removeQueries({ queryKey: rollbackKey, exact: true })
        return
      }
      queryClient.setQueryData(rollbackKey, context.previous)
    },
    onSettled: (_data, _error, _variables, context) => {
      void queryClient.invalidateQueries({
        queryKey: context?.queryKey ?? queryKey,
      })
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
