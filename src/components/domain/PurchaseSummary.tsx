import { PriceDisplay } from '@/components/domain/PriceDisplay'
import { cartCheckoutCopy } from '@/lib/cart-checkout-copy'

export interface PurchaseSummaryProps {
  subtotalString: string
  discountString?: string
  networkFeeString?: string
  totalString?: string
  couponCode?: string | null
  heading: string
  provisional?: boolean
}

export function PurchaseSummary({
  subtotalString,
  discountString,
  networkFeeString,
  totalString,
  couponCode,
  heading,
  provisional = false,
}: PurchaseSummaryProps) {
  return (
    <section className="grid gap-4 rounded-card border border-border bg-surface p-5">
      <h2 className="font-display text-xl font-bold">{heading}</h2>
      {couponCode ? (
        <p className="rounded-button bg-primary-soft px-3 py-2 text-sm text-text-primary">
          {couponCode}
        </p>
      ) : null}
      <dl className="grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-text-secondary">
            {cartCheckoutCopy.cart.subtotal}
          </dt>
          <dd>
            <PriceDisplay price={subtotalString} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-text-secondary">
            {cartCheckoutCopy.cart.discount}
          </dt>
          <dd>
            {discountString !== undefined ? (
              <PriceDisplay price={discountString} />
            ) : (
              <span className="text-text-secondary">—</span>
            )}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-text-secondary">
            {cartCheckoutCopy.cart.networkFee}
          </dt>
          <dd className="text-right">
            {networkFeeString !== undefined ? (
              <PriceDisplay price={networkFeeString} />
            ) : (
              <span className="text-xs text-text-secondary">
                {cartCheckoutCopy.cart.feeAtCheckout}
              </span>
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border pt-3 text-base font-semibold">
          <dt className="text-text-primary">{cartCheckoutCopy.cart.total}</dt>
          <dd>
            {totalString !== undefined ? (
              <PriceDisplay price={totalString} className="text-lg" />
            ) : (
              <span className="text-sm text-text-secondary">—</span>
            )}
          </dd>
        </div>
      </dl>
      {provisional ? (
        <p className="text-xs text-text-secondary">
          {cartCheckoutCopy.cart.quoteEstimate}
        </p>
      ) : null}
    </section>
  )
}
