import { NFTImage } from '@/components/domain/NFTImage'
import { PriceDisplay } from '@/components/domain/PriceDisplay'
import { QuantityStepper } from '@/components/domain/QuantityStepper'
import { Button } from '@/components/ui/button'
import type { CartItem, NFT } from '@/api/types'
import { cartCheckoutCopy } from '@/lib/cart-checkout-copy'
import { multiplyDecimalString } from '@/lib/decimal'

export interface CartLineItemProps {
  item: CartItem
  nft?: NFT
  loading?: boolean
  error?: string
  priceChanged?: boolean
  soldOut?: boolean
  updating?: boolean
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  onRefreshPrice: () => void
}

export function CartLineItem({
  item,
  nft,
  loading = false,
  error,
  priceChanged = false,
  soldOut = false,
  updating = false,
  onQuantityChange,
  onRemove,
  onRefreshPrice,
}: CartLineItemProps) {
  const title = nft?.name ?? cartCheckoutCopy.common.unavailableItem(item.nftId)
  const unitPrice = item.priceString
  const lineTotal = multiplyDecimalString(unitPrice, item.quantity)
  const maxQuantity = nft
    ? nft.edition.isOpen
      ? Number.MAX_SAFE_INTEGER
      : Math.max(1, nft.edition.available)
    : item.quantity
  const errorId = `cart-line-error-${item.nftId}`
  const priceChangedId = `cart-line-price-${item.nftId}`
  const soldOutId = `cart-line-stock-${item.nftId}`
  const stepperDescribedBy = [
    error ? errorId : undefined,
    priceChanged ? priceChangedId : undefined,
    soldOut ? soldOutId : undefined,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className="grid gap-4 rounded-card border border-border bg-surface p-4 sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-center sm:p-5">
      <NFTImage
        src={nft?.image ?? ''}
        alt={cartCheckoutCopy.common.imageAlt(title)}
        className="w-24 sm:w-24"
        aspectRatio="square"
      />
      <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="grid min-w-0 gap-2">
          <h2 className="break-words font-display text-lg font-bold text-text-primary">
            {title}
          </h2>
          <p className="break-all font-mono text-xs text-text-secondary">
            {cartCheckoutCopy.cart.tokenId(item.nftId)}
          </p>
          {nft ? (
            <p className="text-xs text-text-secondary">
              {nft.edition.isOpen
                ? cartCheckoutCopy.cart.openEdition
                : cartCheckoutCopy.cart.edition(
                    nft.edition.available,
                    nft.edition.total,
                  )}
            </p>
          ) : null}
          <p className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            <span>{cartCheckoutCopy.cart.unitPrice}</span>
            <PriceDisplay price={unitPrice} className="text-xs" />
          </p>
          {loading ? (
            <p role="status" className="text-xs text-text-secondary">
              {cartCheckoutCopy.common.loading}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-xs text-primary">
              <span id={errorId}>{error}</span>
            </p>
          ) : null}
          {priceChanged ? (
            <div className="flex flex-wrap items-center gap-2">
              <p role="alert" className="text-xs text-primary">
                <span id={priceChangedId}>
                  {cartCheckoutCopy.cart.priceChanged}
                </span>
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={updating}
                onClick={onRefreshPrice}
              >
                {cartCheckoutCopy.cart.refreshPrice}
              </Button>
            </div>
          ) : null}
          {soldOut ? (
            <p role="alert" className="text-xs text-primary">
              <span id={soldOutId}>{cartCheckoutCopy.cart.soldOut}</span>
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 sm:justify-items-end">
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <div className="grid gap-1 sm:justify-items-end">
              <span className="text-xs text-text-secondary">
                {cartCheckoutCopy.cart.lineTotal}
              </span>
              <PriceDisplay price={lineTotal} className="text-lg" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label={cartCheckoutCopy.cart.removeItem(title)}
              disabled={updating}
              onClick={onRemove}
            >
              {cartCheckoutCopy.common.remove}
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-xs text-text-secondary">
              {cartCheckoutCopy.cart.quantity}
            </span>
            <QuantityStepper
              value={item.quantity}
              min={1}
              max={maxQuantity}
              labels={{
                decrease: cartCheckoutCopy.cart.decreaseQuantity,
                increase: cartCheckoutCopy.cart.increaseQuantity,
                current: cartCheckoutCopy.cart.quantityCurrent,
              }}
              describedBy={stepperDescribedBy || undefined}
              disabled={updating || loading}
              onChange={onQuantityChange}
            />
          </div>
        </div>
      </div>
    </article>
  )
}
