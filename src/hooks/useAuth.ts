import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getSession, logout } from '@/api/endpoints'
import { disconnectRealtimeClient } from '@/api/realtime'

export const authSessionQueryKey = ['auth', 'session'] as const

export function useAuthSession() {
  return useQuery({
    queryKey: authSessionQueryKey,
    queryFn: getSession,
    retry: false,
    staleTime: 15_000,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear()
      disconnectRealtimeClient()
      void navigate({
        to: '/',
        search: {
          q: undefined,
          collections: [],
          networks: [],
          sort: 'relevance',
          page: 1,
        },
      })
    },
  })
}
