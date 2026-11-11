import { Link } from '@tanstack/react-router'
import type { NFT } from '@/api/types/nft'
import { Badge } from '@/components/ui/badge'
import { NFTImage } from '@/components/domain/NFTImage'
import { PriceDisplay } from '@/components/domain/PriceDisplay'
import { cn } from '@/lib/cn'

export interface NFTCardProps {
  nft: NFT
  className?: string
  priority?: boolean
}

export function NFTCard({ nft, className, priority = false }: NFTCardProps) {
  return (
    <article className={cn('grid gap-2', className)}>
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        aria-label={nft.name}
        className="group relative block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <NFTImage src={nft.image} alt={nft.name} priority={priority} />
        {nft.rarity ? (
          <Badge className="absolute left-2 top-2" variant="default">
            {nft.rarity}
          </Badge>
        ) : null}
      </Link>
      <div className="grid gap-1">
        <h2 className="font-display text-base font-bold text-text-primary">
          {nft.name}
        </h2>
        <p className="text-xs text-text-secondary">{nft.collection}</p>
        <PriceDisplay price={nft.priceEth} />
      </div>
    </article>
  )
}
