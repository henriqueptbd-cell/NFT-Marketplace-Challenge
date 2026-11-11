import { z } from 'zod'
import { apiClient } from '@/api/client'
import { collectorProfileSchema, type CollectorProfile } from '@/api/types'

const profilePatchSchema = z
  .object({
    displayName: z.string().min(1).optional(),
    ens: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    bio: z.string().max(500).optional(),
  })
  .strict()

export async function getProfile(): Promise<CollectorProfile> {
  const { data } = await apiClient.get<unknown>('/profile')
  return collectorProfileSchema.parse(data)
}

export async function updateProfile(
  input: z.infer<typeof profilePatchSchema>,
): Promise<CollectorProfile> {
  const { data } = await apiClient.patch<unknown>(
    '/profile',
    profilePatchSchema.parse(input),
  )
  return collectorProfileSchema.parse(data)
}
