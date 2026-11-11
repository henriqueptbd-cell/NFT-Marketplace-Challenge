import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { collectorProfileSchema, sessionSchema, userSchema } from '@/api/types'
import {
  apiErrorResponse,
  createId,
  nowIso,
  readJsonBody,
  requireUser,
} from '@/mocks/handlers/common'
import { getMockState, updateMockState } from '@/mocks/store'

const loginSchema = z
  .object({ email: z.string().email(), password: z.string().min(1) })
  .strict()
const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(1),
  })
  .strict()

function authResponse(userId: string) {
  const state = getMockState()
  const storedUser = state.users.find((item) => item.id === userId)
  const profile = state.profiles.find((item) => item.userId === userId)
  if (!storedUser || !profile) return null
  const user = userSchema.parse({
    id: storedUser.id,
    email: storedUser.email,
    role: storedUser.role,
    displayName: storedUser.displayName,
    createdAt: storedUser.createdAt,
  })
  const now = new Date()
  const session = sessionSchema.parse({
    accessToken: crypto.randomUUID(),
    userId,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
  })
  updateMockState((draft) => {
    draft.sessions = [
      ...draft.sessions.filter((item) => item.userId !== userId),
      session,
    ]
  })
  return {
    session,
    user: userSchema.parse(user),
    profile: collectorProfileSchema.parse(profile),
  }
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const parsed = await readJsonBody(request, loginSchema)
    if (!parsed.ok) return parsed.response
    const email = parsed.data.email.trim().toLowerCase()
    const storedUser = getMockState().users.find(
      (item) =>
        item.email.toLowerCase() === email &&
        item.password === parsed.data.password,
    )
    if (!storedUser)
      return apiErrorResponse(
        401,
        'INVALID_CREDENTIALS',
        'Email or password is incorrect.',
      )
    const response = authResponse(storedUser.id)
    return response
      ? HttpResponse.json(response)
      : apiErrorResponse(500, 'INTERNAL_ERROR', 'Could not create a session.')
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const parsed = await readJsonBody(request, registerSchema)
    if (!parsed.ok) return parsed.response
    const email = parsed.data.email.trim().toLowerCase()
    const state = getMockState()
    if (state.users.some((item) => item.email.toLowerCase() === email)) {
      return apiErrorResponse(
        409,
        'EMAIL_ALREADY_REGISTERED',
        'An account already exists for this email.',
      )
    }

    const now = nowIso()
    const user = userSchema.parse({
      id: createId('user'),
      email,
      role: 'collector',
      displayName: parsed.data.displayName.trim(),
      createdAt: now,
    })
    const profile = collectorProfileSchema.parse({
      userId: user.id,
      displayName: user.displayName,
      email: user.email,
      ens: null,
      avatar: null,
      bio: '',
      updatedAt: now,
    })
    updateMockState((draft) => {
      draft.users.push({ ...user, password: parsed.data.password })
      draft.profiles.push(profile)
    })
    const response = authResponse(user.id)
    return response
      ? HttpResponse.json(response, { status: 201 })
      : apiErrorResponse(
          500,
          'INTERNAL_ERROR',
          'Could not create the account session.',
        )
  }),

  http.get('/api/auth/session', ({ request }) => {
    const authenticated = requireUser(request)
    if (authenticated instanceof Response) return authenticated
    const state = getMockState()
    const session = state.sessions.find(
      (item) => item.userId === authenticated.id,
    )
    const profile = state.profiles.find(
      (item) => item.userId === authenticated.id,
    )
    if (!session || !profile)
      return apiErrorResponse(
        401,
        'UNAUTHORIZED',
        'The session is no longer available.',
      )
    return HttpResponse.json({ session, user: authenticated, profile })
  }),

  http.post('/api/auth/logout', ({ request }) => {
    const authorization = request.headers.get('Authorization')
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : null
    if (accessToken) {
      updateMockState((draft) => {
        draft.sessions = draft.sessions.filter(
          (item) => item.accessToken !== accessToken,
        )
      })
    }
    return HttpResponse.json({ success: true })
  }),
]
