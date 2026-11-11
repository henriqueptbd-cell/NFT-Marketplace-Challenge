import { HttpResponse } from 'msw'
import type { ZodType } from 'zod'
import type { ApiError, User } from '@/api/types'
import { getMockState, incrementMockRequestCount } from '@/mocks/store'
import { getActiveMockScenario } from '@/mocks/scenarios'

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

export function readAuthenticatedUser(request: Request): User | null {
  if (getActiveMockScenario() === 'session-expired') return null
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return null

  const accessToken = authorization.slice('Bearer '.length)
  const state = getMockState()
  const session = state.sessions.find(
    (item) =>
      item.accessToken === accessToken &&
      item.expiresAt > new Date().toISOString(),
  )
  if (!session) return null
  const user = state.users.find((item) => item.id === session.userId)
  if (!user) return null

  const publicUser: User = {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    createdAt: user.createdAt,
  }
  return publicUser
}

export function requireUser(request: Request): User | Response {
  return (
    readAuthenticatedUser(request) ??
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
