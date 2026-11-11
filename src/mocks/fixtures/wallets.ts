import type { Wallet } from '@/api/types'

const createdAt = '2026-01-01T00:00:00.000Z'

export const walletFixtures: Wallet[] = [
  {
    id: 'wallet-user-ethereum',
    userId: 'user-demo',
    name: 'Ethereum Main',
    nickname: 'Carteira principal',
    address: '0x1111111111111111111111111111111111111111',
    network: 'Ethereum',
    type: 'software',
    ens: 'kurio-user.eth',
    referralCode: 'KURIO-USER',
    email: 'user@kurio.io',
    isPrimary: true,
    createdAt,
  },
  {
    id: 'wallet-collector-polygon',
    userId: 'collector-demo',
    name: 'Polygon Collectibles',
    nickname: 'Coleção Polygon',
    address: '0x2222222222222222222222222222222222222222',
    network: 'Polygon',
    type: 'hardware',
    ens: 'collector.kurio.eth',
    referralCode: 'KURIO-COLLECTOR',
    email: 'collector@kurio.io',
    isPrimary: true,
    createdAt,
  },
]
