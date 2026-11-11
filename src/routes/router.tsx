import {
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { HomePage } from '@/routes/HomePage'
import { CartPage } from '@/routes/CartPage'
import { CheckoutPage } from '@/routes/CheckoutPage'
import { LoginPage } from '@/routes/LoginPage'
import { NFTDetailPage } from '@/routes/NFTDetailPage'
import { ProfilePage } from '@/routes/ProfilePage'
import { RegisterPage } from '@/routes/RegisterPage'
import { RootLayout } from '@/routes/RootLayout'
import { WalletsPage } from '@/routes/WalletsPage'
import {
  authRedirectSearchSchema,
  marketplaceSearchSchema,
} from '@/lib/validation'

const rootRoute = createRootRoute({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: (search) => marketplaceSearchSchema.parse(search),
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
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  validateSearch: (search) => authRedirectSearchSchema.parse(search),
  component: RegisterPage,
})

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
})

const walletsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/wallets',
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
