import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Circle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/cn'

export interface RadioOption {
  value: string
  label: string
  disabled?: boolean
}

export interface RadioGroupProps {
  id: string
  ariaLabel: string
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function RadioGroup({
  id,
  ariaLabel,
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  className,
}: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      id={id}
      aria-label={ariaLabel}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      className={cn('grid gap-3', className)}
    >
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <RadioGroupPrimitive.Item
            id={`${id}-${option.value}`}
            value={option.value}
            disabled={option.disabled}
            className="size-4 rounded-full border border-border bg-background text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
              <Circle aria-hidden="true" className="size-2 fill-current" />
            </RadioGroupPrimitive.Indicator>
          </RadioGroupPrimitive.Item>
          <Label htmlFor={`${id}-${option.value}`} className="cursor-pointer">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroupPrimitive.Root>
  )
}
