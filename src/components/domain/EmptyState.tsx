import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

export interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <section className="grid justify-items-center gap-3 rounded-card border border-border bg-surface p-8 text-center">
      {icon}
      <h2 className="font-display text-xl font-bold text-text-primary">
        {title}
      </h2>
      <p className="max-w-prose text-sm text-text-secondary">{description}</p>
      {actionLabel && onAction ? (
        <Button onClick={onAction}>{actionLabel}</Button>
      ) : null}
    </section>
  )
}
