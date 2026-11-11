import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Search, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/hooks/useCart'
import { discoveryCopy } from '@/lib/discovery-copy'

export interface MarketplaceHeaderProps {
  defaultQuery?: string
  onSearchSubmit: (query: string) => void
}

const navigation = [
  { label: discoveryCopy.nav.home, anchor: discoveryCopy.nav.anchors.home },
  {
    label: discoveryCopy.nav.marketplace,
    anchor: discoveryCopy.nav.anchors.marketplace,
  },
  {
    label: discoveryCopy.nav.creators,
    anchor: discoveryCopy.nav.anchors.creators,
  },
  { label: discoveryCopy.nav.learn, anchor: discoveryCopy.nav.anchors.learn },
]

export function MarketplaceHeader({
  defaultQuery = '',
  onSearchSubmit,
}: MarketplaceHeaderProps) {
  const [queryDraft, setQueryDraft] = useState({
    source: defaultQuery,
    value: defaultQuery,
  })
  const cartQuery = useCart()
  const query =
    queryDraft.source === defaultQuery ? queryDraft.value : defaultQuery

  const cartCount = cartQuery.data?.items.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearchSubmit(query.trim())
  }

  return (
    <header
      id={discoveryCopy.nav.anchors.home}
      className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          search={{
            q: undefined,
            collections: [],
            networks: [],
            sort: 'relevance',
            page: 1,
          }}
          className="shrink-0 font-display text-xl font-bold tracking-wide text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-2xl"
        >
          {discoveryCopy.brand}
        </Link>
        <form
          role="search"
          onSubmit={handleSubmit}
          className="ml-auto flex min-w-0 max-w-xl flex-1 items-center gap-2"
        >
          <label className="sr-only" htmlFor="marketplace-search">
            {discoveryCopy.search.label}
          </label>
          <Input
            id="marketplace-search"
            type="search"
            value={query}
            placeholder={discoveryCopy.search.placeholder}
            onChange={(event) =>
              setQueryDraft({ source: defaultQuery, value: event.target.value })
            }
          />
          <Button
            type="submit"
            size="icon"
            aria-label={discoveryCopy.search.submit}
          >
            <Search aria-hidden="true" className="size-4" />
          </Button>
        </form>
        <Link
          to="/cart"
          aria-label={
            cartCount === undefined
              ? discoveryCopy.header.cart
              : discoveryCopy.header.cartCount(cartCount)
          }
          className="relative inline-flex size-10 shrink-0 items-center justify-center rounded-button text-text-primary transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ShoppingCart aria-hidden="true" className="size-5" />
          {cartCount !== undefined && cartCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 min-w-5 justify-center rounded-badge-pill px-1">
              {cartCount}
            </Badge>
          ) : null}
        </Link>
        <Link
          to="/login"
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-button border border-primary px-3 text-sm font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4"
        >
          {discoveryCopy.header.login}
        </Link>
      </div>
      <nav
        aria-label={discoveryCopy.nav.label}
        className="mx-auto flex max-w-screen-2xl gap-6 overflow-x-auto px-4 pb-3 text-xs text-text-secondary sm:px-6 sm:text-sm lg:px-8"
      >
        {navigation.map((item) => (
          <a
            key={item.anchor}
            href={`/#${item.anchor}`}
            className="shrink-0 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
