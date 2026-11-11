import { Skeleton } from '@/components/ui/skeleton'
import type { NFTImageAspectRatio } from '@/components/domain/NFTImage'

export interface LoadingGridProps {
  count: number
  label: string
  aspectRatio?: NFTImageAspectRatio
  className?: string
}

const aspectClasses: Record<NFTImageAspectRatio, string> = {
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-video',
}

export function LoadingGrid({
  count,
  label,
  aspectRatio = 'square',
  className,
}: LoadingGridProps) {
  return (
    <div className={className} aria-busy="true">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: Math.max(0, count) }, (_, index) => (
          <Skeleton
            key={index}
            label={label}
            className={`w-full rounded-card ${aspectClasses[aspectRatio]}`}
          />
        ))}
      </div>
    </div>
  )
}
