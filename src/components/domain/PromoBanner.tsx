import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { NFTImage } from '@/components/domain/NFTImage'
import { useSectionNav } from '@/hooks/useSectionNav'
import { cn } from '@/lib/cn'
import { discoveryCopy } from '@/lib/discovery-copy'

export interface PromoBannerProps {
  title: string
  description: string
  image: string
  imageAlt: string
  className?: string
}

/** Banner promocional horizontal: arte à esquerda, texto e CTA à direita. */
export function PromoBanner({
  title,
  description,
  image,
  imageAlt,
  className,
}: PromoBannerProps) {
  const { search, onSectionClick } = useSectionNav()
  const anchor = discoveryCopy.nav.anchors.marketplace

  return (
    <article
      className={cn('flex overflow-hidden rounded-card bg-surface', className)}
    >
      <NFTImage
        src={image}
        alt={imageAlt}
        aspectRatio="square"
        className="w-28 shrink-0 rounded-none sm:w-36"
      />
      <div className="flex flex-col items-start justify-center gap-3 p-5 sm:p-6">
        <h3 className="font-display text-xl font-semibold leading-tight text-text-primary sm:text-2xl">
          {title}
        </h3>
        <p className="text-sm leading-6 text-text-secondary">{description}</p>
        <Link
          to="/"
          hash={anchor}
          search={search}
          onClick={(event) => onSectionClick(event, anchor)}
          className="inline-flex min-h-9 items-center gap-2 rounded-button text-sm font-semibold text-primary transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {discoveryCopy.banners.cta}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </article>
  )
}
