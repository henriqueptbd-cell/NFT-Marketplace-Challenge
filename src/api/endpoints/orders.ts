import { z } from 'zod'
import { apiClient } from '@/api/client'
import { orderSchema, type Order } from '@/api/types'

const orderListSchema = z.array(orderSchema)
const createOrderRequestSchema = z
  .object({ quoteId: z.string().min(1), walletId: z.string().min(1) })
  .strict()

export async function createOrder(
  input: z.infer<typeof createOrderRequestSchema>,
  idempotencyKey: string,
): Promise<Order> {
  if (!idempotencyKey.trim()) throw new TypeError('Idempotency-Key is required')
  const { data } = await apiClient.post<unknown>(
    '/orders',
    createOrderRequestSchema.parse(input),
    {
      headers: { 'Idempotency-Key': idempotencyKey },
    },
  )
  return orderSchema.parse(data)
}

export async function getOrders(): Promise<Order[]> {
  const { data } = await apiClient.get<unknown>('/orders')
  return orderListSchema.parse(data)
}

export async function getOrder(orderId: string): Promise<Order> {
  const { data } = await apiClient.get<unknown>(
    `/orders/${encodeURIComponent(orderId)}`,
  )
  return orderSchema.parse(data)
}

export async function confirmOrder(orderId: string): Promise<Order> {
  const { data } = await apiClient.post<unknown>(
    `/orders/${encodeURIComponent(orderId)}/confirm`,
  )
  return orderSchema.parse(data)
}
