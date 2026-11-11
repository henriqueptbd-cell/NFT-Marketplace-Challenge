import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { collectorProfileSchema, sessionSchema, userSchema } from '@/api/types'
import {
  apiErrorResponse,
  createId,
  hashSessionCredential,
  nowIso,
  readJsonBody,
  readSessionCredential,
  requireUser,
  SESSION_COOKIE_NAME,
} from '@/mocks/handlers/common'
import { getMockState, updateMockState } from '@/mocks/store'

const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
    rememberMe: z.boolean().default(false),
  })
  .strict()
const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().trim().min(2).max(80),
  })
  .strict()
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  })
  .strict()

interface CreatedAuthResponse {
  payload: {
    session: z.infer<typeof sessionSchema>
    user: z.infer<typeof userSchema>
    profile: z.infer<typeof collectorProfileSchema>
    mockSessionToken: string
  }
  cookieToken: string
}

async function createAuthResponse(
  userId: string,
  rememberMe = false,
): Promise<CreatedAuthResponse | null> {
  const state = getMockState()
  const storedUser = state.users.find((item) => item.id === userId)
  const profile = state.profiles.find((item) => item.userId === userId)
  if (!storedUser || !profile) return null

  const user = userSchema.parse({
    id: storedUser.id,
    email: storedUser.email,
    role: storedUser.role,
    displayName: storedUser.displayName,
    username: storedUser.username,
    createdAt: storedUser.createdAt,
  })
  const now = new Date()
  const lifetime = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000
  const session = sessionSchema.parse({
    userId,
    issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + lifetime).toISOString(),
  })
  const cookieToken = crypto.randomUUID()
  const cookieHash = await hashSessionCredential(cookieToken)
  updateMockState((draft) => {
    draft.sessions = [
      ...draft.sessions.filter((item) => item.userId !== userId),
      { ...session, cookieHash },
    ]
  })
  return {
    payload: {
      session,
      user,
      profile: collectorProfileSchema.parse(profile),
      mockSessionToken: cookieToken,
    },
    cookieToken,
  }
}

function sessionCookie(token: string, rememberMe: boolean): string {
  const maxAge = rememberMe ? '; Max-Age=2592000' : ''
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${maxAge}`
}

function expiredSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

function usernameFromDisplayName(displayName: string): string {
  const normalized = displayName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
  return normalized.length >= 2
    ? normalized
    : `collector-${crypto.randomUUID().slice(0, 8)}`
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
    if (!storedUser) {
      return apiErrorResponse(
        401,
        'INVALID_CREDENTIALS',
        'E-mail ou senha incorretos.',
        { email: ['E-mail ou senha incorretos.'] },
      )
    }
    const response = await createAuthResponse(
      storedUser.id,
      parsed.data.rememberMe,
    )
    return response
      ? HttpResponse.json(response.payload, {
          headers: {
            'Set-Cookie': sessionCookie(
              response.cookieToken,
              parsed.data.rememberMe,
            ),
          },
        })
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
        'Este e-mail já está cadastrado.',
        { email: ['Este e-mail já está cadastrado.'] },
      )
    }

    const now = nowIso()
    const displayName = parsed.data.displayName.trim()
    const username = usernameFromDisplayName(displayName)
    const user = userSchema.parse({
      id: createId('user'),
      email,
      role: 'collector',
      displayName,
      username,
      createdAt: now,
    })
    const profile = collectorProfileSchema.parse({
      userId: user.id,
      displayName: user.displayName,
      username: user.username,
      email: user.email,
      ens: null,
      walletNickname: '',
      avatar: null,
      bio: '',
      updatedAt: now,
    })
    updateMockState((draft) => {
      draft.users.push({ ...user, password: parsed.data.password })
      draft.profiles.push(profile)
    })
    const response = await createAuthResponse(user.id)
    return response
      ? HttpResponse.json(response.payload, {
          status: 201,
          headers: { 'Set-Cookie': sessionCookie(response.cookieToken, false) },
        })
      : apiErrorResponse(
          500,
          'INTERNAL_ERROR',
          'Could not create the account session.',
        )
  }),

  http.get('/api/auth/session', async ({ request }) => {
    const authenticated = await requireUser(request)
    if (authenticated instanceof Response) return authenticated
    const state = getMockState()
    const storedSession = state.sessions.find(
      (item) => item.userId === authenticated.id,
    )
    const profile = state.profiles.find(
      (item) => item.userId === authenticated.id,
    )
    if (!storedSession || !profile)
      return apiErrorResponse(
        401,
        'UNAUTHORIZED',
        'The session is no longer available.',
      )
    const session = sessionSchema.parse({
      userId: storedSession.userId,
      issuedAt: storedSession.issuedAt,
      expiresAt: storedSession.expiresAt,
    })
    return HttpResponse.json({ session, user: authenticated, profile })
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    const credential = readSessionCredential(request)
    if (credential) {
      const cookieHash = await hashSessionCredential(credential)
      updateMockState((draft) => {
        draft.sessions = draft.sessions.filter(
          (item) => item.cookieHash !== cookieHash,
        )
      })
    }
    return HttpResponse.json(
      { success: true },
      { headers: { 'Set-Cookie': expiredSessionCookie() } },
    )
  }),

  http.patch('/api/auth/password', async ({ request }) => {
    const authenticated = await requireUser(request)
    if (authenticated instanceof Response) return authenticated
    const parsed = await readJsonBody(request, changePasswordSchema)
    if (!parsed.ok) return parsed.response
    const state = getMockState()
    const currentUser = state.users.find((item) => item.id === authenticated.id)
    if (!currentUser)
      return apiErrorResponse(404, 'NOT_FOUND', 'The account was not found.')
    if (currentUser.password !== parsed.data.currentPassword) {
      return apiErrorResponse(
        422,
        'CURRENT_PASSWORD_INVALID',
        'A senha atual está incorreta.',
        { currentPassword: ['A senha atual está incorreta.'] },
      )
    }
    updateMockState((draft) => {
      const user = draft.users.find((item) => item.id === authenticated.id)
      if (user) user.password = parsed.data.newPassword
    })
    return HttpResponse.json({ success: true })
  }),
]
