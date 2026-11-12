import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { NFT } from '@/api/types/nft'
import { NFTImage } from '@/components/domain/NFTImage'
import { cn } from '@/lib/cn'
import { discoveryCopy } from '@/lib/discovery-copy'

export interface FeaturedOfferCardProps {
  nft?: NFT
  className?: string
}

/** Cartão promocional da barra lateral de filtros, abaixo do painel. */
export function FeaturedOfferCard({ nft, className }: FeaturedOfferCardProps) {
  const copy = discoveryCopy.catalog.featuredOffer

  const content = (
    <>
      {nft ? (
        <NFTImage
          src={nft.image}
          alt={discoveryCopy.accessibility.featuredImage(nft.name)}
          aspectRatio="square"
          className="mb-4 border border-border"
        />
      ) : null}
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-primary">
        {copy.eyebrow}
      </p>
      <p className="mt-1.5 font-display text-xl font-bold leading-tight text-text-primary">
        {copy.title}
      </p>
      {nft ? (
        <span className="mt-3 flex items-center gap-1.5 text-xs text-text-secondary transition-colors group-hover:text-primary">
          {nft.name}
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </span>
      ) : null}
    </>
  )

  const baseClassName = cn(
    'rounded-card border border-primary/40 bg-primary-soft/40 p-5',
    className,
  )

  if (!nft) {
    return <div className={baseClassName}>{content}</div>
  }

  return (
    <Link
      to="/nft/$id"
      params={{ id: nft.id }}
      className={cn(
        baseClassName,
        'group block transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      )}
    >
      {content}
    </Link>
  )
}
