import { nftHandlers } from '@/mocks/handlers/nfts'
import { socketHandlers } from '@/mocks/handlers/socket'

export const handlers = [...nftHandlers, ...socketHandlers]
