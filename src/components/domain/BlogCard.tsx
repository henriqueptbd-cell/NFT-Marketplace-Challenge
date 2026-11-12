import { ArrowRight } from 'lucide-react'
import { NFTImage } from '@/components/domain/NFTImage'
import { cn } from '@/lib/cn'
import { discoveryCopy } from '@/lib/discovery-copy'

export interface BlogPostPreview {
  id: string
  meta: string
  title: string
  excerpt: string
  image: string
  imageAlt: string
}

export interface BlogCardProps {
  post: BlogPostPreview
  className?: string
}

/** Card de artigo do "Diário da Cunhagem". */
export function BlogCard({ post, className }: BlogCardProps) {
  return (
    <article className={cn('flex flex-col gap-3', className)}>
      <NFTImage src={post.image} alt={post.imageAlt} aspectRatio="wide" />
      <p className="text-xs text-muted">{post.meta}</p>
      <h3 className="font-display text-lg font-semibold leading-snug text-text-primary">
        {post.title}
      </h3>
      <p className="text-sm leading-6 text-text-secondary">{post.excerpt}</p>
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        {discoveryCopy.blog.readMore}
        <ArrowRight aria-hidden="true" className="size-4" />
      </p>
    </article>
  )
}
