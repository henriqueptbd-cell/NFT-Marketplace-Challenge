import { z } from 'zod'
import { apiClient } from '@/api/client'
import { cartSchema, type Cart } from '@/api/types'

const addCartItemSchema = z
  .object({ nftId: z.string().min(1), quantity: z.number().int().positive() })
  .strict()
const setCartItemQuantitySchema = z
  .object({ quantity: z.number().int().positive() })
  .strict()
const couponRequestSchema = z.object({ code: z.string().min(1) }).strict()

export async function getCart(): Promise<Cart> {
  const { data } = await apiClient.get<unknown>('/cart')
  return cartSchema.parse(data)
}

export async function mergeGuestCart(): Promise<Cart> {
  const { data } = await apiClient.post<unknown>('/cart/merge', {})
  return cartSchema.parse(data)
}

export async function addCartItem(
  input: z.infer<typeof addCartItemSchema>,
): Promise<Cart> {
  const { data } = await apiClient.post<unknown>(
    '/cart/items',
    addCartItemSchema.parse(input),
  )
  return cartSchema.parse(data)
}

export async function setCartItemQuantity(
  nftId: string,
  input: z.infer<typeof setCartItemQuantitySchema>,
): Promise<Cart> {
  const payload = setCartItemQuantitySchema.parse(input)
  const { data } = await apiClient.patch<unknown>(
    `/cart/items/${encodeURIComponent(nftId)}`,
    payload,
  )
  return cartSchema.parse(data)
}

export async function removeCartItem(nftId: string): Promise<Cart> {
  const { data } = await apiClient.delete<unknown>(
    `/cart/items/${encodeURIComponent(nftId)}`,
  )
  return cartSchema.parse(data)
}

export async function clearCart(): Promise<Cart> {
  const { data } = await apiClient.delete<unknown>('/cart')
  return cartSchema.parse(data)
}

export async function applyCoupon(code: string): Promise<Cart> {
  const payload = couponRequestSchema.parse({ code })
  const { data } = await apiClient.post<unknown>('/cart/coupon', payload)
  return cartSchema.parse(data)
}

export async function removeCoupon(): Promise<Cart> {
  const { data } = await apiClient.delete<unknown>('/cart/coupon')
  return cartSchema.parse(data)
}
