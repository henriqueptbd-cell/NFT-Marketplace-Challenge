import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface QuantityStepperProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  labels: {
    decrease: string
    increase: string
    current: string
  }
  disabled?: boolean
  describedBy?: string
}

export function QuantityStepper({
  value,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  onChange,
  labels,
  disabled = false,
  describedBy,
}: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label={labels.decrease}
        aria-describedby={describedBy}
        disabled={disabled || value <= min}
        onClick={() => onChange(value > max ? max : Math.max(min, value - 1))}
      >
        <Minus aria-hidden="true" className="size-4" />
      </Button>
      <span
        aria-live="polite"
        aria-label={labels.current}
        className="min-w-6 text-center"
      >
        {value}
      </span>
      <Button
        variant="outline"
        size="icon"
        aria-label={labels.increase}
        aria-describedby={describedBy}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus aria-hidden="true" className="size-4" />
      </Button>
    </div>
  )
}
