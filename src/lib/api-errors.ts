import axios from 'axios'
import type { ZodError } from 'zod'
import { apiErrorSchema } from '@/api/types/api-error'

export function apiFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<unknown>(error)) return {}
  const parsed = apiErrorSchema.safeParse(error.response?.data)
  if (!parsed.success || !parsed.data.fieldErrors) return {}
  return Object.fromEntries(
    Object.entries(parsed.data.fieldErrors).map(([field, messages]) => [
      field,
      messages[0] ?? parsed.data.message,
    ]),
  )
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<unknown>(error)) {
    const parsed = apiErrorSchema.safeParse(error.response?.data)
    if (parsed.success) return parsed.data.message
  }
  return fallback
}

export function apiErrorCode(error: unknown): string | null {
  if (!axios.isAxiosError<unknown>(error)) return null
  const parsed = apiErrorSchema.safeParse(error.response?.data)
  return parsed.success ? parsed.data.code : null
}

export function zodFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path.map(String).join('.') || 'form'
    fieldErrors[field] ??= issue.message
  }
  return fieldErrors
}
