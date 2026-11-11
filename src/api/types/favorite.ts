import { z } from 'zod'

export const favoriteSchema = z
  .object({
    id: z.string().min(1),
    userId: z.string().min(1),
    nftId: z.string().min(1),
    createdAt: z.string().datetime(),
  })
  .strict()

export type Favorite = z.infer<typeof favoriteSchema>
