import { z } from 'zod'

export const userRoleSchema = z.enum(['user', 'collector'])

export const userSchema = z
  .object({
    id: z.string().min(1),
    email: z.string().email(),
    role: userRoleSchema,
    displayName: z.string().min(1),
    username: z.string().min(2).max(32),
    createdAt: z.string().datetime(),
  })
  .strict()

export const collectorProfileSchema = z
  .object({
    userId: z.string().min(1),
    displayName: z.string().min(1),
    username: z.string().min(2).max(32),
    email: z.string().email(),
    ens: z.string().nullable(),
    walletNickname: z.string().max(48),
    avatar: z.string().nullable(),
    bio: z.string(),
    updatedAt: z.string().datetime(),
  })
  .strict()

export type UserRole = z.infer<typeof userRoleSchema>
export type User = z.infer<typeof userSchema>
export type CollectorProfile = z.infer<typeof collectorProfileSchema>
