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
    displayName: z.string().trim().min(1).max(80).optional(),
    username: z.string().trim().min(2).max(32).optional(),
    email: z.string().trim().email().optional(),
    ens: z.string().nullable().optional(),
    walletNickname: z.string().max(48).optional(),
    avatar: z.string().max(2_000_000).nullable().optional(),
    bio: z.string().max(500).optional(),
  })
  .strict()

export const profileHandlers = [
  http.get('/api/profile', async ({ request }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const profile = getMockState().profiles.find(
      (item) => item.userId === user.id,
    )
    return profile
      ? HttpResponse.json(profile)
      : apiErrorResponse(404, 'NOT_FOUND', 'Collector profile was not found.')
  }),

  http.patch('/api/profile', async ({ request }) => {
    const user = await requireUser(request)
    if (user instanceof Response) return user
    const parsed = await readJsonBody(request, profilePatchSchema)
    if (!parsed.ok) return parsed.response
    const state = getMockState()
    const current = state.profiles.find((item) => item.userId === user.id)
    if (!current)
      return apiErrorResponse(
        404,
        'NOT_FOUND',
        'Collector profile was not found.',
      )
    const email = parsed.data.email?.toLowerCase()
    if (
      email &&
      state.users.some(
        (item) => item.id !== user.id && item.email.toLowerCase() === email,
      )
    ) {
      return apiErrorResponse(
        409,
        'EMAIL_ALREADY_REGISTERED',
        'Este e-mail já está cadastrado.',
        { email: ['Este e-mail já está cadastrado.'] },
      )
    }
    const updated = collectorProfileSchema.parse({
      ...current,
      ...parsed.data,
      ...(email ? { email } : {}),
      updatedAt: nowIso(),
    })
    updateMockState((draft) => {
      const index = draft.profiles.findIndex((item) => item.userId === user.id)
      if (index >= 0) draft.profiles[index] = updated
      const storedUser = draft.users.find((item) => item.id === user.id)
      if (storedUser) {
        if (parsed.data.displayName)
          storedUser.displayName = parsed.data.displayName
        if (parsed.data.username) storedUser.username = parsed.data.username
        if (email) storedUser.email = email
      }
    })
    return HttpResponse.json(updated)
  }),
]
