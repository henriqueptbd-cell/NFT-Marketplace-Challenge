import { z } from 'zod'

export const nftAttributeSchema = z
  .object({
    traitType: z.string().min(1),
    value: z.string().min(1),
  })
  .strict()

export const nftRatingSchema = z
  .object({
    value: z.number().min(0).max(5),
    count: z.number().int().nonnegative(),
  })
  .strict()

export const nftSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    image: z.string(),
    priceEth: z.string().regex(/^\d+(?:\.\d+)?$/, 'Invalid decimal price'),
    collection: z.string().min(1),
    edition: z.string().min(1),
    rarity: z.string().optional(),
    description: z.string().optional(),
    attributes: z.array(nftAttributeSchema),
    rating: nftRatingSchema.optional(),
  })
  .strict()

export const nftListSchema = z.array(nftSchema)

export type NFTAttribute = z.infer<typeof nftAttributeSchema>
export type NFTRating = z.infer<typeof nftRatingSchema>
export type NFT = z.infer<typeof nftSchema>
