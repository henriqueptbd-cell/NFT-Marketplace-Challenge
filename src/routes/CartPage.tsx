import { useMemo, useState, type FormEvent } from 'react'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { createQuote, getNft } from '@/api/endpoints'
import { EmptyState } from '@/components/domain/EmptyState'
import { ErrorState } from '@/components/domain/ErrorState'
import { MarketplaceHeader } from '@/components/domain/MarketplaceHeader'
import { CartLineItem } from '@/components/domain/CartLineItem'
import { PriceDisplay } from '@/components/domain/PriceDisplay'
import { PurchaseSummary } from '@/components/domain/PurchaseSummary'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useApplyCartCoupon,
  useCart,
  useRemoveCartCoupon,
  useRemoveCartItem,
  useSetCartItemQuantity,
  cartQuoteQueryKey,
} from '@/hooks/useCart'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { nftQueryKeys } from '@/hooks/useNfts'
import { apiErrorCode, apiErrorMessage, apiFieldErrors } from '@/lib/api-errors'
import { openAuthDialog } from '@/lib/auth-dialog'
import { cartCheckoutCopy as copy } from '@/lib/cart-checkout-copy'
import { addDecimalStrings, multiplyDecimalString } from '@/lib/decimal'

const couponFormSchema = z.object({
  code: z.string().trim().min(1, copy.cart.couponRequired),
})

function ErrorFallback({ error }: { error: unknown }) {
  return apiErrorMessage(error, copy.common.genericError)
}

