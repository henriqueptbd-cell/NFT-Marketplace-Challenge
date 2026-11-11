import { z } from 'zod'
import { decimalStringSchema, networkSchema } from '@/api/types/common'

export const nftAttributeSchema = z
  .object({
    traitType: z.string().min(1),
    value: z.string().min(1),
  })
  .strict()

export const nftEditionSchema = z
  .object({
    total: z.number().int().positive(),
    available: z.number().int().nonnegative(),
    isOpen: z.boolean(),
  })
  .strict()
  .refine((edition) => edition.isOpen || edition.available <= edition.total, {
    message: 'Available editions cannot exceed the total edition size',
    path: ['available'],
  })

export const nftSortSchema = z.enum([
  'relevance',
  'newest',
  'trending',
  'price-asc',
  'price-desc',
])

export const nftSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    image: z.string(),
    images: z.array(z.string().min(1)).min(1),
    priceString: decimalStringSchema,
    edition: nftEditionSchema,
    collection: z.string().min(1),
    network: networkSchema,
    attributes: z.array(nftAttributeSchema),
    isRare: z.boolean(),
    description: z.string(),
    rating: z.number().min(0).max(5),
    reviewCount: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
    trendingScore: z.number().int().nonnegative(),
  })
  .strict()

export const nftListSchema = z.array(nftSchema)

export type NFTAttribute = z.infer<typeof nftAttributeSchema>
export type NFTEdition = z.infer<typeof nftEditionSchema>
export type NFT = z.infer<typeof nftSchema>
export type NFTSort = z.infer<typeof nftSortSchema>
