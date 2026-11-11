import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { getNfts } from '@/api/endpoints'
import { nftSortSchema, type NFTSort } from '@/api/types/nft'
import { EmptyState } from '@/components/domain/EmptyState'
import { LoadingGrid } from '@/components/domain/LoadingGrid'
import { MarketplaceFilters } from '@/components/domain/MarketplaceFilters'
import { MarketplaceHeader } from '@/components/domain/MarketplaceHeader'
import { NFTCard } from '@/components/domain/NFTCard'
import { NFTImage } from '@/components/domain/NFTImage'
import { PriceDisplay } from '@/components/domain/PriceDisplay'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/drawer'
import { ErrorState } from '@/components/domain/ErrorState'
import { Label } from '@/components/ui/label'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNfts } from '@/hooks/useNfts'
import { useSectionNav } from '@/hooks/useSectionNav'
import { discoveryCopy } from '@/lib/discovery-copy'
import {
  parseMarketplaceSearch,
  stripDefaultSearch,
  type MarketplaceSearch,
} from '@/lib/validation'

const PAGE_SIZE = 12

const sortOptions = [
  { value: 'relevance', label: discoveryCopy.sort.options.relevance },
  { value: 'newest', label: discoveryCopy.sort.options.newest },
  { value: 'trending', label: discoveryCopy.sort.options.trending },
  { value: 'price-asc', label: discoveryCopy.sort.options.priceAsc },
  { value: 'price-desc', label: discoveryCopy.sort.options.priceDesc },
]

const tabSorts = new Map<string, NFTSort>([
  [discoveryCopy.tabs.values.all, 'relevance'],
  [discoveryCopy.tabs.values.new, 'newest'],
  [discoveryCopy.tabs.values.trending, 'trending'],
])

