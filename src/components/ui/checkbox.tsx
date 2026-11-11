import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/cn'

export interface CheckboxProps {
  id: string
  label: string
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}

export function Checkbox({
  id,
  label,
  checked,
  defaultChecked,
  disabled,
  onCheckedChange,
  className,
}: CheckboxProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange?.(value === true)}
        className="size-4 shrink-0 rounded-sm border border-border bg-background text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center">
          <Check aria-hidden="true" className="size-3" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <Label htmlFor={id} className="cursor-pointer">
        {label}
      </Label>
    </div>
  )
}
