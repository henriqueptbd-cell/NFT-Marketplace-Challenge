import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface RatingStarsProps {
  rating: number
  reviewCount?: number
  ariaLabel: string
  /** Substitui a nota numérica por um texto, como em "19 avaliações". */
  label?: string
  /** Torna o texto do `label` acionável, abrindo a lista de avaliações. */
  onLabelClick?: () => void
  /** Oculta nota e contagem, útil em cartões de avaliação individual. */
  showValue?: boolean
  className?: string
}

export function RatingStars({
  rating,
  reviewCount = 0,
  ariaLabel,
  label,
  onLabelClick,
  showValue = true,
  className,
}: RatingStarsProps) {
  const filledStars = Math.round(Math.min(5, Math.max(0, rating)))

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
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
              'size-3.5',
              index < filledStars ? 'fill-primary text-primary' : 'text-muted',
            )}
          />
        ))}
      </span>
      {label ? (
        onLabelClick ? (
          <button
            type="button"
            onClick={onLabelClick}
            className="font-mono text-xs text-text-secondary underline underline-offset-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {label}
          </button>
        ) : (
          <span className="font-mono text-xs text-text-secondary underline underline-offset-2">
            {label}
          </span>
        )
      ) : showValue ? (
        <>
          <span className="font-mono text-sm text-text-primary">
            {rating.toFixed(1)}
          </span>
          <span className="font-mono text-xs text-text-secondary">
            ({reviewCount})
          </span>
        </>
      ) : null}
    </span>
  )
}
