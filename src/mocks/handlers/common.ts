import { HttpResponse } from 'msw'
import type { ZodType } from 'zod'
import type { ApiError, User } from '@/api/types'
import { getMockState, incrementMockRequestCount } from '@/mocks/store'
import { getActiveMockScenario } from '@/mocks/scenarios'

export const SESSION_COOKIE_NAME = 'kurio_session'

export function apiErrorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>,
) {
  const body: ApiError = fieldErrors
    ? { code, message, fieldErrors }
    : { code, message }
  return HttpResponse.json(body, { status })
}

export function readSessionCredential(request: Request): string | null {
  const interceptedCookie = request.headers.get('cookie')
  const browserCookie = typeof document === 'undefined' ? '' : document.cookie
  const cookieHeader = interceptedCookie ?? browserCookie
  for (const part of cookieHeader.split(';')) {
    const [name, ...valueParts] = part.trim().split('=')
    if (name !== SESSION_COOKIE_NAME || valueParts.length === 0) continue
    try {
      return decodeURIComponent(valueParts.join('='))
    } catch {
      return valueParts.join('=')
    }
  }

  return null
}

export async function hashSessionCredential(
  credential: string,
): Promise<string> {
  const bytes = new TextEncoder().encode(credential)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export async function readAuthenticatedUser(
  request: Request,
): Promise<User | null> {
  if (getActiveMockScenario() === 'session-expired') return null
  const credential = readSessionCredential(request)
  if (!credential) return null
  const credentialHash = await hashSessionCredential(credential)
  const state = getMockState()
  const session = state.sessions.find(
    (item) =>
      item.cookieHash === credentialHash &&
      item.expiresAt > new Date().toISOString(),
  )
  if (!session) return null
  const user = state.users.find((item) => item.id === session.userId)
  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    username: user.username,
    createdAt: user.createdAt,
  }
}

export async function requireUser(request: Request): Promise<User | Response> {
  return (
    (await readAuthenticatedUser(request)) ??
    apiErrorResponse(401, 'UNAUTHORIZED', 'A valid session is required.')
  )
}

export async function readJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {
      ok: false,
      response: apiErrorResponse(
        400,
        'BAD_REQUEST',
        'Request body must be valid JSON.',
      ),
    }
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path.map(String).join('.') || 'body'
      fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.message]
    }
    return {
      ok: false,
      response: apiErrorResponse(
        422,
        'VALIDATION_ERROR',
        'Request validation failed.',
        fieldErrors,
      ),
    }
  }
  return { ok: true, data: parsed.data }
}

export async function applyGlobalScenario(): Promise<Response | undefined> {
  const scenario = getActiveMockScenario()
  if (scenario === 'slow-3s') {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 3_000))
  }
  if (scenario === 'flaky-500' && incrementMockRequestCount() % 2 === 0) {
    return apiErrorResponse(
      500,
      'INTERNAL_ERROR',
      'A simulated intermittent server error occurred.',
    )
  }
  return undefined
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`
}

export function nowIso(): string {
  return new Date().toISOString()
}
