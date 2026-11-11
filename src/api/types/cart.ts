import { z } from 'zod'
import { decimalStringSchema } from '@/api/types/common'

export const cartItemSchema = z
  .object({
    nftId: z.string().min(1),
    quantity: z.number().int().positive(),
    priceString: decimalStringSchema,
  })
  .strict()

export const cartSchema = z
  .object({
    id: z.string().min(1),
    userId: z.string().min(1),
    items: z.array(cartItemSchema),
    couponCode: z.string().nullable(),
    updatedAt: z.string().datetime(),
    version: z.number().int().nonnegative(),
  })
  .strict()

export type CartItem = z.infer<typeof cartItemSchema>
export type Cart = z.infer<typeof cartSchema>
