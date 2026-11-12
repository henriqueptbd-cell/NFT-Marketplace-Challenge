import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { getNfts } from '@/api/endpoints'
import { nftSortSchema, type NFTSort } from '@/api/types/nft'
import { BenefitsPanel } from '@/components/domain/BenefitsPanel'
import { BlogCard } from '@/components/domain/BlogCard'
import { EmptyState } from '@/components/domain/EmptyState'
import { LoadingGrid } from '@/components/domain/LoadingGrid'
import { MarketplaceFilters } from '@/components/domain/MarketplaceFilters'
import { MarketplaceHeader } from '@/components/domain/MarketplaceHeader'
import { NFTCard } from '@/components/domain/NFTCard'
import { NFTImage } from '@/components/domain/NFTImage'
import { PromoBanner } from '@/components/domain/PromoBanner'
import { Button } from '@/components/ui/button'
import { Drawer } from '@/components/ui/drawer'
import { ErrorState } from '@/components/domain/ErrorState'
import { FeaturedOfferCard } from '@/components/domain/FeaturedOfferCard'
import { Label } from '@/components/ui/label'
import { Pagination } from '@/components/ui/pagination'
import { Select } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNftPage, useNfts } from '@/hooks/useNfts'
import { useSectionNav } from '@/hooks/useSectionNav'
import { discoveryCopy } from '@/lib/discovery-copy'
import { scrollToSection } from '@/lib/section-scroll'
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
        // Filtro não é troca de página: manter a posição do catálogo na tela.
        resetScroll: false,
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
      pageSize: PAGE_SIZE,
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
  const nftQuery = useNftPage(listParams)
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

  const nftList = nftQuery.data?.items ?? []
  const totalNftCount = nftQuery.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(totalNftCount / PAGE_SIZE))
  const currentPage = Math.min(search.page, pageCount)
  const visibleNfts = nftList
  const featuredNft = featuredQuery.data?.[0]
  const activeTab =
    search.sort === 'newest'
      ? discoveryCopy.tabs.values.new
      : search.sort === 'trending'
        ? discoveryCopy.tabs.values.trending
        : discoveryCopy.tabs.values.all

  useEffect(() => {
    if (
      nftQuery.isSuccess &&
      !nftQuery.isPlaceholderData &&
      search.page > pageCount
    ) {
      updateSearch({ page: pageCount }, true)
    }
  }, [
    nftQuery.isPlaceholderData,
    nftQuery.isSuccess,
    pageCount,
    search.page,
    updateSearch,
  ])

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
      <main className="page-shell pb-16">
        <section
          id={discoveryCopy.nav.anchors.learn}
          className="relative my-6 grid scroll-mt-28 items-center gap-8 overflow-hidden sm:my-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.72fr)] lg:gap-14"
        >
          <div className="relative z-10 flex flex-col items-start gap-5">
            <p className="text-sm font-semibold text-primary">
              {discoveryCopy.hero.eyebrow}
            </p>
            <h1 className="max-w-3xl font-display text-5xl font-bold leading-tight text-text-primary sm:text-6xl lg:text-7xl">
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
              className="inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-8 text-sm font-semibold text-on-primary transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {discoveryCopy.hero.cta}
            </Link>
          </div>
          <div
            id={discoveryCopy.nav.anchors.creators}
            className="relative mx-auto w-full scroll-mt-28"
          >
            {featuredNft ? (
              <Link
                to="/nft/$id"
                params={{ id: featuredNft.id }}
                aria-label={featuredNft.name}
                className="group block overflow-hidden rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <NFTImage
                  src={featuredNft.image}
                  alt={discoveryCopy.accessibility.featuredImage(
                    featuredNft.name,
                  )}
                  aspectRatio="square"
                  priority
                />
              </Link>
            ) : (
              <LoadingGrid
                count={1}
                label={discoveryCopy.hero.featuredLoading}
                className="[&>div]:grid-cols-1"
              />
            )}
          </div>
        </section>

        <section
          id={discoveryCopy.nav.anchors.marketplace}
          className="grid scroll-mt-28 gap-7 py-6 md:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10"
        >
          <aside className="hidden md:block">
            <div className="sticky top-32 flex flex-col gap-4">
              <div className="rounded-card border border-border bg-surface p-5">
                <MarketplaceFilters idPrefix="desktop" {...filterProps} />
              </div>
              <FeaturedOfferCard nft={featuredNft} />
            </div>
          </aside>

          <div className="min-w-0">
            {nftQuery.data ? (
              <p className="sr-only" aria-live="polite">
                {totalNftCount === 1
                  ? discoveryCopy.catalog.resultCountOne
                  : discoveryCopy.catalog.resultCount(totalNftCount)}
              </p>
            ) : null}
            <div className="mb-5 hidden items-end justify-end gap-4 sm:flex">
              <div className="w-52 shrink-0">
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
                          onPageChange={(page) => {
                            updateSearch({ page })
                            scrollToSection(
                              discoveryCopy.nav.anchors.marketplace,
                            )
                          }}
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

        <section
          aria-label={discoveryCopy.banners.label}
          className="mt-16 grid gap-5 lg:grid-cols-2"
        >
          {discoveryCopy.banners.items.map((banner) => (
            <PromoBanner
              key={banner.id}
              title={banner.title}
              description={banner.description}
              image={banner.image}
              imageAlt={banner.imageAlt}
            />
          ))}
        </section>

        <section aria-label={discoveryCopy.blog.label} className="mt-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-text-primary sm:text-4xl">
              {discoveryCopy.blog.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base">
              {discoveryCopy.blog.description}
            </p>
          </div>
          <div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {discoveryCopy.blog.posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </section>

        <BenefitsPanel className="mt-16" />
      </main>
    </div>
  )
}
