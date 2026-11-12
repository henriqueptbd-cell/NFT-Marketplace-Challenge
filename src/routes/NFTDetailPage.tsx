import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { Heart, Mail, ZoomIn } from 'lucide-react'
import { apiErrorSchema } from '@/api/types/api-error'
import { BenefitsPanel } from '@/components/domain/BenefitsPanel'
import { EmptyState } from '@/components/domain/EmptyState'
import { ErrorState } from '@/components/domain/ErrorState'
import { NFTCard } from '@/components/domain/NFTCard'
import { NFTImage } from '@/components/domain/NFTImage'
import { PriceDisplay } from '@/components/domain/PriceDisplay'
import { QuantityStepper } from '@/components/domain/QuantityStepper'
import { RatingStars } from '@/components/domain/RatingStars'
import { SocialIcon } from '@/components/domain/SocialIcon'
import { MarketplaceHeader } from '@/components/domain/MarketplaceHeader'
import { NftReviews } from '@/components/domain/NftReviews'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAddCartItem } from '@/hooks/useCart'
import { useFavorite } from '@/hooks/useFavorites'
import { useNft, useNfts } from '@/hooks/useNfts'
import { useSectionNav } from '@/hooks/useSectionNav'
import { cn } from '@/lib/cn'
import { discoveryCopy } from '@/lib/discovery-copy'
import { stripDefaultSearch } from '@/lib/validation'

const shareTargets = [
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'mail',
    label: 'E-mail',
    href: (url: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    href: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
] as const

interface CartFeedback {
  nftId: string
  status: 'success' | 'error'
  message?: string
}

type DetailTab = 'details' | 'reviews'

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const parsed = apiErrorSchema.safeParse(error.response?.data)
    if (parsed.success) return parsed.data.message
  }
  return fallback
}

function DetailLoading() {
  return (
    <main className="page-shell grid gap-7 py-8 pb-16 md:py-12 lg:grid-cols-[6.25rem_minmax(0,27.7rem)_minmax(0,1fr)]">
      <div className="hidden gap-4 lg:grid">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            key={index}
            label={discoveryCopy.detail.loading}
            className="aspect-square w-full rounded-md"
          />
        ))}
      </div>
      <Skeleton
        label={discoveryCopy.detail.loading}
        className="aspect-square w-full rounded-lg"
      />
      <div className="grid content-start gap-5 lg:pl-1">
        <Skeleton label={discoveryCopy.detail.loading} className="h-8 w-4/5" />
        <Skeleton label={discoveryCopy.detail.loading} className="h-5 w-2/5" />
        <Skeleton
          label={discoveryCopy.detail.loading}
          className="h-20 w-full"
        />
        <Skeleton
          label={discoveryCopy.detail.loading}
          className="h-16 w-full"
        />
        <Skeleton
          label={discoveryCopy.detail.loading}
          className="h-24 w-full"
        />
      </div>
    </main>
  )
}

