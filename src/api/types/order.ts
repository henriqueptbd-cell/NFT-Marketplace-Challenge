import { z } from 'zod'
import { decimalStringSchema, networkSchema } from '@/api/types/common'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'declined'])

export const orderSnapshotItemSchema = z
  .object({
    nftId: z.string().min(1),
    name: z.string().min(1),
    image: z.string(),
    quantity: z.number().int().positive(),
    priceString: decimalStringSchema,
    edition: z.string().min(1),
    network: networkSchema,
  })
  .strict()

export const orderSnapshotSchema = z
  .object({
    items: z.array(orderSnapshotItemSchema),
    subtotalString: decimalStringSchema,
    discountString: decimalStringSchema,
    networkFeeString: decimalStringSchema,
    totalString: decimalStringSchema,
    couponCode: z.string().nullable(),
    walletAddress: z.string(),
  })
  .strict()

export const orderSchema = z
  .object({
    id: z.string().min(1),
    userId: z.string().min(1),
    quoteId: z.string().min(1),
    status: orderStatusSchema,
    snapshot: orderSnapshotSchema,
    transactionId: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    version: z.number().int().nonnegative(),
  })
  .strict()

export type OrderStatus = z.infer<typeof orderStatusSchema>
export type OrderSnapshotItem = z.infer<typeof orderSnapshotItemSchema>
export type OrderSnapshot = z.infer<typeof orderSnapshotSchema>
export type Order = z.infer<typeof orderSchema>
