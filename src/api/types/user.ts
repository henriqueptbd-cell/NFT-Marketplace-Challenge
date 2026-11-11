import { z } from 'zod'

export const userRoleSchema = z.enum(['user', 'collector'])

export const userSchema = z
  .object({
    id: z.string().min(1),
    email: z.string().email(),
    role: userRoleSchema,
    displayName: z.string().min(1),
    createdAt: z.string().datetime(),
  })
  .strict()

export const collectorProfileSchema = z
  .object({
    userId: z.string().min(1),
    displayName: z.string().min(1),
    email: z.string().email(),
    ens: z.string().nullable(),
    avatar: z.string().nullable(),
    bio: z.string(),
    updatedAt: z.string().datetime(),
  })
  .strict()

export type UserRole = z.infer<typeof userRoleSchema>
export type User = z.infer<typeof userSchema>
export type CollectorProfile = z.infer<typeof collectorProfileSchema>
