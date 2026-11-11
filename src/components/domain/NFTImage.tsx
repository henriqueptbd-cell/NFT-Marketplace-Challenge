import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'

export type NFTImageAspectRatio = 'square' | 'portrait' | 'wide'
type ImageState = 'loading' | 'loaded' | 'fallback'

export interface NFTImageProps {
  src: string
  alt: string
  aspectRatio?: NFTImageAspectRatio
  className?: string
  priority?: boolean
}

const aspectRatios: Record<NFTImageAspectRatio, string> = {
  square: '1 / 1',
  portrait: '3 / 4',
  wide: '16 / 9',
}

export function NFTImage({
  src,
  alt,
  aspectRatio = 'square',
  className,
  priority = false,
}: NFTImageProps) {
  const [imageState, setImageState] = useState<{
    src: string
    state: ImageState
  }>({
    src,
    state: src ? 'loading' : 'fallback',
  })
  const state =
    imageState.src === src ? imageState.state : src ? 'loading' : 'fallback'

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-card bg-surface',
        className,
      )}
      style={{ aspectRatio: aspectRatios[aspectRatio] }}
    >
      {state === 'fallback' ? (
        <div
          role="img"
          aria-label={alt}
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-surface to-elevated p-4 text-center font-mono text-xs text-muted"
        >
          <span className="line-clamp-2">{alt}</span>
        </div>
      ) : (
        <>
          {state === 'loading' ? (
            <Skeleton label={alt} className="absolute inset-0 size-full" />
          ) : null}
          <img
            key={src}
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={() => setImageState({ src, state: 'loaded' })}
            onError={() => setImageState({ src, state: 'fallback' })}
            className={cn(
              'absolute inset-0 size-full rounded-card object-cover transition-opacity',
              state === 'loaded' ? 'opacity-100' : 'opacity-0',
            )}
          />
        </>
      )}
    </div>
  )
}
