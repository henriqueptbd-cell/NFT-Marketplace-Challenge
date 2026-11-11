import { z } from 'zod'
import { clearPersistedUser } from '@/api/client'
import {
  cartSchema,
  couponSchema,
  favoriteSchema,
  nftListSchema,
  orderSchema,
  quoteSchema,
  sessionSchema,
  walletSchema,
  type CollectorProfile,
  type User,
} from '@/api/types'
import type { MockScenario } from '@/mocks/scenarios'
import { collectorProfileSchema, userSchema } from '@/api/types/user'
import { couponFixtures } from '@/mocks/fixtures/coupons'
import { nftFixtures } from '@/mocks/fixtures/nfts'
import { userFixtures } from '@/mocks/fixtures/users'
import { walletFixtures } from '@/mocks/fixtures/wallets'

export const MOCK_STATE_KEY = 'msw:state:v1'

const userCredentialSchema = z
  .object({
    ...userSchema.shape,
    password: z.string(),
  })
  .strict()

const mockSessionSchema = z
  .object({
    ...sessionSchema.shape,
    cookieHash: z.string().min(1),
  })
  .strict()

const idempotencyRecordSchema = z
  .object({
    key: z.string().min(1),
    userId: z.string().min(1),
    bodyFingerprint: z.string(),
    orderId: z.string().min(1),
  })
  .strict()

const mockStateSchema = z
  .object({
    users: z.array(userCredentialSchema),
    sessions: z.array(mockSessionSchema),
    profiles: z.array(collectorProfileSchema),
    nfts: nftListSchema,
    favorites: z.array(favoriteSchema),
    carts: z.array(cartSchema),
    coupons: z.array(couponSchema),
    quotes: z.array(quoteSchema),
    orders: z.array(orderSchema),
    wallets: z.array(walletSchema),
    idempotencyRecords: z.array(idempotencyRecordSchema),
    scenario: z.enum([
      'default',
      'empty',
      'slow-3s',
      'flaky-500',
      'session-expired',
      'coupon-expired',
      'price-changed-mid-checkout',
      'edition-sold-out',
      'payment-declined',
      'timeout-after-order-create',
      'out-of-order',
    ]),
    version: z.number().int().nonnegative(),
    requestCount: z.number().int().nonnegative(),
  })
  .strict()

export type MockUser = User & { password: string }
export type MockSession = z.infer<typeof mockSessionSchema>
export type IdempotencyRecord = z.infer<typeof idempotencyRecordSchema>
export interface MockState {
  users: MockUser[]
  sessions: MockSession[]
  profiles: CollectorProfile[]
  nfts: z.infer<typeof nftListSchema>
  favorites: z.infer<typeof favoriteSchema>[]
  carts: z.infer<typeof cartSchema>[]
  coupons: z.infer<typeof couponSchema>[]
  quotes: z.infer<typeof quoteSchema>[]
  orders: z.infer<typeof orderSchema>[]
  wallets: z.infer<typeof walletSchema>[]
  idempotencyRecords: IdempotencyRecord[]
  scenario: MockScenario
  version: number
  requestCount: number
}

function createInitialState(): MockState {
  return {
    users: userFixtures.map(({ user, password }) => ({ ...user, password })),
    sessions: [],
    profiles: userFixtures.map(({ profile }) => profile),
    nfts: structuredClone(nftFixtures),
    favorites: [],
    carts: [],
    coupons: structuredClone(couponFixtures),
    quotes: [],
    orders: [],
    wallets: structuredClone(walletFixtures),
    idempotencyRecords: [],
    scenario: 'default',
    version: 0,
    requestCount: 0,
  }
}

function persistState(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MOCK_STATE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be disabled by the browser; the in-memory mock remains usable.
  }
}

function restoreState(): MockState {
  if (typeof window === 'undefined') return createInitialState()
  try {
    const saved = window.localStorage.getItem(MOCK_STATE_KEY)
    if (!saved) return createInitialState()
    const parsed: unknown = JSON.parse(saved)
    const validated = mockStateSchema.safeParse(parsed)
    return validated.success ? validated.data : createInitialState()
  } catch {
    return createInitialState()
  }
}

let state = restoreState()

export function getMockState(): MockState {
  return structuredClone(state)
}

export function updateMockState(
  mutator: (draft: MockState) => void,
): MockState {
  const draft = structuredClone(state)
  mutator(draft)
  state = mockStateSchema.parse(draft)
  persistState()
  return getMockState()
}

export function setMockScenario(scenario: MockScenario): void {
  updateMockState((draft) => {
    draft.scenario = scenario
    draft.requestCount = 0
  })
}

export function incrementMockRequestCount(): number {
  let requestCount = 0
  updateMockState((draft) => {
    draft.requestCount += 1
    requestCount = draft.requestCount
  })
  return requestCount
}

export function nextMockVersion(): number {
  let version = 0
  updateMockState((draft) => {
    draft.version += 1
    version = draft.version
  })
  return version
}

export function resetMockStore(): void {
  state = createInitialState()
  persistState()
  if (typeof window !== 'undefined') {
    clearPersistedUser()
    window.dispatchEvent(new CustomEvent('kurio:msw-reset'))
  }
}

if (typeof window !== 'undefined') {
  window.__mswReset = resetMockStore
}
