import { useState } from 'react'
import type { Network } from '@/api/types/common'
import type { CollectionFilterOption } from '@/components/domain/CollectionFilters'
import { CollectionFilters } from '@/components/domain/CollectionFilters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { discoveryCopy } from '@/lib/discovery-copy'
import type { MarketplaceSearch } from '@/lib/validation'
import { marketplaceSearchSchema } from '@/lib/validation'

export interface MarketplaceFiltersProps {
  idPrefix: string
  search: MarketplaceSearch
  collections: CollectionFilterOption[]
  networks: CollectionFilterOption[]
  onChange: (updates: Partial<MarketplaceSearch>, replace?: boolean) => void
  onClear: () => void
}

type PriceDraft = {
  source: string
  min: string
  max: string
}

export function MarketplaceFilters({
  idPrefix,
  search,
  collections,
  networks,
  onChange,
  onClear,
}: MarketplaceFiltersProps) {
  const source = `${search.priceMin ?? ''}\u0000${search.priceMax ?? ''}`
  const [draft, setDraft] = useState<PriceDraft>({
    source,
    min: search.priceMin ?? '',
    max: search.priceMax ?? '',
  })
  const [priceError, setPriceError] = useState<{
    source: string
    message: string
  }>()
  const priceMin = draft.source === source ? draft.min : (search.priceMin ?? '')
  const priceMax = draft.source === source ? draft.max : (search.priceMax ?? '')
  const visiblePriceError =
    priceError?.source === source ? priceError.message : undefined

  function commitPriceRange() {
    const min = priceMin.trim() || undefined
    const max = priceMax.trim() || undefined
    const parsed = marketplaceSearchSchema.safeParse({
      ...search,
      priceMin: min,
      priceMax: max,
      page: 1,
    })
    if (!parsed.success) {
      setPriceError({
        source,
        message: discoveryCopy.filters.invalidPriceRange,
      })
      return
    }
    setPriceError(undefined)
    onChange({ priceMin: min, priceMax: max }, true)
  }

  function toggleCollection(value: string, selected: boolean) {
    const next = selected
      ? [...search.collections, value]
      : search.collections.filter((item) => item !== value)
    onChange({ collections: next })
  }

  function toggleNetwork(value: string, selected: boolean) {
    const network = value as Network
    const next = selected
      ? [...search.networks, network]
      : search.networks.filter((item) => item !== network)
    onChange({ networks: next })
  }

  const minId = `${idPrefix}-price-min`
  const maxId = `${idPrefix}-price-max`
  const priceErrorId = `${idPrefix}-price-error`

  return (
    <div className="grid gap-7">
      <h2 className="font-display text-xl font-bold text-text-primary">
        {discoveryCopy.filters.title}
      </h2>
      <CollectionFilters
        groupLabel={discoveryCopy.filters.collectionLegend}
        idPrefix={`${idPrefix}-collection`}
        options={collections}
        selectedValues={search.collections}
        onSelectionChange={toggleCollection}
      />
      <fieldset
        className="grid gap-3"
        aria-label={discoveryCopy.filters.priceRange}
      >
        <legend className="font-display text-base font-bold text-text-primary">
          {discoveryCopy.filters.priceRange}
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor={minId}>{discoveryCopy.filters.priceMin}</Label>
            <Input
              id={minId}
              type="text"
              inputMode="decimal"
              value={priceMin}
              aria-invalid={visiblePriceError !== undefined}
              aria-describedby={visiblePriceError ? priceErrorId : undefined}
              onChange={(event) =>
                setDraft({ source, min: event.target.value, max: priceMax })
              }
              onBlur={commitPriceRange}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitPriceRange()
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={maxId}>{discoveryCopy.filters.priceMax}</Label>
            <Input
              id={maxId}
              type="text"
              inputMode="decimal"
              value={priceMax}
              aria-invalid={visiblePriceError !== undefined}
              aria-describedby={visiblePriceError ? priceErrorId : undefined}
              onChange={(event) =>
                setDraft({ source, min: priceMin, max: event.target.value })
              }
              onBlur={commitPriceRange}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitPriceRange()
                }
              }}
            />
          </div>
        </div>
        {visiblePriceError ? (
          <p id={priceErrorId} role="alert" className="text-xs text-primary">
            {visiblePriceError}
          </p>
        ) : null}
      </fieldset>
      <CollectionFilters
        groupLabel={discoveryCopy.filters.networkLegend}
        idPrefix={`${idPrefix}-network`}
        options={networks}
        selectedValues={search.networks}
        onSelectionChange={toggleNetwork}
      />
      <Button variant="ghost" className="justify-self-start" onClick={onClear}>
        {discoveryCopy.filters.clear}
      </Button>
    </div>
  )
}
