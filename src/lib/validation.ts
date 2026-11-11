import { z } from 'zod'
import { networkSchema, decimalStringSchema } from '@/api/types/common'
import { nftSortSchema } from '@/api/types/nft'
import { decimalToUnits } from '@/lib/decimal'

export const marketplaceSearchSchema = z
  .object({
    q: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined),
    collections: z.array(z.string().trim().min(1)).default([]),
    networks: z.array(networkSchema).default([]),
    priceMin: decimalStringSchema.optional(),
    priceMax: decimalStringSchema.optional(),
    sort: nftSortSchema.default('relevance'),
    page: z.coerce.number().int().positive().default(1),
  })
  .strict()
  .superRefine((search, context) => {
    if (
      search.priceMin !== undefined &&
      search.priceMax !== undefined &&
      decimalToUnits(search.priceMin) > decimalToUnits(search.priceMax)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Minimum price cannot exceed maximum price',
        path: ['priceMin'],
      })
    }
  })

export const loginFormSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  })
  .strict()

export const registerFormSchema = z
  .object({
    username: z.string().trim().min(2).max(32),
    email: z.string().trim().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .strict()
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export type MarketplaceSearch = z.infer<typeof marketplaceSearchSchema>
export type LoginFormValues = z.infer<typeof loginFormSchema>
export type RegisterFormValues = z.infer<typeof registerFormSchema>
