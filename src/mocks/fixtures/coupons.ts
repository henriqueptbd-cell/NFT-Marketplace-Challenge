import type { Coupon } from '@/api/types'

export const couponFixtures: Coupon[] = [
  {
    code: 'KURIO10',
    discountType: 'percentage',
    discountValue: '10',
    startsAt: '2025-01-01T00:00:00.000Z',
    expiresAt: '2030-01-01T00:00:00.000Z',
    active: true,
  },
  {
    code: 'WELCOME',
    discountType: 'fixed',
    discountValue: '0.02',
    startsAt: '2025-01-01T00:00:00.000Z',
    expiresAt: '2030-01-01T00:00:00.000Z',
    active: true,
  },
  {
    code: 'EXPIRED',
    discountType: 'percentage',
    discountValue: '10',
    startsAt: '2020-01-01T00:00:00.000Z',
    expiresAt: '2021-01-01T00:00:00.000Z',
    active: false,
  },
]
