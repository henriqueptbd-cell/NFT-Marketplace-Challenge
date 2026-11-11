import { useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { apiErrorSchema } from '@/api/types/api-error'
import { EmptyState } from '@/components/domain/EmptyState'
import { ErrorState } from '@/components/domain/ErrorState'
import { NFTCard } from '@/components/domain/NFTCard'
import { NFTImage } from '@/components/domain/NFTImage'
import { PriceDisplay } from '@/components/domain/PriceDisplay'
import { QuantityStepper } from '@/components/domain/QuantityStepper'
import { RatingStars } from '@/components/domain/RatingStars'
import { MarketplaceHeader } from '@/components/domain/MarketplaceHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAddCartItem } from '@/hooks/useCart'
import { useFavorite } from '@/hooks/useFavorites'
import { useNft, useNfts } from '@/hooks/useNfts'
import { discoveryCopy } from '@/lib/discovery-copy'

interface CartFeedback {
  nftId: string
  status: 'success' | 'error'
  message?: string
}

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const parsed = apiErrorSchema.safeParse(error.response?.data)
    if (parsed.success) return parsed.data.message
  }
  return fallback
}

function DetailLoading() {
  return (
    <main className="mx-auto grid max-w-screen-2xl gap-8 px-4 py-8 pb-32 sm:px-6 md:grid-cols-2 md:py-12 md:pb-12 lg:px-8">
      <Skeleton
        label={discoveryCopy.detail.loading}
        className="aspect-[3/4] w-full rounded-card"
      />
      <div className="grid content-start gap-5">
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
  const nftQuery = useNft(id)
  const nft = nftQuery.data
  const favorite = useFavorite(id)
  const addCartItem = useAddCartItem()
  const [quantitySelection, setQuantitySelection] = useState({
    nftId: '',
    quantity: 1,
  })
  const [selectedImage, setSelectedImage] = useState({ nftId: '', src: '' })
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

  function handleSearch(query: string) {
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
        <main className="mx-auto max-w-screen-2xl px-4 pb-72 pt-6 sm:px-6 md:pb-16 md:pt-10 lg:px-8">
          <div className="grid items-start gap-8 md:grid-cols-2 lg:gap-12">
            <section aria-label={discoveryCopy.accessibility.gallery(nft.name)}>
              <NFTImage
                src={imageSource}
                alt={nft.name}
                aspectRatio="portrait"
                priority
                className="max-h-[min(72vh,52rem)]"
              />
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {nft.images.map((src, index) => (
                  <Button
                    key={`${src}-${index}`}
                    variant="ghost"
                    className="h-auto w-20 shrink-0 p-0"
                    aria-label={discoveryCopy.detail.thumbnail(nft.name, index)}
                    aria-pressed={imageSource === src}
                    onClick={() => setSelectedImage({ nftId: id, src })}
                  >
                    <NFTImage src={src} alt={nft.name} aspectRatio="square" />
                  </Button>
                ))}
              </div>
            </section>

            <section className="grid content-start gap-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {nft.edition.isOpen
                    ? discoveryCopy.detail.openEdition
                    : discoveryCopy.detail.edition(nft.edition.total)}
                </Badge>
                {nft.edition.available === 0 ? (
                  <Badge variant="outline">
                    {discoveryCopy.detail.soldOut}
                  </Badge>
                ) : null}
                <Badge variant="outline">{nft.network}</Badge>
              </div>

              <div className="grid gap-3">
                <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                  {nft.name}
                </h1>
                <RatingStars
                  rating={nft.rating}
                  reviewCount={nft.reviewCount}
                  ariaLabel={discoveryCopy.detail.reviewLabel(
                    nft.rating,
                    nft.reviewCount,
                  )}
                />
              </div>

              <p className="max-w-prose text-sm leading-7 text-text-secondary">
                {nft.description}
              </p>

              <div className="grid grid-cols-2 gap-3 rounded-card border border-border bg-surface p-4">
                <div className="grid gap-1">
                  <span className="text-xs text-text-secondary">
                    {discoveryCopy.detail.collection}
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {nft.collection}
                  </span>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-text-secondary">
                    {discoveryCopy.detail.tokenId}
                  </span>
                  <span className="break-all font-mono text-xs text-text-primary">
                    {nft.id}
                  </span>
                </div>
                <div className="col-span-2 grid gap-1">
                  <span className="text-xs text-text-secondary">
                    {discoveryCopy.detail.availability(nft.edition.available)}
                  </span>
                  <span className="text-sm text-text-primary">
                    {discoveryCopy.detail.network}: {nft.network}
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                <h2 className="font-display text-xl font-bold">
                  {discoveryCopy.detail.attributes}
                </h2>
                <dl
                  aria-label={discoveryCopy.accessibility.attributes(nft.name)}
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                >
                  {nft.attributes.map((attribute) => (
                    <div
                      key={`${attribute.traitType}-${attribute.value}`}
                      className="grid gap-1 rounded-card border border-border bg-surface p-3"
                    >
                      <dt className="text-xs text-text-secondary">
                        {attribute.traitType}
                      </dt>
                      <dd className="text-sm font-medium text-text-primary">
                        {attribute.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="fixed inset-x-0 bottom-0 z-20 grid gap-3 border-x-0 border-b-0 border-t border-border bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-lg md:static md:mt-2 md:rounded-card md:border md:bg-surface md:pb-4 md:shadow-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="grid gap-1">
                    <span className="text-xs text-text-secondary">
                      {discoveryCopy.detail.quantity}
                    </span>
                    <QuantityStepper
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
                  </div>
                  <div className="grid justify-items-end gap-1">
                    <span className="text-xs text-text-secondary">
                      {discoveryCopy.detail.price}
                    </span>
                    <PriceDisplay price={nft.priceString} className="text-xl" />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="outline"
                    aria-label={
                      favorite.isFavorite
                        ? discoveryCopy.detail.unfavorite
                        : discoveryCopy.detail.favorite
                    }
                    aria-pressed={favorite.isFavorite}
                    disabled={favorite.isPending}
                    onClick={() => favorite.toggle(!favorite.isFavorite)}
                    className="sm:flex-1"
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
                      ? discoveryCopy.detail.unfavorite
                      : discoveryCopy.detail.favorite}
                  </Button>
                  <Button
                    disabled={
                      nft.edition.available === 0 || addCartItem.isPending
                    }
                    onClick={handleAddToCart}
                    className="sm:flex-1"
                  >
                    {nft.edition.available === 0
                      ? discoveryCopy.detail.soldOut
                      : discoveryCopy.detail.purchase}
                  </Button>
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
              </div>
            </section>
          </div>

          <section className="mt-14 grid gap-5">
            <h2 className="font-display text-2xl font-bold">
              {discoveryCopy.detail.moreFromCollection}
            </h2>
            <div
              aria-label={discoveryCopy.accessibility.carousel(nft.collection)}
              className="flex gap-5 overflow-x-auto pb-4"
            >
              {relatedQuery.isPending
                ? Array.from({ length: 4 }, (_, index) => (
                    <Skeleton
                      key={index}
                      label={discoveryCopy.detail.loading}
                      className="aspect-square w-48 shrink-0 rounded-card sm:w-56"
                    />
                  ))
                : (relatedQuery.data ?? [])
                    .filter((relatedNft) => relatedNft.id !== nft.id)
                    .map((relatedNft) => (
                      <NFTCard
                        key={relatedNft.id}
                        nft={relatedNft}
                        className="w-48 shrink-0 sm:w-56"
                      />
                    ))}
            </div>
          </section>
        </main>
      ) : null}
    </div>
  )
}