export function NFTDetailPage() {
  const { id } = useParams({ from: '/nft/$id' })
  const navigate = useNavigate()
  const { search: homeSearch, onSectionClick } = useSectionNav()
  const nftQuery = useNft(id)
  const nft = nftQuery.data
  const favorite = useFavorite(id)
  const addCartItem = useAddCartItem()
  const [quantitySelection, setQuantitySelection] = useState({
    nftId: '',
    quantity: 1,
  })
  const [selectedImage, setSelectedImage] = useState({ nftId: '', src: '' })
  const [tabSelection, setTabSelection] = useState<{
    nftId: string
    tab: DetailTab
  }>({ nftId: '', tab: 'details' })
  const [cartFeedback, setCartFeedback] = useState<CartFeedback>()

  const relatedQuery = useNfts(
    {
      collection: nft?.collection,
      sort: 'trending',
      pageSize: 100,
    },
    { enabled: nft !== undefined },
  )

  const currentQuantity =
    nft && nft.edition.available > 0
      ? Math.min(
          quantitySelection.nftId === id ? quantitySelection.quantity : 1,
          nft.edition.available,
        )
      : 0
  const imageSource =
    nft && selectedImage.nftId === id && nft.images.includes(selectedImage.src)
      ? selectedImage.src
      : (nft?.images[0] ?? nft?.image ?? '')
  const editionLabel = nft?.edition.isOpen
    ? discoveryCopy.detail.openEdition
    : discoveryCopy.detail.edition(nft?.edition.total ?? 1)
  const editionOptions = nft
    ? [...new Set([1, 10, nft.edition.total])]
        .sort((a, b) => a - b)
        .map((total) => ({
          label: discoveryCopy.detail.edition(total),
          selected: !nft.edition.isOpen && nft.edition.total === total,
        }))
        .concat({
          label: discoveryCopy.detail.openEdition,
          selected: nft.edition.isOpen,
        })
    : []
  const attributeList = nft?.attributes.length
    ? nft.attributes.map((attribute) => attribute.value).join(', ')
    : '—'
  const shareUrl =
    typeof window === 'undefined' ? '' : `${window.location.origin}/nft/${id}`
  const activeTab: DetailTab =
    tabSelection.nftId === id ? tabSelection.tab : 'details'

  function handleSearch(query: string) {
    void navigate({
      to: '/',
      hash: discoveryCopy.nav.anchors.marketplace,
      search: stripDefaultSearch({
        q: query || undefined,
        collections: [],
        networks: [],
        sort: 'relevance',
        page: 1,
      }),
    })
  }

  function handleAddToCart() {
    if (!nft || currentQuantity < 1) return
    setCartFeedback(undefined)
    addCartItem.mutate(
      { nftId: nft.id, quantity: currentQuantity },
      {
        onSuccess: () => setCartFeedback({ nftId: nft.id, status: 'success' }),
        onError: (error) =>
          setCartFeedback({
            nftId: nft.id,
            status: 'error',
            message: errorMessage(error, discoveryCopy.detail.cartError),
          }),
      },
    )
  }

  const isNotFound =
    axios.isAxiosError(nftQuery.error) &&
    nftQuery.error.response?.status === 404

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <MarketplaceHeader onSearchSubmit={handleSearch} />
      {nftQuery.isPending && !nft ? (
        <DetailLoading />
      ) : isNotFound ? (
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <EmptyState
            title={discoveryCopy.detail.notFoundTitle}
            description={discoveryCopy.detail.notFoundDescription}
            actionLabel={discoveryCopy.detail.backToMarket}
            onAction={() =>
              void navigate({
                to: '/',
                search: {
                  q: undefined,
                  collections: [],
                  networks: [],
                  sort: 'relevance',
                  page: 1,
                },
              })
            }
          />
        </main>
      ) : nftQuery.isError && !nft ? (
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <ErrorState
            title={discoveryCopy.detail.errorTitle}
            message={errorMessage(
              nftQuery.error,
              discoveryCopy.detail.errorDescription,
            )}
            retryLabel={discoveryCopy.catalog.retry}
            onRetry={() => void nftQuery.refetch()}
          />
        </main>
      ) : nft ? (
        <main className="page-shell pb-16 pt-6 md:pt-8">
          <nav
            aria-label={discoveryCopy.detail.breadcrumb}
            className="pb-4 font-mono text-xs"
          >
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  to="/"
                  search={{}}
                  className="text-text-primary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {discoveryCopy.nav.home}
                </Link>
              </li>
              <li aria-hidden="true" className="text-muted">
                /
              </li>
              <li>
                <Link
                  to="/"
                  hash={discoveryCopy.nav.anchors.marketplace}
                  search={homeSearch}
                  className="text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={(event) =>
                    onSectionClick(event, discoveryCopy.nav.anchors.marketplace)
                  }
                >
                  {discoveryCopy.nav.marketplace}
                </Link>
              </li>
              <li aria-current="page" className="sr-only">
                {nft.name}
              </li>
            </ol>
          </nav>

          <div className="grid items-start gap-7 lg:grid-cols-[6.25rem_minmax(0,27.7rem)_minmax(0,1fr)]">
            {/* Desktop: 4 miniaturas empilhadas à esquerda. No mobile viram
                uma faixa horizontal abaixo da imagem principal. */}
            <div
              role="group"
              aria-label={discoveryCopy.accessibility.gallery(nft.name)}
              className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-none lg:grid lg:grid-cols-1 lg:gap-4 lg:overflow-visible lg:pb-0"
            >
              {nft.images.map((src, index) => (
                <Button
                  key={`${src}-${index}`}
                  variant="ghost"
                  className={cn(
                    'h-auto w-20 shrink-0 overflow-hidden rounded-md p-0 transition-opacity lg:w-full',
                    imageSource === src
                      ? 'opacity-100'
                      : 'opacity-60 hover:opacity-100',
                  )}
                  aria-label={discoveryCopy.detail.thumbnail(nft.name, index)}
                  aria-pressed={imageSource === src}
                  onClick={() => setSelectedImage({ nftId: id, src })}
                >
                  <NFTImage
                    src={src}
                    alt={nft.name}
                    aspectRatio="square"
                    className="rounded-md"
                  />
                </Button>
              ))}
            </div>

            <div className="relative order-1 rounded-lg bg-elevated p-5 lg:order-none">
              <NFTImage
                src={imageSource}
                alt={nft.name}
                aspectRatio="square"
                priority
                className="rounded-md"
              />
              <a
                href={imageSource}
                target="_blank"
                rel="noreferrer"
                aria-label={discoveryCopy.detail.zoom}
                className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-background/75 text-text-primary backdrop-blur transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ZoomIn aria-hidden="true" className="size-4" />
              </a>
            </div>

            <section className="order-3 grid content-start lg:order-none lg:pl-1">
              <div className="grid gap-1.5">
                <h1 className="font-display text-[2rem] font-bold leading-tight tracking-tight">
                  {nft.name}
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <PriceDisplay price={nft.priceString} className="text-2xl" />
                  <RatingStars
                    rating={nft.rating}
                    reviewCount={nft.reviewCount}
                    label={discoveryCopy.detail.reviews(nft.reviewCount)}
                    onLabelClick={() =>
                      setTabSelection({ nftId: id, tab: 'reviews' })
                    }
                    ariaLabel={discoveryCopy.detail.reviewLabel(
                      nft.rating,
                      nft.reviewCount,
                    )}
                  />
                </div>
              </div>

              <div className="mt-3.5 grid gap-2">
                <h2 className="font-mono text-sm font-bold text-text-primary">
                  {discoveryCopy.detail.about}
                </h2>
                <p className="font-mono text-[0.8125rem] leading-6 text-text-secondary">
                  {nft.description}
                </p>
              </div>

              <div className="mt-2 grid gap-3">
                <h2 className="font-mono text-sm font-bold text-text-primary">
                  {discoveryCopy.detail.editionLabel}
                </h2>
                <div className="flex flex-wrap items-center gap-2.5">
                  {editionOptions.map((option) => (
                    <span
                      key={option.label}
                      aria-current={option.selected ? 'true' : undefined}
                      className={cn(
                        'rounded-button border px-3.5 py-1.5 font-mono text-xs',
                        option.selected
                          ? 'border-primary bg-primary font-bold text-on-primary'
                          : 'border-border bg-surface text-text-secondary',
                      )}
                    >
                      {option.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <QuantityStepper
                  shape="circle"
                  value={currentQuantity}
                  min={nft.edition.available > 0 ? 1 : 0}
                  max={nft.edition.available}
                  disabled={nft.edition.available === 0}
                  labels={{
                    decrease: discoveryCopy.detail.decreaseQuantity,
                    increase: discoveryCopy.detail.increaseQuantity,
                    current: discoveryCopy.detail.quantityCurrent,
                  }}
                  onChange={(quantity) =>
                    setQuantitySelection({ nftId: id, quantity })
                  }
                />
                <div className="flex items-center gap-2">
                  <Button
                    disabled={
                      nft.edition.available === 0 || addCartItem.isPending
                    }
                    onClick={handleAddToCart}
                    className="h-10 w-[8.125rem] text-xs uppercase tracking-[0.08em]"
                  >
                    {nft.edition.available === 0
                      ? discoveryCopy.detail.soldOut
                      : discoveryCopy.detail.purchase}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-10 w-[8.125rem] border-border bg-surface px-2 text-xs text-text-primary hover:border-primary hover:bg-surface"
                    aria-label={
                      favorite.isFavorite
                        ? discoveryCopy.detail.favoriteActive
                        : discoveryCopy.detail.favorite
                    }
                    aria-pressed={favorite.isFavorite}
                    disabled={favorite.isPending}
                    onClick={() => favorite.toggle(!favorite.isFavorite)}
                  >
                    <Heart
                      aria-hidden="true"
                      className={
                        favorite.isFavorite
                          ? 'size-4 fill-primary text-primary'
                          : 'size-4'
                      }
                    />
                    {favorite.isFavorite
                      ? discoveryCopy.detail.favoriteActive
                      : discoveryCopy.detail.favorite}
                  </Button>
                </div>
              </div>

              <dl className="mt-6 grid gap-[1.1rem] font-mono text-xs">
                <div className="flex flex-wrap gap-2">
                  <dt className="text-muted">
                    {discoveryCopy.detail.tokenId}:
                  </dt>
                  <dd className="break-all text-text-secondary">{nft.id}</dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="text-muted">
                    {discoveryCopy.detail.collection}:
                  </dt>
                  <dd className="text-text-secondary">{nft.collection}</dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="text-muted">
                    {discoveryCopy.detail.attributes}:
                  </dt>
                  <dd className="text-text-secondary">{attributeList}</dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap items-center gap-3.5">
                <span className="font-mono text-xs font-bold text-text-primary">
                  {discoveryCopy.detail.share}
                </span>
                <div className="flex items-center gap-3 text-text-primary">
                  {shareTargets.map((target) => (
                    <a
                      key={target.id}
                      href={target.href(shareUrl, nft.name)}
                      target={target.id === 'mail' ? undefined : '_blank'}
                      rel="noreferrer"
                      aria-label={discoveryCopy.detail.shareOn(target.label)}
                      className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {target.id === 'mail' ? (
                        <Mail aria-hidden="true" className="size-4" />
                      ) : (
                        <SocialIcon id={target.id} />
                      )}
                    </a>
                  ))}
                </div>
              </div>

              {favorite.error ? (
                <p role="alert" className="text-xs text-primary">
                  {errorMessage(
                    favorite.error,
                    discoveryCopy.detail.favoriteError,
                  )}
                </p>
              ) : null}
              {cartFeedback?.nftId === id ? (
                <p
                  role={cartFeedback.status === 'error' ? 'alert' : 'status'}
                  className="text-xs text-primary"
                >
                  {cartFeedback.status === 'success'
                    ? discoveryCopy.detail.cartSuccess
                    : cartFeedback.message}
                </p>
              ) : null}
            </section>
          </div>

          <section className="mt-14">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setTabSelection({ nftId: id, tab: value as DetailTab })
              }
              className="gap-7"
            >
              <TabsList className="w-full justify-start gap-8">
                <TabsTrigger
                  value="details"
                  className="px-0 font-mono text-sm font-bold"
                >
                  {discoveryCopy.detail.details.title}
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="px-0 font-mono text-sm font-bold"
                >
                  {discoveryCopy.detail.reviewsTab(nft.reviewCount)}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="grid gap-7">
                <div className="grid gap-4 font-mono text-sm leading-7 text-text-secondary">
                  <p>
                    {discoveryCopy.detail.details.provenance(
                      nft.name,
                      nft.collection,
                      editionLabel,
                      nft.network,
                    )}
                  </p>
                  <p>{discoveryCopy.detail.details.ownership}</p>
                </div>
                <ul className="grid gap-2.5 font-mono text-xs text-text-secondary">
                  <li className="flex gap-2">
                    <span aria-hidden="true" className="text-primary">
                      •
                    </span>
                    <span>
                      <strong className="text-text-primary">
                        {discoveryCopy.detail.network}:
                      </strong>{' '}
                      {discoveryCopy.detail.details.network(nft.network)}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden="true" className="text-primary">
                      •
                    </span>
                    <span>
                      <strong className="text-text-primary">
                        {discoveryCopy.detail.contract}:
                      </strong>{' '}
                      {discoveryCopy.detail.details.contract}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden="true" className="text-primary">
                      •
                    </span>
                    <span>
                      <strong className="text-text-primary">
                        {discoveryCopy.detail.royalty}:
                      </strong>{' '}
                      {discoveryCopy.detail.details.royalty}
                    </span>
                  </li>
                </ul>
              </TabsContent>

              <TabsContent value="reviews">
                <NftReviews nftId={nft.id} />
              </TabsContent>
            </Tabs>
          </section>

          <section className="mt-16 grid gap-5">
            <h2 className="text-center font-display text-2xl font-bold">
              {discoveryCopy.detail.moreFromCollection}
            </h2>
            <div
              aria-label={discoveryCopy.accessibility.carousel(nft.collection)}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
            >
              {relatedQuery.isPending
                ? Array.from({ length: 5 }, (_, index) => (
                    <Skeleton
                      key={index}
                      label={discoveryCopy.detail.loading}
                      className="aspect-square w-full rounded-card"
                    />
                  ))
                : (relatedQuery.data ?? [])
                    .filter((relatedNft) => relatedNft.id !== nft.id)
                    .slice(0, 5)
                    .map((relatedNft) => (
                      <NFTCard key={relatedNft.id} nft={relatedNft} />
                    ))}
            </div>
          </section>

          <BenefitsPanel className="mt-16" />
        </main>
      ) : null}
    </div>
  )
}
