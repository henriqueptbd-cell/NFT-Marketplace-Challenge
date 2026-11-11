import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary hover:brightness-110',
        outline:
          'border border-primary bg-transparent text-primary hover:bg-primary-soft',
        secondary: 'bg-surface text-text-primary hover:bg-elevated',
        ghost: 'bg-transparent text-text-primary hover:bg-surface',
        link: 'rounded-none text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-10 px-4 py-2 text-sm',
        sm: 'min-h-8 px-3 text-xs',
        lg: 'min-h-12 px-6 text-base',
        icon: 'size-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants>

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      type={type}
      {...props}
    />
  )
}
