import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addCartItem,
  applyCoupon,
  clearCart,
  getCart,
  removeCartItem,
  removeCoupon,
  setCartItemQuantity,
} from '@/api/endpoints'
import type { Cart } from '@/api/types'

export const cartQueryKey = ['cart'] as const
export const cartQuoteQueryKey = ['cart', 'quote'] as const

function updateCartCache(
  queryClient: ReturnType<typeof useQueryClient>,
  cart: Cart,
) {
  queryClient.setQueryData(cartQueryKey, cart)
  void queryClient.invalidateQueries({ queryKey: cartQuoteQueryKey })
}

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
    onSuccess: (cart) => updateCartCache(queryClient, cart),
  })
}

export function useSetCartItemQuantity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ nftId, quantity }: { nftId: string; quantity: number }) =>
      setCartItemQuantity(nftId, { quantity }),
    onSuccess: (cart) => updateCartCache(queryClient, cart),
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeCartItem,
    onSuccess: (cart) => updateCartCache(queryClient, cart),
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: clearCart,
    onSuccess: (cart) => updateCartCache(queryClient, cart),
  })
}

export function useApplyCartCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: applyCoupon,
    onSuccess: (cart) => updateCartCache(queryClient, cart),
  })
}

export function useRemoveCartCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeCoupon,
    onSuccess: (cart) => updateCartCache(queryClient, cart),
  })
}
