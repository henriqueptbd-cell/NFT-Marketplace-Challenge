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
  shape?: 'square' | 'circle'
}

export function QuantityStepper({
  value,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
  onChange,
  labels,
  disabled = false,
  describedBy,
  shape = 'square',
}: QuantityStepperProps) {
  const buttonShape = shape === 'circle' ? 'size-8 rounded-full' : undefined

  return (
    <div className="inline-flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        className={buttonShape}
        aria-label={labels.decrease}
        aria-describedby={describedBy}
        disabled={disabled || value <= min}
        onClick={() => onChange(value > max ? max : Math.max(min, value - 1))}
      >
        <Minus aria-hidden="true" className="size-3.5" />
      </Button>
      <span
        aria-live="polite"
        aria-label={labels.current}
        className="min-w-4 text-center font-mono text-sm text-text-primary"
      >
        {value}
      </span>
      <Button
        variant="outline"
        size="icon"
        className={buttonShape}
        aria-label={labels.increase}
        aria-describedby={describedBy}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus aria-hidden="true" className="size-3.5" />
      </Button>
    </div>
  )
}
