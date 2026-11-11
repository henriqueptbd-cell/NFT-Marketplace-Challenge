import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/cn'

export interface FormFieldProps {
  id: string
  label: string
  children: ReactNode
  description?: string
  error?: string
  required?: boolean
  requiredIndicator?: ReactNode
  className?: string
}

export function FormField({
  id,
  label,
  children,
  description,
  error,
  required = false,
  requiredIndicator,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required && requiredIndicator ? (
          <span aria-hidden="true">{requiredIndicator}</span>
        ) : null}
      </Label>
      {children}
      {description ? (
        <p id={`${id}-description`} className="text-xs text-text-secondary">
          {description}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-text-secondary"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}
