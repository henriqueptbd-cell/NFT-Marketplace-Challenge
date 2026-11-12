import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { createRealtimeClient, type VersionedPayload } from '@/api/realtime'
import {
  confirmOrder,
  createOrder,
  createQuote,
  getNft,
  getProfile,
  getWallets,
} from '@/api/endpoints'
import type { NFT, Order, Wallet } from '@/api/types'
import { EmptyState } from '@/components/domain/EmptyState'
import { ErrorState } from '@/components/domain/ErrorState'
import { MarketplaceHeader } from '@/components/domain/MarketplaceHeader'
import { NFTImage } from '@/components/domain/NFTImage'
import { OrderConfirmationDialog } from '@/components/domain/OrderConfirmationDialog'
import { PriceDisplay } from '@/components/domain/PriceDisplay'
import { PurchaseSummary } from '@/components/domain/PurchaseSummary'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { RadioGroup } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCart,
  useRemoveCartCoupon,
  cartQuoteQueryKey,
} from '@/hooks/useCart'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { nftQueryKeys } from '@/hooks/useNfts'
import { apiErrorCode, apiErrorMessage } from '@/lib/api-errors'
import {
  clearCheckoutAttempt,
  readCheckoutAttempt,
  saveCheckoutAttempt,
  type CheckoutAttempt,
} from '@/lib/checkout-attempt'
import { openAuthDialog } from '@/lib/auth-dialog'
import { cartCheckoutCopy as copy } from '@/lib/cart-checkout-copy'
import { addDecimalStrings, multiplyDecimalString } from '@/lib/decimal'

function CheckoutLoading() {
  return (
    <div
      role="status"
      aria-label={copy.checkout.loading}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <div className="grid gap-5">
        <Skeleton label={copy.checkout.loading} className="h-32 w-full" />
        <Skeleton label={copy.checkout.loading} className="h-52 w-full" />
        <Skeleton label={copy.checkout.loading} className="h-44 w-full" />
      </div>
      <Skeleton label={copy.checkout.loading} className="h-80 w-full" />
    </div>
  )
}

