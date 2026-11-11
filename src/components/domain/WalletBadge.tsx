import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/cn'

export interface WalletBadgeProps {
  name: string
  avatarSrc?: string
  avatarAlt: string
  fallback: string
  statusLabel?: string
  connected?: boolean
  className?: string
}

export function WalletBadge({
  name,
  avatarSrc,
  avatarAlt,
  fallback,
  statusLabel,
  connected = false,
  className,
}: WalletBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-card border border-border bg-surface p-2',
        className,
      )}
    >
      <Avatar src={avatarSrc} alt={avatarAlt} fallback={fallback} />
      <span className="text-sm text-text-primary">{name}</span>
      {statusLabel ? (
        <Badge variant={connected ? 'default' : 'outline'}>{statusLabel}</Badge>
      ) : null}
    </div>
  )
}
