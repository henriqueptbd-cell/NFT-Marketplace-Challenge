import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addCartItem, getCart } from '@/api/endpoints'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export const cartQueryKey = ['cart'] as const

export function useCart() {
  const user = useCurrentUser()
  return useQuery({
    queryKey: cartQueryKey,
    queryFn: getCart,
    retry: false,
    enabled: Boolean(user),
  })
}

export function useAddCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addCartItem,
    onSuccess: (cart) => {
      queryClient.setQueryData(cartQueryKey, cart)
    },
  })
}
