import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-badge border px-2 py-0.5 text-xs font-medium leading-none',
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-on-primary',
        secondary: 'border-primary-soft bg-primary-soft text-primary',
        outline: 'border-border bg-transparent text-text-secondary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export type BadgeProps = ComponentProps<'span'> &
  VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
