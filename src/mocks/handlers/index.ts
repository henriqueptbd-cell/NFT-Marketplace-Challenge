import { http } from 'msw'
import { applyGlobalScenario } from '@/mocks/handlers/common'
import { authHandlers } from '@/mocks/handlers/auth'
import { cartHandlers } from '@/mocks/handlers/cart'
import { favoriteHandlers } from '@/mocks/handlers/favorites'
import { nftHandlers } from '@/mocks/handlers/nfts'
import { orderHandlers } from '@/mocks/handlers/orders'
import { profileHandlers } from '@/mocks/handlers/profile'
import { quoteHandlers } from '@/mocks/handlers/quote'
import { socketHandlers } from '@/mocks/handlers/socket'
import { walletHandlers } from '@/mocks/handlers/wallets'

const scenarioHandler = http.all('/api/*', async () => applyGlobalScenario())

export const handlers = [
  scenarioHandler,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...orderHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...socketHandlers,
]
