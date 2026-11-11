import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addCartItem, getCart } from '@/api/endpoints'

export const cartQueryKey = ['cart'] as const

export function useCart() {
  return useQuery({
    queryKey: cartQueryKey,
    queryFn: getCart,
    retry: false,
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