function formatQuoteExpiry(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useCurrentUser()
  const cartQuery = useCart()
  const cart = cartQuery.data
  const storedAttempt = useMemo(() => readCheckoutAttempt(), [])
  const [attempt, setAttempt] = useState<CheckoutAttempt | null>(storedAttempt)
  const [selectedWalletId, setSelectedWalletId] = useState(
    storedAttempt?.walletId ?? '',
  )
  const [orderError, setOrderError] = useState('')
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [expiredQuoteId, setExpiredQuoteId] = useState<string | null>(null)
  const lastNftVersions = useRef(new Map<string, number>())
  const lastOrderVersions = useRef(new Map<string, number>())
  const hasConnected = useRef(false)
  const socket = useMemo(() => createRealtimeClient(), [])

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    enabled: Boolean(currentUser),
    retry: false,
  })
  const walletsQuery = useQuery({
    queryKey: ['wallets'],
    queryFn: getWallets,
    enabled: Boolean(currentUser),
    retry: false,
  })
  const wallets = useMemo(() => walletsQuery.data ?? [], [walletsQuery.data])
  const userAttempt =
    currentUser && attempt?.userId === currentUser.id ? attempt : null
  const defaultWallet = wallets.find((wallet) => wallet.isPrimary) ?? wallets[0]
  const effectiveWalletId =
    userAttempt?.walletId ??
    (wallets.some((wallet) => wallet.id === selectedWalletId)
      ? selectedWalletId
      : (defaultWallet?.id ?? ''))
  const selectedWallet = wallets.find(
    (wallet) => wallet.id === effectiveWalletId,
  )

  const itemQueries = useQueries({
    queries: (cart?.items ?? []).map((item) => ({
      queryKey: nftQueryKeys.detail(item.nftId),
      queryFn: ({ signal }) => getNft(item.nftId, signal),
      staleTime: 30_000,
    })),
  })

  const quoteQuery = useQuery({
    queryKey: [
      ...cartQuoteQueryKey,
      cart?.id,
      cart?.version,
      effectiveWalletId,
    ],
    queryFn: () => createQuote({ walletId: effectiveWalletId }),
    enabled: Boolean(
      currentUser && cart && cart.items.length > 0 && effectiveWalletId,
    ),
    retry: false,
    staleTime: 4 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const removeCoupon = useRemoveCartCoupon()

  const orderMutation = useMutation({
    mutationFn: async (checkoutAttempt: CheckoutAttempt) => {
      const created = await createOrder(
        {
          quoteId: checkoutAttempt.quoteId,
          walletId: checkoutAttempt.walletId,
        },
        checkoutAttempt.idempotencyKey,
      )
      setActiveOrderId(created.id)
      socket.emit('order.subscribe', created.id)
      return created.status === 'pending' ? confirmOrder(created.id) : created
    },
    onSuccess: (order) => {
      setOrderError('')
      if (order.status === 'pending') {
        setOrderError(copy.checkout.orderPending)
        return
      }
      clearCheckoutAttempt()
      setAttempt(null)
      setActiveOrderId(order.id)
      if (order.status === 'confirmed') setCompletedOrder(order)
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: nftQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (error) => {
      const code = apiErrorCode(error)
      setOrderError(
        code === 'PRICE_CHANGED'
          ? copy.checkout.priceChanged
          : code === 'EDITION_SOLD_OUT'
            ? copy.checkout.soldOut
            : code === 'COUPON_EXPIRED'
              ? copy.checkout.couponExpired
              : code === 'QUOTE_EXPIRED'
                ? copy.checkout.quoteExpired
                : code === 'TIMEOUT_AFTER_CREATE'
                  ? copy.checkout.orderError
                  : apiErrorMessage(error, copy.checkout.orderError),
      )
      if (
        code === 'PRICE_CHANGED' ||
        code === 'EDITION_SOLD_OUT' ||
        code === 'COUPON_EXPIRED' ||
        code === 'QUOTE_EXPIRED'
      ) {
        clearCheckoutAttempt()
        setAttempt(null)
        void queryClient.invalidateQueries({ queryKey: ['cart'] })
        void queryClient.invalidateQueries({ queryKey: nftQueryKeys.all })
        void queryClient.invalidateQueries({ queryKey: cartQuoteQueryKey })
      }
    },
  })

  const nftIds = useMemo(
    () => (cart?.items ?? []).map((item) => item.nftId),
    [cart?.items],
  )

  useEffect(() => {
    if (!currentUser) return

    const onConnect = () => {
      if (hasConnected.current) {
        void queryClient.invalidateQueries({ queryKey: ['cart'] })
        void queryClient.invalidateQueries({ queryKey: ['profile'] })
        void queryClient.invalidateQueries({ queryKey: ['wallets'] })
        void queryClient.invalidateQueries({ queryKey: cartQuoteQueryKey })
      }
      hasConnected.current = true
      for (const nftId of nftIds) socket.emit('nft.subscribe', nftId)
      if (activeOrderId) socket.emit('order.subscribe', activeOrderId)
    }
    const onNftUpdated = (payload: VersionedPayload<NFT>) => {
      const previousVersion = lastNftVersions.current.get(payload.id) ?? -1
      if (payload.version <= previousVersion) return
      lastNftVersions.current.set(payload.id, payload.version)
      queryClient.setQueryData(nftQueryKeys.detail(payload.id), payload.data)
      void queryClient.invalidateQueries({ queryKey: ['cart'] })
      void queryClient.invalidateQueries({ queryKey: cartQuoteQueryKey })
      void queryClient.invalidateQueries({ queryKey: nftQueryKeys.all })
    }
    const onOrderUpdated = (payload: VersionedPayload<Order>) => {
      const previousVersion = lastOrderVersions.current.get(payload.id) ?? -1
      if (payload.version <= previousVersion) return
      lastOrderVersions.current.set(payload.id, payload.version)
      queryClient.setQueryData(['orders', payload.id], payload.data)
      if (payload.id === activeOrderId && payload.data.status === 'confirmed') {
        setCompletedOrder(payload.data)
      }
    }

    socket.on('connect', onConnect)
    socket.on('nft.updated', onNftUpdated)
    socket.on('order.updated', onOrderUpdated)
    socket.connect()
    if (socket.connected) onConnect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('nft.updated', onNftUpdated)
      socket.off('order.updated', onOrderUpdated)
    }
  }, [activeOrderId, currentUser, nftIds, queryClient, socket])

  useEffect(() => {
    if (!currentUser) {
      openAuthDialog({ mode: 'login', redirect: '/checkout' })
      return
    }
    if (attempt && attempt.userId !== currentUser.id) {
      clearCheckoutAttempt()
    }
  }, [attempt, currentUser])

  const quoteId = quoteQuery.data?.id
  const quoteExpiresAt = quoteQuery.data?.expiresAt
  useEffect(() => {
    if (!quoteId || !quoteExpiresAt) return
    const remaining = Math.max(
      0,
      new Date(quoteExpiresAt).getTime() - Date.now(),
    )
    const timer = window.setTimeout(() => setExpiredQuoteId(quoteId), remaining)
    return () => window.clearTimeout(timer)
  }, [quoteExpiresAt, quoteId])

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

  function refreshQuote() {
    setOrderError('')
    void queryClient.invalidateQueries({ queryKey: ['cart'] })
    void queryClient.invalidateQueries({ queryKey: cartQuoteQueryKey })
    for (const nftId of nftIds) {
      void queryClient.invalidateQueries({
        queryKey: nftQueryKeys.detail(nftId),
      })
    }
  }

  function submitOrder() {
    setOrderError('')
    if (userAttempt) {
      orderMutation.mutate(userAttempt)
      return
    }
    if (!currentUser || !selectedWallet || !quoteQuery.data) return
    const nextAttempt: CheckoutAttempt = {
      userId: currentUser.id,
      quoteId: quoteQuery.data.id,
      walletId: selectedWallet.id,
      idempotencyKey: crypto.randomUUID(),
    }
    if (!userAttempt) {
      saveCheckoutAttempt(nextAttempt)
      setAttempt(nextAttempt)
    }
    orderMutation.mutate(nextAttempt)
  }

  function removeExpiredCoupon() {
    removeCoupon.mutate(undefined, {
      onSuccess: () => {
        setOrderError('')
        void queryClient.invalidateQueries({ queryKey: cartQuoteQueryKey })
      },
      onError: (error) =>
        setOrderError(apiErrorMessage(error, copy.common.genericError)),
    })
  }

  const quoteErrorCode = apiErrorCode(quoteQuery.error)
  const quoteExpired = Boolean(
    quoteQuery.data && expiredQuoteId === quoteQuery.data.id,
  )
  const hasInvalidItem = (cart?.items ?? []).some((item, index) => {
    const nft = itemQueries[index]?.data
    return Boolean(
      nft &&
      (item.priceString !== nft.priceString ||
        (!nft.edition.isOpen && item.quantity > nft.edition.available)),
    )
  })
  const canSubmit = Boolean(
    userAttempt ||
    (currentUser &&
      selectedWallet &&
      cart &&
      cart.items.length > 0 &&
      quoteQuery.data &&
      !quoteQuery.isError &&
      !quoteExpired &&
      !hasInvalidItem),
  )
  const loadError = cartQuery.error ?? profileQuery.error ?? walletsQuery.error
  const hasLoadError =
    cartQuery.isError || profileQuery.isError || walletsQuery.isError
  const walletOptions = wallets.map((wallet: Wallet) => ({
    value: wallet.id,
    label: [
      wallet.nickname,
      copy.checkout.walletNetwork(wallet.network),
      wallet.isPrimary ? copy.checkout.walletPrimary : undefined,
      `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`,
    ]
      .filter(Boolean)
      .join(' · '),
  }))
  const quoteItems = quoteQuery.data?.items
  const provisionalSubtotal = (cart?.items ?? []).reduce(
    (subtotal, item) =>
      addDecimalStrings(
        subtotal,
        multiplyDecimalString(item.priceString, item.quantity),
      ),
    '0',
  )
  const cartItemView = (cart?.items ?? []).map((cartItem, index) => {
    const nft = itemQueries[index]?.data
    const quoteItem = quoteItems?.find((item) => item.nftId === cartItem.nftId)
    return {
      id: cartItem.nftId,
      name:
        quoteItem?.name ??
        nft?.name ??
        copy.common.unavailableItem(cartItem.nftId),
      image: quoteItem?.image ?? nft?.image ?? '',
      quantity: quoteItem?.quantity ?? cartItem.quantity,
      priceString:
        quoteItem?.priceString ?? nft?.priceString ?? cartItem.priceString,
    }
  })

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <MarketplaceHeader onSearchSubmit={navigateHome} />
      <main className="page-shell pb-36 pt-6 sm:pb-16 lg:pt-10">
        <div className="grid gap-5">
          <Breadcrumb
            ariaLabel={copy.checkout.breadcrumb}
            items={[
              { label: copy.common.home, href: '/' },
              { label: copy.common.cart, href: '/cart' },
              { label: copy.common.checkout },
            ]}
          />
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            {copy.checkout.title}
          </h1>

          {!currentUser ? (
            <EmptyState
              title={copy.checkout.authRequiredTitle}
              description={copy.checkout.authRequiredDescription}
              actionLabel={copy.checkout.authRequired}
              onAction={() =>
                openAuthDialog({ mode: 'login', redirect: '/checkout' })
              }
            />
          ) : (cartQuery.isPending && !cart) ||
            profileQuery.isPending ||
            walletsQuery.isPending ? (
            <CheckoutLoading />
          ) : hasLoadError ? (
            <ErrorState
              title={copy.checkout.errorTitle}
              message={apiErrorMessage(loadError, copy.common.genericError)}
              retryLabel={copy.common.retry}
              onRetry={() => {
                void cartQuery.refetch()
                void profileQuery.refetch()
                void walletsQuery.refetch()
              }}
            />
          ) : cart && cart.items.length === 0 ? (
            <EmptyState
              title={copy.checkout.emptyTitle}
              description={copy.checkout.emptyDescription}
              actionLabel={copy.common.backToMarket}
              onAction={() => navigateHome()}
            />
          ) : wallets.length === 0 ? (
            <EmptyState
              title={copy.checkout.noWalletTitle}
              description={copy.checkout.noWalletDescription}
              actionLabel={copy.checkout.manageWallets}
              onAction={() => void navigate({ to: '/wallets' })}
            />
          ) : cart ? (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
              <div className="grid min-w-0 gap-5">
                <section className="grid gap-3 rounded-card border border-border bg-surface p-5">
                  <h2 className="font-display text-xl font-bold">
                    {copy.checkout.collectorTitle}
                  </h2>
                  <p className="font-semibold text-text-primary">
                    {profileQuery.data?.displayName ?? currentUser.displayName}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {profileQuery.data?.email ?? currentUser.email}
                  </p>
                  {profileQuery.data?.ens ? (
                    <p className="font-mono text-sm text-text-secondary">
                      {profileQuery.data.ens}
                    </p>
                  ) : null}
                </section>

                <section className="grid gap-4 rounded-card border border-border bg-surface p-5">
                  <h2 className="font-display text-xl font-bold">
                    {copy.checkout.walletTitle}
                  </h2>
                  <RadioGroup
                    id="checkout-wallet"
                    ariaLabel={copy.checkout.walletTitle}
                    options={walletOptions}
                    value={effectiveWalletId}
                    onValueChange={setSelectedWalletId}
                    disabled={Boolean(userAttempt || orderMutation.isPending)}
                    className="gap-3"
                  />
                </section>

                <section className="grid gap-3 rounded-card border border-border bg-surface p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-xl font-bold">
                      {copy.checkout.itemsTitle}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void navigate({ to: '/cart' })}
                    >
                      {copy.checkout.reviewCart}
                    </Button>
                  </div>
                  <ul className="grid gap-3">
                    {cartItemView.map((item, index) => (
                      <li
                        key={item.id}
                        className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-3 rounded-card border border-border bg-background p-3"
                      >
                        <NFTImage
                          src={item.image}
                          alt={copy.common.imageAlt(item.name)}
                          className="w-16"
                          aspectRatio="square"
                        />
                        <div className="grid min-w-0 gap-1">
                          <span className="truncate font-semibold">
                            {item.name}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {copy.cart.itemsLabel(item.quantity)}
                          </span>
                          <span className="flex flex-wrap items-center gap-1 text-xs text-text-secondary">
                            {copy.cart.unitPrice}
                            <PriceDisplay
                              price={item.priceString}
                              className="text-xs"
                            />
                          </span>
                          {itemQueries[index]?.isPending ? (
                            <span
                              role="status"
                              className="text-xs text-text-secondary"
                            >
                              {copy.common.loading}
                            </span>
                          ) : null}
                        </div>
                        <PriceDisplay
                          price={multiplyDecimalString(
                            item.priceString,
                            item.quantity,
                          )}
                          className="text-sm"
                        />
                      </li>
                    ))}
                  </ul>
                  {cart.couponCode ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-button bg-primary-soft px-3 py-2 text-sm">
                      <span>{cart.couponCode}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removeCoupon.isPending}
                        onClick={removeExpiredCoupon}
                      >
                        {copy.checkout.removeCoupon}
                      </Button>
                    </div>
                  ) : null}
                </section>
              </div>

              <aside className="grid gap-4 lg:sticky lg:top-32">
                <PurchaseSummary
                  heading={copy.checkout.itemsTitle}
                  subtotalString={
                    quoteQuery.data?.subtotalString ?? provisionalSubtotal
                  }
                  discountString={quoteQuery.data?.discountString}
                  networkFeeString={quoteQuery.data?.networkFeeString}
                  totalString={quoteQuery.data?.totalString}
                  couponCode={quoteQuery.data?.couponCode}
                  provisional={quoteQuery.isPending}
                />
                {quoteQuery.isPending ? (
                  <p role="status" className="text-xs text-text-secondary">
                    {copy.checkout.quoteLoading}
                  </p>
                ) : null}
                {quoteQuery.data ? (
                  <p className="text-xs text-text-secondary">
                    {copy.checkout.quoteExpires(
                      formatQuoteExpiry(quoteQuery.data.expiresAt),
                    )}
                  </p>
                ) : null}
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
                    {quoteErrorCode === 'COUPON_EXPIRED' ? (
                      <Button
                        variant="outline"
                        disabled={removeCoupon.isPending}
                        onClick={removeExpiredCoupon}
                      >
                        {copy.checkout.removeCoupon}
                      </Button>
                    ) : quoteErrorCode === 'EDITION_SOLD_OUT' ? (
                      <Button
                        variant="outline"
                        onClick={() => void navigate({ to: '/cart' })}
                      >
                        {copy.checkout.reviewCart}
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={refreshQuote}>
                        {copy.checkout.quoteRetry}
                      </Button>
                    )}
                  </div>
                ) : null}
                {orderError ? (
                  <div
                    role="alert"
                    className="grid gap-3 rounded-card border border-border bg-surface p-4"
                  >
                    <p className="text-sm text-text-secondary">{orderError}</p>
                    {apiErrorCode(orderMutation.error) ===
                    'EDITION_SOLD_OUT' ? (
                      <Button
                        variant="outline"
                        onClick={() => void navigate({ to: '/cart' })}
                      >
                        {copy.checkout.reviewCart}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {orderMutation.data?.status === 'declined' ? (
                  <p role="alert" className="text-sm text-primary">
                    {copy.checkout.paymentDeclined}
                  </p>
                ) : null}
                {quoteExpired ? (
                  <div
                    role="alert"
                    className="grid gap-3 rounded-card border border-border bg-surface p-4"
                  >
                    <p className="text-sm text-text-secondary">
                      {copy.checkout.quoteExpired}
                    </p>
                    <Button variant="outline" onClick={refreshQuote}>
                      {copy.checkout.quoteRetry}
                    </Button>
                  </div>
                ) : null}
                <div className="hidden gap-3 lg:grid">
                  <Button
                    disabled={!canSubmit || orderMutation.isPending}
                    onClick={submitOrder}
                  >
                    {orderMutation.isPending
                      ? copy.checkout.confirming
                      : userAttempt
                        ? copy.checkout.retrySameAttempt
                        : orderMutation.data?.status === 'declined'
                          ? copy.checkout.retryPayment
                          : copy.checkout.confirm}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void navigate({ to: '/cart' })}
                  >
                    {copy.checkout.reviewCart}
                  </Button>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </main>

      {currentUser && cart && cart.items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-20 grid gap-2 border-t border-border bg-background p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden">
          {quoteQuery.data ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-text-secondary">
                {copy.cart.total}
              </span>
              <PriceDisplay price={quoteQuery.data.totalString} />
            </div>
          ) : null}
          <Button
            disabled={!canSubmit || orderMutation.isPending}
            onClick={submitOrder}
          >
            {orderMutation.isPending
              ? copy.checkout.confirming
              : userAttempt
                ? copy.checkout.retrySameAttempt
                : orderMutation.data?.status === 'declined'
                  ? copy.checkout.retryPayment
                  : copy.checkout.confirm}
          </Button>
        </div>
      ) : null}

      <OrderConfirmationDialog
        open={Boolean(completedOrder)}
        order={completedOrder}
        wallet={selectedWallet}
        onOpenChange={(open) => {
          if (!open) setCompletedOrder(null)
        }}
        onContinueShopping={() => {
          setCompletedOrder(null)
          navigateHome()
        }}
      />
    </div>
  )
}
