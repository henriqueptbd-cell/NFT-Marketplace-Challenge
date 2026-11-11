import { ExternalLink } from 'lucide-react'
import { NFTImage } from '@/components/domain/NFTImage'
import { PriceDisplay } from '@/components/domain/PriceDisplay'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import type { Network, Order, Wallet } from '@/api/types'
import { cartCheckoutCopy as copy } from '@/lib/cart-checkout-copy'
import { multiplyDecimalString } from '@/lib/decimal'

export interface OrderConfirmationDialogProps {
  open: boolean
  order: Order | null
  wallet?: Wallet
  onOpenChange: (open: boolean) => void
  onContinueShopping: () => void
}

const explorerBaseUrl: Record<Network, string> = {
  Ethereum: 'https://etherscan.io/tx/',
  Polygon: 'https://polygonscan.com/tx/',
  Solana: 'https://solscan.io/tx/',
}

export function OrderConfirmationDialog({
  open,
  order,
  wallet,
  onOpenChange,
  onContinueShopping,
}: OrderConfirmationDialogProps) {
  const explorerUrl =
    order?.transactionId && wallet
      ? `${explorerBaseUrl[wallet.network]}${encodeURIComponent(order.transactionId)}`
      : undefined

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={copy.checkout.confirmationTitle}
      description={copy.checkout.confirmationDescription}
      closeLabel={copy.checkout.closeConfirmation}
      className="max-w-2xl"
    >
      {order ? (
        <div className="grid gap-5">
          <dl className="grid gap-3 rounded-card border border-border bg-background p-4 text-sm sm:grid-cols-2">
            <div className="grid gap-1">
              <dt className="text-text-secondary">{copy.checkout.orderId}</dt>
              <dd className="break-all font-mono text-text-primary">
                {order.id}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-text-secondary">
                {copy.checkout.purchaseDate}
              </dt>
              <dd className="text-text-primary">
                {new Date(order.createdAt).toLocaleString('pt-BR')}
              </dd>
            </div>
            <div className="grid gap-1 sm:col-span-2">
              <dt className="text-text-secondary">
                {copy.checkout.walletAddress}
              </dt>
              <dd className="break-all font-mono text-xs text-text-primary">
                {order.snapshot.walletAddress}
              </dd>
            </div>
            {order.transactionId ? (
              <div className="grid gap-2 sm:col-span-2">
                <dt className="text-text-secondary">
                  {copy.checkout.transactionId}
                </dt>
                <dd className="flex flex-wrap items-center gap-2 break-all font-mono text-xs text-text-primary">
                  <span>{order.transactionId}</span>
                  {explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-sm text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {copy.checkout.viewExplorer}
                      <ExternalLink aria-hidden="true" className="size-3" />
                    </a>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>

          <ul className="grid max-h-56 gap-3 overflow-y-auto">
            {order.snapshot.items.map((item) => (
              <li
                key={item.nftId}
                className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-card border border-border bg-background p-3"
              >
                <NFTImage
                  src={item.image}
                  alt={copy.common.imageAlt(item.name)}
                  className="w-14"
                  aspectRatio="square"
                />
                <div className="grid min-w-0 gap-1">
                  <span className="truncate font-semibold text-text-primary">
                    {item.name}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {copy.cart.itemsLabel(item.quantity)}
                  </span>
                </div>
                <PriceDisplay
                  price={multiplyDecimalString(item.priceString, item.quantity)}
                  className="text-sm"
                />
              </li>
            ))}
          </ul>

          <dl className="grid gap-2 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-secondary">{copy.cart.subtotal}</dt>
              <dd>
                <PriceDisplay price={order.snapshot.subtotalString} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-secondary">{copy.cart.discount}</dt>
              <dd>
                <PriceDisplay price={order.snapshot.discountString} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-text-secondary">{copy.cart.networkFee}</dt>
              <dd>
                <PriceDisplay price={order.snapshot.networkFeeString} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-border pt-3 font-semibold">
              <dt className="text-text-primary">{copy.cart.total}</dt>
              <dd>
                <PriceDisplay
                  price={order.snapshot.totalString}
                  className="text-lg"
                />
              </dd>
            </div>
          </dl>

          <Button onClick={onContinueShopping} className="w-full">
            {copy.checkout.continueShopping}
          </Button>
        </div>
      ) : null}
    </Dialog>
  )
}
