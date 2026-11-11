import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Search, ShoppingCart, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCart } from '@/hooks/useCart'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useSectionNav } from '@/hooks/useSectionNav'
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
  const [searchOpen, setSearchOpen] = useState(false)
  const searchToggleRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef(false)
  const [queryDraft, setQueryDraft] = useState({
    source: defaultQuery,
    value: defaultQuery,
  })
  const currentUser = useCurrentUser()
  const cartQuery = useCart()
  const { search: homeSearch, onSectionClick } = useSectionNav()
  const query =
    queryDraft.source === defaultQuery ? queryDraft.value : defaultQuery

  const cartCount = cartQuery.data?.items.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  // O botão só volta a existir depois do re-render, por isso o foco fica aqui.
  useEffect(() => {
    if (searchOpen || !returnFocusRef.current) return
    returnFocusRef.current = false
    searchToggleRef.current?.focus()
  }, [searchOpen])

  function closeSearch() {
    returnFocusRef.current = true
    setSearchOpen(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSearchSubmit(query.trim())
    closeSearch()
  }

  return (
    <header
      id={discoveryCopy.nav.anchors.home}
      className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur"
    >
      <div className="mx-auto grid max-w-screen-2xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 sm:grid-cols-[1fr_auto_1fr] sm:px-6 lg:px-8">
        <Link
          to="/"
          search={{}}
          className="col-start-1 row-start-1 shrink-0 justify-self-start font-display text-xl font-bold tracking-wide text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-2xl"
        >
          {discoveryCopy.brand}
        </Link>
        <nav
          aria-label={discoveryCopy.nav.label}
          className="col-span-2 row-start-2 flex max-w-full gap-6 justify-self-center overflow-x-auto text-xs text-text-secondary sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:text-sm"
        >
          {navigation.map((item) => (
            <Link
              key={item.anchor}
              to="/"
              hash={
                item.anchor === discoveryCopy.nav.anchors.home
                  ? undefined
                  : item.anchor
              }
              search={homeSearch}
              className="shrink-0 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={(event) => onSectionClick(event, item.anchor)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="col-start-2 row-start-1 flex items-center gap-1 justify-self-end sm:col-start-3">
          {searchOpen ? (
            <form
              role="search"
              onSubmit={handleSubmit}
              className="flex items-center gap-1"
            >
              <label className="sr-only" htmlFor="marketplace-search">
                {discoveryCopy.search.label}
              </label>
              <Input
                id="marketplace-search"
                type="search"
                autoFocus
                value={query}
                placeholder={discoveryCopy.search.placeholder}
                className="w-40 sm:w-52"
                onChange={(event) =>
                  setQueryDraft({
                    source: defaultQuery,
                    value: event.target.value,
                  })
                }
                onKeyDown={(event) => {
                  if (event.key === 'Escape') closeSearch()
                }}
              />
              <Button
                type="submit"
                size="icon"
                aria-label={discoveryCopy.search.submit}
              >
                <Search aria-hidden="true" className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={discoveryCopy.search.close}
                onClick={closeSearch}
              >
                <X aria-hidden="true" className="size-4" />
              </Button>
            </form>
          ) : (
            <Button
              ref={searchToggleRef}
              type="button"
              size="icon"
              variant="ghost"
              aria-label={discoveryCopy.search.open}
              onClick={() => setSearchOpen(true)}
            >
              <Search aria-hidden="true" className="size-5" />
            </Button>
          )}
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
          {currentUser ? (
            <Link
              to="/profile"
              className="inline-flex min-h-10 max-w-32 shrink-0 items-center justify-center truncate rounded-button border border-primary px-3 text-sm font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:max-w-48 sm:px-4"
            >
              {currentUser.displayName}
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-button border border-primary px-3 text-sm font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4"
            >
              {discoveryCopy.header.login}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
