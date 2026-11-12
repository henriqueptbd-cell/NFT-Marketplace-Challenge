import { z } from 'zod'

export const nftReviewSchema = z
  .object({
    id: z.string().min(1),
    author: z.string().min(1),
    rating: z.number().min(1).max(5),
    comment: z.string().min(1),
    createdAt: z.string().datetime(),
  })
  .strict()

export const nftReviewListSchema = z.array(nftReviewSchema)

export type NftReview = z.infer<typeof nftReviewSchema>
