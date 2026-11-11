import { Button } from '@/components/ui/button'

export interface ErrorStateProps {
  title: string
  message: string
  retryLabel: string
  onRetry: () => void
}

export function ErrorState({
  title,
  message,
  retryLabel,
  onRetry,
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      className="grid justify-items-start gap-3 rounded-card border border-border bg-surface p-6"
    >
      <h2 className="font-display text-lg font-bold text-text-primary">
        {title}
      </h2>
      <p className="text-sm text-text-secondary">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        {retryLabel}
      </Button>
    </section>
  )
}
