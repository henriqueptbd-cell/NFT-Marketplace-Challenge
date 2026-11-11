import axios, { type AxiosError } from 'axios'
import { sessionSchema, type Session } from '@/api/types/session'

export const SESSION_STORAGE_KEY = 'kurio:session:v1'
export const API_UNAUTHORIZED_EVENT = 'kurio:api-unauthorized'

function readAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return null
    const parsed: unknown = JSON.parse(stored)
    const session = sessionSchema.safeParse(parsed)
    return session.success ? session.data.accessToken : null
  } catch {
    return null
  }
}

export function persistSession(session: Session): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(sessionSchema.parse(session)),
  )
}

export function clearPersistedSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_STORAGE_KEY)
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const accessToken = readAccessToken()
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`)
  else config.headers.delete('Authorization')
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(API_UNAUTHORIZED_EVENT, {
          detail: { url: error.config?.url ?? null },
        }),
      )
    }
    return Promise.reject(error)
  },
)
