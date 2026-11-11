import { z } from 'zod'
import { decimalStringSchema, networkSchema } from '@/api/types/common'

export const quoteItemSchema = z
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

export const quoteSchema = z
  .object({
    id: z.string().min(1),
    userId: z.string().min(1),
    cartId: z.string().min(1),
    walletId: z.string().nullable(),
    items: z.array(quoteItemSchema),
    subtotalString: decimalStringSchema,
    discountString: decimalStringSchema,
    networkFeeString: decimalStringSchema,
    totalString: decimalStringSchema,
    couponCode: z.string().nullable(),
    expiresAt: z.string().datetime(),
    version: z.number().int().nonnegative(),
  })
  .strict()

export type QuoteItem = z.infer<typeof quoteItemSchema>
export type Quote = z.infer<typeof quoteSchema>
