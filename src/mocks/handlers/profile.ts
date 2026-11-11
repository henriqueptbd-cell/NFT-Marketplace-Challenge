import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { collectorProfileSchema } from '@/api/types'
import {
  apiErrorResponse,
  nowIso,
  readJsonBody,
  requireUser,
} from '@/mocks/handlers/common'
import { getMockState, updateMockState } from '@/mocks/store'

const profilePatchSchema = z
  .object({
    displayName: z.string().trim().min(1).optional(),
    ens: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    bio: z.string().max(500).optional(),
  })
  .strict()

export const profileHandlers = [
  http.get('/api/profile', ({ request }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const profile = getMockState().profiles.find(
      (item) => item.userId === user.id,
    )
    return profile
      ? HttpResponse.json(profile)
      : apiErrorResponse(404, 'NOT_FOUND', 'Collector profile was not found.')
  }),

  http.patch('/api/profile', async ({ request }) => {
    const user = requireUser(request)
    if (user instanceof Response) return user
    const parsed = await readJsonBody(request, profilePatchSchema)
    if (!parsed.ok) return parsed.response
    const current = getMockState().profiles.find(
      (item) => item.userId === user.id,
    )
    if (!current)
      return apiErrorResponse(
        404,
        'NOT_FOUND',
        'Collector profile was not found.',
      )
    const updated = collectorProfileSchema.parse({
      ...current,
      ...parsed.data,
      updatedAt: nowIso(),
    })
    updateMockState((draft) => {
      const index = draft.profiles.findIndex((item) => item.userId === user.id)
      if (index >= 0) draft.profiles[index] = updated
      const storedUser = draft.users.find((item) => item.id === user.id)
      if (storedUser && parsed.data.displayName)
        storedUser.displayName = parsed.data.displayName
    })
    return HttpResponse.json(updated)
  }),
]
