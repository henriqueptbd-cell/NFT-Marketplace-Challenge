import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/drawer'
import { MarketplaceHeader } from '@/components/domain/MarketplaceHeader'
import { useLogout } from '@/hooks/useAuth'
import { accountCopy } from '@/lib/account-copy'
import type { User } from '@/api/types'

export type AccountSection = 'profile' | 'wallets'

interface AccountLayoutProps {
  active: AccountSection
  title: string
  description: string
  user: User
  children: ReactNode
}

function navigationClass(active: boolean): string {
  return active
    ? 'block w-full rounded-button bg-primary-soft px-4 py-3 text-left text-sm font-semibold text-primary'
    : 'block w-full rounded-button px-4 py-3 text-left text-sm text-text-secondary transition-colors hover:bg-surface hover:text-text-primary'
}

interface SettingsNavigationProps {
  active: AccountSection
  onNavigate?: () => void
  onLogout: () => void
  logoutPending: boolean
}

function SettingsNavigation({
  active,
  onNavigate,
  onLogout,
  logoutPending,
}: SettingsNavigationProps) {
  return (
    <nav aria-label={accountCopy.sidebar.title} className="grid gap-1">
      <Link
        to="/profile"
        aria-current={active === 'profile' ? 'page' : undefined}
        className={navigationClass(active === 'profile')}
        onClick={onNavigate}
      >
        {accountCopy.sidebar.profile}
      </Link>
      <Link
        to="/wallets"
        aria-current={active === 'wallets' ? 'page' : undefined}
        className={navigationClass(active === 'wallets')}
        onClick={onNavigate}
      >
        {accountCopy.sidebar.wallets}
      </Link>
      <span
        className={`${navigationClass(false)} cursor-not-allowed opacity-50`}
        aria-disabled="true"
      >
        {accountCopy.sidebar.activity}
      </span>
      <span
        className={`${navigationClass(false)} cursor-not-allowed opacity-50`}
        aria-disabled="true"
      >
        {accountCopy.sidebar.wishlist}
      </span>
      <span
        className={`${navigationClass(false)} cursor-not-allowed opacity-50`}
        aria-disabled="true"
      >
        {accountCopy.sidebar.offers}
      </span>
      <span
        className={`${navigationClass(false)} cursor-not-allowed opacity-50`}
        aria-disabled="true"
      >
        {accountCopy.sidebar.downloads}
      </span>
      <span
        className={`${navigationClass(false)} cursor-not-allowed opacity-50`}
        aria-disabled="true"
      >
        {accountCopy.sidebar.support}
      </span>
      <Button
        variant="ghost"
        className="mt-3 justify-start px-4 text-text-secondary"
        disabled={logoutPending}
        onClick={onLogout}
      >
        {accountCopy.sidebar.logout}
      </Button>
    </nav>
  )
}

export function AccountLayout({
  active,
  title,
  description,
  user,
  children,
}: AccountLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const logoutMutation = useLogout()

  function searchMarketplace(query: string) {
    void navigate({
      to: '/',
      search: {
        q: query || undefined,
        collections: [],
        networks: [],
        sort: 'relevance',
        page: 1,
      },
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader onSearchSubmit={searchMarketplace} />
      <main className="page-shell grid w-full gap-6 py-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 lg:py-12">
        <aside className="hidden lg:block">
          <div className="sticky top-40 rounded-card border border-border bg-surface p-4">
            <p className="mb-2 px-4 font-display text-lg font-bold text-text-primary">
              {accountCopy.sidebar.title}
            </p>
            <p className="mb-4 break-words px-4 text-xs text-text-secondary">
              {user.email}
            </p>
            <SettingsNavigation
              active={active}
              onLogout={() => logoutMutation.mutate()}
              logoutPending={logoutMutation.isPending}
            />
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-6 flex items-start gap-4">
            <Button
              variant="secondary"
              size="icon"
              className="shrink-0 lg:hidden"
              aria-label={accountCopy.common.settingsMenu}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu aria-hidden="true" className="size-5" />
            </Button>
            <div className="grid gap-2">
              <h1 className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
                {title}
              </h1>
              <p className="max-w-2xl text-sm text-text-secondary">
                {description}
              </p>
            </div>
          </div>
          {children}
        </section>
      </main>

      <Drawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={accountCopy.sidebar.title}
        closeLabel={accountCopy.common.close}
        direction="left"
      >
        <p className="break-words text-sm text-text-secondary">{user.email}</p>
        <SettingsNavigation
          active={active}
          onNavigate={() => setDrawerOpen(false)}
          onLogout={() => logoutMutation.mutate()}
          logoutPending={logoutMutation.isPending}
        />
      </Drawer>
    </div>
  )
}
