import { BellRing, Palette, ShieldCheck } from 'lucide-react'
import { NewsletterForm } from '@/components/domain/NewsletterForm'
import { cn } from '@/lib/cn'
import { discoveryCopy } from '@/lib/discovery-copy'

const benefitIcons = {
  shield: ShieldCheck,
  palette: Palette,
  bell: BellRing,
} as const

export interface BenefitsPanelProps {
  className?: string
}

/** Faixa de benefícios + newsletter que antecede o rodapé. */
export function BenefitsPanel({ className }: BenefitsPanelProps) {
  const copy = discoveryCopy.benefits

  return (
    <section
      aria-label={copy.label}
      className={cn(
        'grid gap-8 rounded-card bg-surface p-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-border lg:p-10',
        className,
      )}
    >
      {copy.items.map((item) => {
        const Icon = benefitIcons[item.icon]

        return (
          <div
            key={item.id}
            className="flex flex-col gap-3 lg:px-6 lg:first:pl-0"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-on-primary">
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <h2 className="font-display text-lg font-semibold text-text-primary">
              {item.title}
            </h2>
            <p className="text-sm leading-6 text-text-secondary">
              {item.description}
            </p>
          </div>
        )
      })}
      <div className="flex flex-col gap-3 lg:pl-6 lg:pr-0">
        <h2 className="font-display text-lg font-semibold text-text-primary">
          {discoveryCopy.newsletter.title}
        </h2>
        <NewsletterForm />
        <p className="text-sm leading-6 text-text-secondary">
          {discoveryCopy.newsletter.description}
        </p>
      </div>
    </section>
  )
}