function CartLoading() {
  return (
    <div className="grid gap-4" role="status" aria-label={copy.cart.loading}>
      {Array.from({ length: 2 }, (_, index) => (
        <div
          key={index}
          className="grid gap-4 rounded-card border border-border bg-surface p-4 sm:grid-cols-[6rem_minmax(0,1fr)]"
        >
          <Skeleton label={copy.cart.loading} className="aspect-square w-24" />
          <div className="grid content-center gap-3">
            <Skeleton label={copy.cart.loading} className="h-6 w-3/5" />
            <Skeleton label={copy.cart.loading} className="h-4 w-2/5" />
            <Skeleton label={copy.cart.loading} className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CartPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const cartQuery = useCart()
  const cart = cartQuery.data
  const currentUser = useCurrentUser()
  const quantityMutation = useSetCartItemQuantity()
  const removeMutation = useRemoveCartItem()
  const applyCouponMutation = useApplyCartCoupon()
  const removeCouponMutation = useRemoveCartCoupon()
  const [couponDraft, setCouponDraft] = useState<string | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponStatus, setCouponStatus] = useState('')
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({})

  const itemQueries = useQueries({
    queries: (cart?.items ?? []).map((item) => ({
      queryKey: nftQueryKeys.detail(item.nftId),
      queryFn: ({ signal }) => getNft(item.nftId, signal),
      staleTime: 30_000,
    })),
  })

  const subtotalString = useMemo(
    () =>
      (cart?.items ?? []).reduce(
        (total, item) =>
          addDecimalStrings(
            total,
            multiplyDecimalString(item.priceString, item.quantity),
          ),
        '0',
      ),
    [cart?.items],
  )

  const quoteQuery = useQuery({
    queryKey: [...cartQuoteQueryKey, cart?.id, cart?.version, null],
    queryFn: () => createQuote(),
    enabled: Boolean(cart && cart.items.length > 0),
    retry: false,
    staleTime: 4 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const couponValue = couponDraft ?? cart?.couponCode ?? ''

  function navigateHome(query = '') {
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

  function handleCouponSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCouponStatus('')
    const parsed = couponFormSchema.safeParse({ code: couponValue })
    if (!parsed.success) {
      setCouponError(parsed.error.issues[0]?.message ?? copy.cart.couponError)
      return
    }
    setCouponError('')
    applyCouponMutation.mutate(parsed.data.code, {
      onSuccess: () => {
        setCouponStatus(copy.cart.couponApplied)
        void queryClient.invalidateQueries({ queryKey: cartQuoteQueryKey })
      },
      onError: (error) => {
        const fieldErrors = apiFieldErrors(error)
        const code = apiErrorCode(error)
        setCouponError(
          fieldErrors.code ??
            (code === 'COUPON_EXPIRED'
              ? copy.cart.couponExpired
              : code === 'COUPON_INVALID'
                ? copy.cart.couponInvalid
                : apiErrorMessage(error, copy.cart.couponError)),
        )
      },
    })
  }

  function refreshQuote() {
    void queryClient.invalidateQueries({ queryKey: cartQuoteQueryKey })
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
    for (const item of cart?.items ?? []) {
      void queryClient.invalidateQueries({
        queryKey: nftQueryKeys.detail(item.nftId),
      })
    }
  }

  function proceedToCheckout() {
    if (!currentUser) {
      openAuthDialog({ mode: 'login', redirect: '/checkout' })
      return
    }
    void navigate({ to: '/checkout' })
  }

  const quoteErrorCode = apiErrorCode(quoteQuery.error)
  const hasInvalidLine = (cart?.items ?? []).some((item, index) => {
    const nft = itemQueries[index]?.data
    return Boolean(
      nft &&
      (item.priceString !== nft.priceString ||
        (!nft.edition.isOpen && item.quantity > nft.edition.available)),
    )
  })
  const canProceed = Boolean(
    cart &&
    cart.items.length > 0 &&
    !hasInvalidLine &&
    (!currentUser || (quoteQuery.data && !quoteQuery.isError)),
  )

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <MarketplaceHeader onSearchSubmit={navigateHome} />
      <main className="page-shell pb-36 pt-6 sm:pb-16 lg:pt-10">
        <div className="grid gap-5">
          <Breadcrumb
            ariaLabel={copy.cart.breadcrumb}
            items={[
              { label: copy.common.home, href: '/' },
              { label: copy.common.cart },
            ]}
          />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">
              {copy.cart.title}
            </h1>
            {cart ? (
              <p className="text-sm text-text-secondary" aria-live="polite">
                {copy.cart.itemsLabel(
                  cart.items.reduce((count, item) => count + item.quantity, 0),
                )}
              </p>
            ) : null}
          </div>

          {cartQuery.isPending && !cart ? (
            <CartLoading />
          ) : cartQuery.isError && !cart ? (
            <ErrorState
              title={copy.cart.errorTitle}
              message={ErrorFallback({ error: cartQuery.error })}
              retryLabel={copy.common.retry}
              onRetry={() => void cartQuery.refetch()}
            />
          ) : cart && cart.items.length === 0 ? (
            <EmptyState
              title={copy.cart.emptyTitle}
              description={copy.cart.emptyDescription}
              actionLabel={copy.cart.continueShopping}
              onAction={() => navigateHome()}
            />
          ) : cart ? (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
              <section
                aria-label={copy.cart.title}
                className="grid min-w-0 gap-4"
                aria-busy={cartQuery.isFetching}
              >
                {cartQuery.isFetching ? (
                  <span role="status" className="sr-only">
                    {copy.common.loading}
                  </span>
                ) : null}
                {cart.items.map((item, index) => {
                  const nftQuery = itemQueries[index]
                  const nft = nftQuery?.data
                  const priceChanged = Boolean(
                    nft && item.priceString !== nft.priceString,
                  )
                  const soldOut = Boolean(
                    nft &&
                    !nft.edition.isOpen &&
                    item.quantity > nft.edition.available,
                  )
                  const linePending =
                    (quantityMutation.isPending &&
                      quantityMutation.variables?.nftId === item.nftId) ||
                    (removeMutation.isPending &&
                      removeMutation.variables === item.nftId)
                  return (
                    <CartLineItem
                      key={item.nftId}
                      item={item}
                      nft={nft}
                      loading={nftQuery?.isPending}
                      error={
                        lineErrors[item.nftId] ??
                        (nftQuery?.isError
                          ? apiErrorMessage(
                              nftQuery.error,
                              copy.common.genericError,
                            )
                          : undefined)
                      }
                      priceChanged={priceChanged}
                      soldOut={soldOut}
                      updating={linePending}
                      onQuantityChange={(quantity) => {
                        setLineErrors((current) => ({
                          ...current,
                          [item.nftId]: '',
                        }))
                        quantityMutation.mutate(
                          { nftId: item.nftId, quantity },
                          {
                            onError: (error) => {
                              const message =
                                apiErrorCode(error) === 'EDITION_SOLD_OUT'
                                  ? copy.cart.soldOut
                                  : apiErrorMessage(
                                      error,
                                      copy.cart.updateError,
                                    )
                              setLineErrors((current) => ({
                                ...current,
                                [item.nftId]: message,
                              }))
                            },
                          },
                        )
                      }}
                      onRemove={() =>
                        removeMutation.mutate(item.nftId, {
                          onError: (error) =>
                            setLineErrors((current) => ({
                              ...current,
                              [item.nftId]: apiErrorMessage(
                                error,
                                copy.cart.removeError,
                              ),
                            })),
                        })
                      }
                      onRefreshPrice={() =>
                        quantityMutation.mutate(
                          { nftId: item.nftId, quantity: item.quantity },
                          {
                            onSuccess: () =>
                              setLineErrors((current) => ({
                                ...current,
                                [item.nftId]: '',
                              })),
                            onError: (error) => {
                              const message =
                                apiErrorCode(error) === 'EDITION_SOLD_OUT'
                                  ? copy.cart.soldOut
                                  : apiErrorMessage(
                                      error,
                                      copy.cart.updateError,
                                    )
                              setLineErrors((current) => ({
                                ...current,
                                [item.nftId]: message,
                              }))
                            },
                          },
                        )
                      }
                    />
                  )
                })}
                {quoteQuery.isError ? (
                  <div
                    role="alert"
                    className="grid gap-3 rounded-card border border-border bg-surface p-4"
                  >
                    <p className="text-sm text-text-secondary">
                      {quoteErrorCode === 'PRICE_CHANGED'
                        ? copy.checkout.priceChanged
                        : quoteErrorCode === 'EDITION_SOLD_OUT'
                          ? copy.checkout.soldOut
                          : quoteErrorCode === 'COUPON_EXPIRED'
                            ? copy.checkout.couponExpired
                            : apiErrorMessage(
                                quoteQuery.error,
                                copy.checkout.quoteError,
                              )}
                    </p>
                    <Button variant="outline" onClick={refreshQuote}>
                      {copy.checkout.quoteRetry}
                    </Button>
                  </div>
                ) : null}
              </section>

              <aside className="grid gap-4 lg:sticky lg:top-32">
                <form
                  className="grid gap-3 rounded-card border border-border bg-surface p-5"
                  noValidate
                  onSubmit={handleCouponSubmit}
                >
                  <Label htmlFor="cart-coupon">{copy.cart.couponLabel}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cart-coupon"
                      value={couponValue}
                      placeholder={copy.cart.couponPlaceholder}
                      aria-describedby={
                        couponError ? 'cart-coupon-error' : undefined
                      }
                      aria-invalid={Boolean(couponError)}
                      disabled={applyCouponMutation.isPending}
                      onChange={(event) => {
                        setCouponDraft(event.target.value)
                        setCouponError('')
                        setCouponStatus('')
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={applyCouponMutation.isPending}
                    >
                      {applyCouponMutation.isPending
                        ? copy.cart.couponApplying
                        : copy.cart.couponApply}
                    </Button>
                  </div>
                  {couponError ? (
                    <p
                      id="cart-coupon-error"
                      role="alert"
                      className="text-xs text-primary"
                    >
                      {couponError}
                    </p>
                  ) : null}
                  {couponStatus ? (
                    <p role="status" className="text-xs text-text-secondary">
                      {couponStatus}
                    </p>
                  ) : null}
                  {cart.couponCode ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={removeCouponMutation.isPending}
                      onClick={() => {
                        removeCouponMutation.mutate(undefined, {
                          onSuccess: () => {
                            setCouponDraft('')
                            setCouponError('')
                            void queryClient.invalidateQueries({
                              queryKey: cartQuoteQueryKey,
                            })
                          },
                          onError: (error) =>
                            setCouponError(
                              apiErrorMessage(error, copy.cart.couponError),
                            ),
                        })
                      }}
                    >
                      {copy.cart.couponRemove}
                    </Button>
                  ) : null}
                </form>

                <PurchaseSummary
                  heading={copy.checkout.itemsTitle}
                  subtotalString={
                    quoteQuery.data?.subtotalString ?? subtotalString
                  }
                  discountString={quoteQuery.data?.discountString}
                  networkFeeString={quoteQuery.data?.networkFeeString}
                  totalString={quoteQuery.data?.totalString}
                  couponCode={cart.couponCode}
                  provisional={!quoteQuery.data}
                />
                {!currentUser ? (
                  <p className="text-xs text-text-secondary">
                    {copy.cart.checkoutHint}
                  </p>
                ) : null}
                {removeMutation.isError || quantityMutation.isError ? (
                  <p role="alert" className="text-sm text-primary">
                    {apiErrorMessage(
                      removeMutation.error ?? quantityMutation.error,
                      copy.common.genericError,
                    )}
                  </p>
                ) : null}
                <div className="hidden gap-3 lg:grid">
                  <Button disabled={!canProceed} onClick={proceedToCheckout}>
                    {currentUser
                      ? copy.cart.checkout
                      : copy.cart.connectCheckout}
                  </Button>
                  <Button variant="outline" onClick={() => navigateHome()}>
                    {copy.cart.continueShopping}
                  </Button>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </main>

      {cart && cart.items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-20 grid gap-2 border-t border-border bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden">
          {quoteQuery.data ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-text-secondary">
                {copy.cart.total}
              </span>
              <PriceDisplay
                price={quoteQuery.data.totalString}
                className="text-lg"
              />
            </div>
          ) : null}
          <Button disabled={!canProceed} onClick={proceedToCheckout}>
            {currentUser ? copy.cart.checkout : copy.cart.connectCheckout}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
