import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/cn'

export interface AvatarProps {
  src?: string
  alt: string
  fallback: string
  className?: string
}

export function Avatar({ src, alt, fallback, className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative flex size-10 shrink-0 overflow-hidden rounded-full bg-surface text-text-secondary',
        className,
      )}
    >
      {src ? (
        <AvatarPrimitive.Image
          src={src}
          alt={alt}
          className="aspect-square size-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback
        className="flex size-full items-center justify-center text-sm font-medium"
        delayMs={0}
      >
        {fallback}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  )
}
