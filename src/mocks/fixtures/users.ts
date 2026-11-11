import type { CollectorProfile, User } from '@/api/types'

export interface UserFixture {
  user: User
  password: string
  profile: CollectorProfile
}

const createdAt = '2026-01-01T00:00:00.000Z'

export const userFixtures: UserFixture[] = [
  {
    user: {
      id: 'user-demo',
      email: 'user@kurio.io',
      role: 'user',
      displayName: 'Kurio User',
      createdAt,
    },
    password: 'demo1234',
    profile: {
      userId: 'user-demo',
      displayName: 'Kurio User',
      email: 'user@kurio.io',
      ens: null,
      avatar: null,
      bio: '',
      updatedAt: createdAt,
    },
  },
  {
    user: {
      id: 'collector-demo',
      email: 'collector@kurio.io',
      role: 'collector',
      displayName: 'Kurio Collector',
      createdAt,
    },
    password: 'demo1234',
    profile: {
      userId: 'collector-demo',
      displayName: 'Kurio Collector',
      email: 'collector@kurio.io',
      ens: 'collector.kurio.eth',
      avatar: null,
      bio: 'Colecionador da comunidade Kurio.',
      updatedAt: createdAt,
    },
  },
]
