import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface ToastProps {
  title: string
  description?: string
  variant?: 'status' | 'error'
  action?: ReactNode
  className?: string
}

export function Toast({
  title,
  description,
  variant = 'status',
  action,
  className,
}: ToastProps) {
  const isError = variant === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={cn(
        'grid gap-2 rounded-card border border-border bg-surface p-4 text-text-primary shadow-lg',
        className,
      )}
    >
      <p className="font-semibold">{title}</p>
      {description ? (
        <p className="text-sm text-text-secondary">{description}</p>
      ) : null}
      {action}
    </div>
  )
}
