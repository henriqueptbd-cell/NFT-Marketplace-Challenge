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

export const nftSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    image: z.string(),
    priceString: decimalStringSchema,
    edition: nftEditionSchema,
    collection: z.string().min(1),
    network: networkSchema,
    attributes: z.array(nftAttributeSchema),
    isRare: z.boolean(),
    description: z.string(),
  })
  .strict()

export const nftListSchema = z.array(nftSchema)

export type NFTAttribute = z.infer<typeof nftAttributeSchema>
export type NFTEdition = z.infer<typeof nftEditionSchema>
export type NFT = z.infer<typeof nftSchema>
