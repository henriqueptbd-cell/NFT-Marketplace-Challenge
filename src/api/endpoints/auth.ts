import { z } from 'zod'
import {
  apiClient,
  clearPersistedUser,
  persistMockSessionCookie,
  persistUser,
} from '@/api/client'
import {
  collectorProfileSchema,
  sessionSchema,
  userSchema,
  type CollectorProfile,
  type Session,
  type User,
} from '@/api/types'

const loginRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
    rememberMe: z.boolean().default(false),
  })
  .strict()
const registerRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(2).max(80),
  })
  .strict()
const passwordChangeRequestSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  })
  .strict()

export interface AuthResponse {
  session: Session
  user: User
  profile: CollectorProfile
}

const authResponseTransportSchema = z
  .object({
    session: sessionSchema,
    user: userSchema,
    profile: collectorProfileSchema,
    mockSessionToken: z.string().optional(),
  })
  .strict()

function parseAuthResponse(data: unknown, rememberMe = false): AuthResponse {
  const parsed = authResponseTransportSchema.parse(data)
  if (parsed.mockSessionToken) {
    persistMockSessionCookie(parsed.mockSessionToken, rememberMe)
  }
  return {
    session: parsed.session,
    user: parsed.user,
    profile: parsed.profile,
  }
}

export async function login(
  input: z.input<typeof loginRequestSchema>,
): Promise<AuthResponse> {
  const payload = loginRequestSchema.parse(input)
  const { data } = await apiClient.post<unknown>('/auth/login', payload)
  const response = parseAuthResponse(data, payload.rememberMe)
  persistUser(response.user)
  return response
}

export async function register(
  input: z.infer<typeof registerRequestSchema>,
): Promise<AuthResponse> {
  const payload = registerRequestSchema.parse(input)
  const { data } = await apiClient.post<unknown>('/auth/register', payload)
  const response = parseAuthResponse(data)
  persistUser(response.user)
  return response
}

export async function getSession(): Promise<AuthResponse> {
  const { data } = await apiClient.get<unknown>('/auth/session')
  const response = parseAuthResponse(data)
  persistUser(response.user)
  return response
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout')
  } finally {
    clearPersistedUser()
  }
}

export async function changePassword(
  input: z.infer<typeof passwordChangeRequestSchema>,
): Promise<void> {
  const payload = passwordChangeRequestSchema.parse(input)
  await apiClient.patch('/auth/password', payload)
}
