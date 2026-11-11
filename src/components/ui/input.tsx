import { forwardRef, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export type InputProps = ComponentProps<'input'>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex min-h-10 w-full rounded-input border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})
