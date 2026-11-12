import { z } from 'zod'
import { getMockState, setMockScenario } from '@/mocks/store'

export const mockScenarioSchema = z.enum([
  'default',
  'empty',
  'slow-3s',
  'flaky-500',
  'cart-merge-fails',
  'session-expired',
  'coupon-expired',
  'price-changed-mid-checkout',
  'edition-sold-out',
  'payment-declined',
  'timeout-after-order-create',
  'out-of-order',
])

export type MockScenario = z.infer<typeof mockScenarioSchema>

export function activateMockScenario(name: MockScenario): void {
  setMockScenario(name)
}

export function getActiveMockScenario(): MockScenario {
  return getMockState().scenario
}

export function isMockScenario(name: MockScenario): boolean {
  return getActiveMockScenario() === name
}

export function consumeMockScenario(name: MockScenario): boolean {
  if (!isMockScenario(name)) return false
  setMockScenario('default')
  return true
}

if (typeof window !== 'undefined') {
  const configuredScenario = mockScenarioSchema.safeParse(
    import.meta.env.VITE_MOCK_SCENARIO,
  )
  if (configuredScenario.success && configuredScenario.data !== 'default') {
    setMockScenario(configuredScenario.data)
  }
  window.__mswScenario = activateMockScenario
}
