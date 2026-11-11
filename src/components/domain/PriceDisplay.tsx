import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { formatEthPrice } from '@/lib/format-eth'

export interface PriceDisplayProps extends Omit<
  ComponentProps<'span'>,
  'children'
> {
  price: string
}

export function PriceDisplay({
  price,
  className,
  ...props
}: PriceDisplayProps) {
  return (
    <span
      className={cn('font-mono font-semibold text-primary', className)}
      {...props}
    >
      {formatEthPrice(price)}
    </span>
  )
}
