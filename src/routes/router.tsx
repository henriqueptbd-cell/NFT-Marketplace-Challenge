import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import { readPersistedUser } from '@/api/client'
import { openAuthDialog } from '@/lib/auth-dialog'
import { HomePage } from '@/routes/HomePage'
import { CartPage } from '@/routes/CartPage'
import { CheckoutPage } from '@/routes/CheckoutPage'
import { NFTDetailPage } from '@/routes/NFTDetailPage'
import { ProfilePage } from '@/routes/ProfilePage'
import { RootLayout } from '@/routes/RootLayout'
import { WalletsPage } from '@/routes/WalletsPage'
import { LoginDialogRoute, RegisterDialogRoute } from '@/routes/AuthDialogRoute'
import {
  authRedirectSearchSchema,
  marketplaceSearchSchema,
  stripDefaultSearch,
  type MarketplaceSearch,
} from '@/lib/validation'

const rootRoute = createRootRoute({
  component: RootLayout,
})

function requireAuthenticatedRoute(location: { href: string }) {
  if (readPersistedUser()) return
  openAuthDialog({ mode: 'login', redirect: location.href })
  throw redirect({ to: '/' })
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  // Defaults ficam de fora da URL; a Home os reaplica ao consumir.
  validateSearch: (search): Partial<MarketplaceSearch> =>
    stripDefaultSearch(marketplaceSearchSchema.parse(search)),
  component: HomePage,
})

const nftRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$id',
  component: NFTDetailPage,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cart',
  component: CartPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  component: CheckoutPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search) => authRedirectSearchSchema.parse(search),
  component: LoginDialogRoute,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: (search) => authRedirectSearchSchema.parse(search),
  component: RegisterDialogRoute,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  beforeLoad: ({ location }) => requireAuthenticatedRoute(location),
  component: ProfilePage,
})

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
  beforeLoad: ({ location }) => requireAuthenticatedRoute(location),
  component: WalletsPage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  nftRoute,
  cartRoute,
  checkoutRoute,
  loginRoute,
  registerRoute,
  profileRoute,
  walletsRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
