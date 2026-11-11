import { Checkbox } from '@/components/ui/checkbox'

export interface CollectionFilterOption {
  value: string
  label: string
  count?: number
  disabled?: boolean
}

export interface CollectionFiltersProps {
  groupLabel: string
  idPrefix?: string
  options: CollectionFilterOption[]
  selectedValues: string[]
  onSelectionChange: (value: string, selected: boolean) => void
}

export function CollectionFilters({
  groupLabel,
  idPrefix = 'collection-filter',
  options,
  selectedValues,
  onSelectionChange,
}: CollectionFiltersProps) {
  return (
    <fieldset className="grid gap-3" aria-label={groupLabel}>
      <legend className="font-display text-base font-bold text-text-primary">
        {groupLabel}
      </legend>
      {options.map((option) => {
        const inputId = `${idPrefix}-${option.value}`
        const label =
          option.count === undefined
            ? option.label
            : `${option.label} (${option.count})`

        return (
          <Checkbox
            key={option.value}
            id={inputId}
            label={label}
            checked={selectedValues.includes(option.value)}
            disabled={option.disabled}
            onCheckedChange={(checked) =>
              onSelectionChange(option.value, checked)
            }
          />
        )
      })}
    </fieldset>
  )
}
