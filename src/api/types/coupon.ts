import { z } from 'zod'
import { decimalStringSchema } from '@/api/types/common'

export const couponDiscountTypeSchema = z.enum(['percentage', 'fixed'])

export const couponSchema = z
  .object({
    code: z.string().min(1),
    discountType: couponDiscountTypeSchema,
    discountValue: decimalStringSchema,
    startsAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    active: z.boolean(),
  })
  .strict()

export type Coupon = z.infer<typeof couponSchema>
