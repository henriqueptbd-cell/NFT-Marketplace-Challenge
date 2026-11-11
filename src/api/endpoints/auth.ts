import { z } from 'zod'
import { apiClient, clearPersistedSession, persistSession } from '@/api/client'
import {
  collectorProfileSchema,
  sessionSchema,
  userSchema,
  type CollectorProfile,
  type Session,
  type User,
} from '@/api/types'

const loginRequestSchema = z
  .object({ email: z.string().email(), password: z.string().min(1) })
  .strict()
const registerRequestSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    displayName: z.string().min(1),
  })
  .strict()

export interface AuthResponse {
  session: Session
  user: User
  profile: CollectorProfile
}

const authResponseSchema = z
  .object({
    session: sessionSchema,
    user: userSchema,
    profile: collectorProfileSchema,
  })
  .strict()

export async function login(
  input: z.infer<typeof loginRequestSchema>,
): Promise<AuthResponse> {
  const payload = loginRequestSchema.parse(input)
  const { data } = await apiClient.post<unknown>('/auth/login', payload)
  const response = authResponseSchema.parse(data)
  persistSession(response.session)
  return response
}

export async function register(
  input: z.infer<typeof registerRequestSchema>,
): Promise<AuthResponse> {
  const payload = registerRequestSchema.parse(input)
  const { data } = await apiClient.post<unknown>('/auth/register', payload)
  const response = authResponseSchema.parse(data)
  persistSession(response.session)
  return response
}

export async function getSession(): Promise<AuthResponse> {
  const { data } = await apiClient.get<unknown>('/auth/session')
  const response = authResponseSchema.parse(data)
  persistSession(response.session)
  return response
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout')
  } finally {
    clearPersistedSession()
  }
}
