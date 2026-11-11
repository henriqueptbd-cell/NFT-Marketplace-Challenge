import axios, { type AxiosError } from 'axios'
import { userSchema, type User } from '@/api/types/user'

export const CURRENT_USER_STORAGE_KEY = 'kurio:user:v1'
export const LEGACY_SESSION_STORAGE_KEY = 'kurio:session:v1'
export const MOCK_SESSION_COOKIE_NAME = 'kurio_session'
export const USER_STORAGE_EVENT = 'kurio:user-changed'
export const API_UNAUTHORIZED_EVENT = 'kurio:api-unauthorized'

export function readPersistedUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY)
    if (!stored) return null
    const parsed: unknown = JSON.parse(stored)
    const user = userSchema.safeParse(parsed)
    return user.success ? user.data : null
  } catch {
    return null
  }
}

export function persistUser(user: User): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      CURRENT_USER_STORAGE_KEY,
      JSON.stringify(userSchema.parse(user)),
    )
    window.dispatchEvent(new CustomEvent(USER_STORAGE_EVENT))
  } catch {
    // The in-memory authenticated UI remains usable if storage is unavailable.
  }
}

export function persistMockSessionCookie(
  token: string,
  rememberMe = false,
): void {
  if (
    typeof document === 'undefined' ||
    import.meta.env.VITE_ENABLE_MOCKS !== 'true'
  ) {
    return
  }
  const maxAge = rememberMe ? '; Max-Age=2592000' : ''
  document.cookie = `${MOCK_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; SameSite=Lax${maxAge}`
}

export function clearMockSessionCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${MOCK_SESSION_COOKIE_NAME}=; Path=/; SameSite=Lax; Max-Age=0`
}

export function clearPersistedUser(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY)
  window.localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY)
  clearMockSessionCookie()
  window.dispatchEvent(new CustomEvent(USER_STORAGE_EVENT))
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

function isPublicAuthRequest(url: string | undefined): boolean {
  if (!url) return false
  return ['/auth/login', '/auth/register', '/auth/logout'].some((path) =>
    url.endsWith(path),
  )
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !isPublicAuthRequest(error.config?.url)
    ) {
      window.dispatchEvent(
        new CustomEvent(API_UNAUTHORIZED_EVENT, {
          detail: { url: error.config?.url ?? null },
        }),
      )
    }
    return Promise.reject(error)
  },
)
