import { z } from 'zod'

const CHECKOUT_ATTEMPT_KEY = 'kurio:checkout-attempt:v1'

const checkoutAttemptSchema = z
  .object({
    userId: z.string().min(1),
    quoteId: z.string().min(1),
    walletId: z.string().min(1),
    idempotencyKey: z.string().uuid(),
  })
  .strict()

export type CheckoutAttempt = z.infer<typeof checkoutAttemptSchema>

export function readCheckoutAttempt(): CheckoutAttempt | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY)
    if (!stored) return null
    const parsed: unknown = JSON.parse(stored)
    const attempt = checkoutAttemptSchema.safeParse(parsed)
    return attempt.success ? attempt.data : null
  } catch {
    return null
  }
}

export function saveCheckoutAttempt(attempt: CheckoutAttempt): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(
      CHECKOUT_ATTEMPT_KEY,
      JSON.stringify(checkoutAttemptSchema.parse(attempt)),
    )
  } catch {
    // The in-memory attempt remains available while this page is open.
  }
}

export function clearCheckoutAttempt(): void {
  if (typeof window === 'undefined') return
  window.sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY)
}
