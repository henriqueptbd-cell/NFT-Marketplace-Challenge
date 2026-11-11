import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export interface SkeletonProps extends ComponentProps<'div'> {
  label: string
}

export function Skeleton({ label, className, ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        'animate-shimmer bg-gradient-to-r from-surface via-elevated to-surface bg-[length:200%_100%] motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  )
}
