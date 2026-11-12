import { Avatar } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/domain/EmptyState'
import { ErrorState } from '@/components/domain/ErrorState'
import { RatingStars } from '@/components/domain/RatingStars'
import { useNftReviews } from '@/hooks/useNfts'
import { discoveryCopy } from '@/lib/discovery-copy'

const reviewDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.charAt(0) ?? ''
  const last =
    parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? '') : ''
  return `${first}${last}`.toUpperCase()
}

export interface NftReviewsProps {
  nftId: string
}

export function NftReviews({ nftId }: NftReviewsProps) {
  const reviewsQuery = useNftReviews(nftId)

  if (reviewsQuery.isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton
            key={index}
            label={discoveryCopy.detail.reviewsLoading}
            className="h-36 w-full rounded-card"
          />
        ))}
      </div>
    )
  }

  if (reviewsQuery.isError) {
    return (
      <ErrorState
        title={discoveryCopy.detail.reviewsErrorTitle}
        message={discoveryCopy.detail.errorDescription}
        retryLabel={discoveryCopy.catalog.retry}
        onRetry={() => void reviewsQuery.refetch()}
      />
    )
  }

  const reviews = reviewsQuery.data

  if (reviews.length === 0) {
    return (
      <EmptyState
        title={discoveryCopy.detail.reviewsEmptyTitle}
        description={discoveryCopy.detail.reviewsEmptyDescription}
      />
    )
  }

  return (
    <ul
      aria-label={discoveryCopy.detail.reviewsList}
      className="grid gap-4 md:grid-cols-2"
    >
      {reviews.map((review) => (
        <li
          key={review.id}
          className="grid content-start gap-3 rounded-card border border-border bg-surface p-5"
        >
          <div className="flex items-center gap-3">
            <Avatar
              alt={review.author}
              fallback={initials(review.author)}
              className="size-9"
            />
            <div>
              <p className="font-mono text-sm font-bold text-text-primary">
                {review.author}
              </p>
              <p className="font-mono text-xs text-muted">
                <time dateTime={review.createdAt}>
                  {reviewDateFormatter.format(new Date(review.createdAt))}
                </time>
              </p>
            </div>
            <RatingStars
              rating={review.rating}
              showValue={false}
              ariaLabel={discoveryCopy.detail.reviewRatingLabel(review.rating)}
              className="ml-auto shrink-0"
            />
          </div>
          <p className="font-mono text-[0.8125rem] leading-6 text-text-secondary">
            {review.comment}
          </p>
        </li>
      ))}
    </ul>
  )
}
