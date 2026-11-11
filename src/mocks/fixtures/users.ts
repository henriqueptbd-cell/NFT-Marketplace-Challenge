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
      username: 'kurio-user',
      createdAt,
    },
    password: 'demo1234',
    profile: {
      userId: 'user-demo',
      displayName: 'Kurio User',
      username: 'kurio-user',
      email: 'user@kurio.io',
      ens: null,
      walletNickname: 'Carteira principal',
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
      username: 'kurio-collector',
      createdAt,
    },
    password: 'demo1234',
    profile: {
      userId: 'collector-demo',
      displayName: 'Kurio Collector',
      username: 'kurio-collector',
      email: 'collector@kurio.io',
      ens: 'collector.kurio.eth',
      walletNickname: 'Polygon Collectibles',
      avatar: null,
      bio: 'Colecionador da comunidade Kurio.',
      updatedAt: createdAt,
    },
  },
]
