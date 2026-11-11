import { z } from 'zod'

export const sessionSchema = z
  .object({
    userId: z.string().min(1),
    issuedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
  })
  .strict()

export type Session = z.infer<typeof sessionSchema>
