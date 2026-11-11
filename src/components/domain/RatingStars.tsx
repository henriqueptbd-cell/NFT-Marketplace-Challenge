import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface RatingStarsProps {
  rating: number
  reviewCount: number
  ariaLabel: string
  className?: string
}

export function RatingStars({
  rating,
  reviewCount,
  ariaLabel,
  className,
}: RatingStarsProps) {
  const filledStars = Math.round(Math.min(5, Math.max(0, rating)))

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        role="img"
        aria-label={ariaLabel}
        className="inline-flex items-center gap-0.5"
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            aria-hidden="true"
            className={cn(
              'size-4',
              index < filledStars ? 'fill-primary text-primary' : 'text-muted',
            )}
          />
        ))}
      </span>
      <span className="font-mono text-sm text-text-primary">
        {rating.toFixed(1)}
      </span>
      <span className="font-mono text-xs text-text-secondary">
        ({reviewCount})
      </span>
    </span>
  )
}