export function HomePage() {
  const routeSearch = useSearch({ from: '/' })
  const search = useMemo(
    () => parseMarketplaceSearch(routeSearch),
    [routeSearch],
  )
  const navigate = useNavigate({ from: '/' })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { onSectionClick } = useSectionNav()

  const updateSearch = useCallback(
    (updates: Partial<MarketplaceSearch>, replace = false) => {
      void navigate({
        search: (previous) =>
          stripDefaultSearch({
            ...previous,
            ...updates,
            page: updates.page ?? 1,
          }),
        replace,
      })
    },
    [navigate],
  )

  const listParams = useMemo(
    () => ({
      query: search.q,
      collections: search.collections,
      networks: search.networks,
      priceMin: search.priceMin,
      priceMax: search.priceMax,
      sort: search.sort,
      page: search.page,
      pageSize: 100,
    }),
    [
      search.collections,
      search.networks,
      search.page,
      search.priceMax,
      search.priceMin,
      search.q,
      search.sort,
    ],
  )
  const nftQuery = useNfts(listParams)
  const filterOptionsQuery = useQuery({
    queryKey: ['nfts', 'filter-options'],
    queryFn: ({ signal }) => getNfts({ pageSize: 100 }, signal),
  })
  const featuredQuery = useNfts({ sort: 'trending', pageSize: 1 })
  const allFilterNfts = filterOptionsQuery.data

  const collectionOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const nft of allFilterNfts ?? []) {
      counts.set(nft.collection, (counts.get(nft.collection) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([value, count]) => ({ value, label: value, count }))
  }, [allFilterNfts])

  const networkOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const nft of allFilterNfts ?? []) {
      counts.set(nft.network, (counts.get(nft.network) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([value, count]) => ({ value, label: value, count }))
  }, [allFilterNfts])

  const nftList = nftQuery.data ?? []
  const pageCount = Math.max(1, Math.ceil(nftList.length / PAGE_SIZE))
  const currentPage = Math.min(search.page, pageCount)
  const visibleNfts = nftList.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )
  const featuredNft = featuredQuery.data?.[0]
  const activeTab =
    search.sort === 'newest'
      ? discoveryCopy.tabs.values.new
      : search.sort === 'trending'
        ? discoveryCopy.tabs.values.trending
        : discoveryCopy.tabs.values.all

  useEffect(() => {
    if (nftQuery.isSuccess && search.page > pageCount) {
      updateSearch({ page: pageCount }, true)
    }
  }, [nftQuery.isSuccess, pageCount, search.page, updateSearch])

  function handleSortChange(value: string) {
    const parsed = nftSortSchema.safeParse(value)
    if (parsed.success) updateSearch({ sort: parsed.data })
  }

  function clearFilters() {
    updateSearch({
      collections: [],
      networks: [],
      priceMin: undefined,
      priceMax: undefined,
    })
  }

  const filterProps = {
    search,
    collections: collectionOptions,
    networks: networkOptions,
    onChange: updateSearch,
    onClear: clearFilters,
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <MarketplaceHeader
        defaultQuery={search.q}
        onSearchSubmit={(query) => updateSearch({ q: query || undefined })}
      />
      <main className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 lg:px-8">
        <section
          id={discoveryCopy.nav.anchors.learn}
          className="relative my-6 grid min-h-[20rem] scroll-mt-28 items-center gap-8 overflow-hidden rounded-card border border-border bg-gradient-to-br from-surface via-background to-elevated p-6 sm:my-10 sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.72fr)] lg:p-14"
        >
          <div className="relative z-10 grid content-center justify-items-start gap-5">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary">
              {discoveryCopy.hero.eyebrow}
            </p>
            <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight text-text-primary sm:text-5xl lg:text-6xl">
              {discoveryCopy.hero.title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">
              {discoveryCopy.hero.description}
            </p>
            <Link
              to="/"
              hash={discoveryCopy.nav.anchors.marketplace}
              search={stripDefaultSearch(search)}
              onClick={(event) =>
                onSectionClick(event, discoveryCopy.nav.anchors.marketplace)
              }
              className="inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {discoveryCopy.hero.cta}
            </Link>
          </div>
          <div
            id={discoveryCopy.nav.anchors.creators}
            className="relative mx-auto w-full max-w-sm scroll-mt-28"
          >
            {featuredNft ? (
              <Link
                to="/nft/$id"
                params={{ id: featuredNft.id }}
                aria-label={featuredNft.name}
                className="group block overflow-hidden rounded-card border border-border bg-background/80 p-3 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <NFTImage
                  src={featuredNft.image}
                  alt={discoveryCopy.accessibility.featuredImage(
                    featuredNft.name,
                  )}
                  aspectRatio="square"
                  priority
                />
                <div className="grid gap-1 p-3">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">
                    {discoveryCopy.hero.featured}
                  </p>
                  <h2 className="font-display text-xl font-bold">
                    {featuredNft.name}
                  </h2>
                  <p className="text-xs text-text-secondary">
                    {featuredNft.collection}
                  </p>
                  <PriceDisplay price={featuredNft.priceString} />
                </div>
              </Link>
            ) : (
              <div className="rounded-card border border-border bg-background/80 p-3">
                <LoadingGrid
                  count={1}
                  label={discoveryCopy.hero.featuredLoading}
                  className="[&>div]:grid-cols-1"
                />
              </div>
            )}
          </div>
        </section>

        <section
          id={discoveryCopy.nav.anchors.marketplace}
          className="grid scroll-mt-28 gap-7 py-6 md:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10"
        >
          <aside className="hidden md:block">
            <div className="sticky top-32 rounded-card border border-border bg-surface p-5">
              <MarketplaceFilters idPrefix="desktop" {...filterProps} />
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold sm:text-3xl">
                  {discoveryCopy.catalog.title}
                </h2>
                {nftQuery.data ? (
                  <p
                    className="mt-2 text-xs text-text-secondary"
                    aria-live="polite"
                  >
                    {nftList.length === 1
                      ? discoveryCopy.catalog.resultCountOne
                      : discoveryCopy.catalog.resultCount(nftList.length)}
                  </p>
                ) : null}
              </div>
              <div className="hidden w-52 shrink-0 sm:block">
                <Label className="sr-only" htmlFor="catalog-sort">
                  {discoveryCopy.sort.label}
                </Label>
                <Select
                  id="catalog-sort"
                  value={search.sort}
                  options={sortOptions}
                  placeholder={discoveryCopy.sort.placeholder}
                  ariaLabel={discoveryCopy.sort.label}
                  onValueChange={handleSortChange}
                />
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
              <Button
                variant="outline"
                onClick={() => setFiltersOpen(true)}
                aria-label={discoveryCopy.filters.open}
              >
                <SlidersHorizontal aria-hidden="true" className="size-4" />
                {discoveryCopy.filters.open}
              </Button>
              <div className="w-48">
                <Select
                  id="catalog-sort-mobile"
                  value={search.sort}
                  options={sortOptions}
                  placeholder={discoveryCopy.sort.placeholder}
                  ariaLabel={discoveryCopy.sort.label}
                  onValueChange={handleSortChange}
                />
              </div>
            </div>

            <Drawer
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
              title={discoveryCopy.filters.title}
              closeLabel={discoveryCopy.filters.close}
              description={discoveryCopy.filters.drawerDescription}
              direction="left"
              className="w-[min(24rem,90vw)]"
            >
              <MarketplaceFilters idPrefix="mobile" {...filterProps} />
            </Drawer>

            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                const sort = tabSorts.get(value)
                if (sort) updateSearch({ sort })
              }}
              className="gap-5"
            >
              <TabsList aria-label={discoveryCopy.tabs.label}>
                <TabsTrigger value={discoveryCopy.tabs.values.all}>
                  {discoveryCopy.tabs.all}
                </TabsTrigger>
                <TabsTrigger value={discoveryCopy.tabs.values.new}>
                  {discoveryCopy.tabs.new}
                </TabsTrigger>
                <TabsTrigger value={discoveryCopy.tabs.values.trending}>
                  {discoveryCopy.tabs.trending}
                </TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab}>
                {nftQuery.isPending && !nftQuery.data ? (
                  <LoadingGrid
                    count={8}
                    label={discoveryCopy.catalog.loading}
                  />
                ) : nftQuery.isError && !nftQuery.data ? (
                  <ErrorState
                    title={discoveryCopy.catalog.errorTitle}
                    message={discoveryCopy.catalog.errorDescription}
                    retryLabel={discoveryCopy.catalog.retry}
                    onRetry={() => void nftQuery.refetch()}
                  />
                ) : nftList.length === 0 ? (
                  <EmptyState
                    title={discoveryCopy.catalog.emptyTitle}
                    description={discoveryCopy.catalog.emptyDescription}
                    actionLabel={discoveryCopy.filters.clear}
                    onAction={clearFilters}
                  />
                ) : (
                  <>
                    {nftQuery.isFetching ? (
                      <span className="sr-only" role="status">
                        {discoveryCopy.catalog.refetching}
                      </span>
                    ) : null}
                    <div
                      className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4"
                      aria-busy={nftQuery.isFetching}
                    >
                      {visibleNfts.map((nft, index) => (
                        <NFTCard
                          key={nft.id}
                          nft={nft}
                          priority={index < 4}
                          className="min-w-0"
                        />
                      ))}
                    </div>
                    {pageCount > 1 ? (
                      <div className="mt-10">
                        <Pagination
                          page={currentPage}
                          pageCount={pageCount}
                          onPageChange={(page) => updateSearch({ page })}
                          ariaLabel={discoveryCopy.pagination.label}
                          labels={{
                            previous: discoveryCopy.pagination.previous,
                            next: discoveryCopy.pagination.next,
                            page: discoveryCopy.pagination.page,
                          }}
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
    </div>
  )
}
