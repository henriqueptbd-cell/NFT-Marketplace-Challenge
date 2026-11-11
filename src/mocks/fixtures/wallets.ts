import type { Wallet } from '@/api/types'

const createdAt = '2026-01-01T00:00:00.000Z'

export const walletFixtures: Wallet[] = [
  {
    id: 'wallet-user-ethereum',
    userId: 'user-demo',
    name: 'Ethereum Main',
    address: '0x1111111111111111111111111111111111111111',
    network: 'Ethereum',
    isPrimary: true,
    createdAt,
  },
  {
    id: 'wallet-collector-polygon',
    userId: 'collector-demo',
    name: 'Polygon Collectibles',
    address: '0x2222222222222222222222222222222222222222',
    network: 'Polygon',
    isPrimary: true,
    createdAt,
  },
]
