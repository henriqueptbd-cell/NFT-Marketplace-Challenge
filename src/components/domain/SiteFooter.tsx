import { Link } from '@tanstack/react-router'
import { SocialIcon } from '@/components/domain/SocialIcon'
import { useSectionNav } from '@/hooks/useSectionNav'
import { cn } from '@/lib/cn'
import { discoveryCopy } from '@/lib/discovery-copy'

export interface SiteFooterProps {
  className?: string
}

const linkClassName =
  'text-sm text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

/** Rodapé global: contato, colunas de links, redes sociais e carteiras. */
export function SiteFooter({ className }: SiteFooterProps) {
  const copy = discoveryCopy.footer
  const anchors = discoveryCopy.nav.anchors
  const { search, onSectionClick } = useSectionNav()

  return (
    <footer
      aria-label={copy.label}
      className={cn('border-t border-border bg-surface', className)}
    >
      <div className="border-b border-border bg-elevated">
        <div className="page-shell grid gap-5 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:items-center lg:gap-8">
          <p className="font-display text-lg font-bold tracking-[0.08em] text-text-primary">
            {discoveryCopy.brand}
          </p>
          <p className="max-w-[16rem] text-sm leading-6 text-text-secondary">
            {copy.tagline}
          </p>
          <a href={`mailto:${copy.email}`} className={linkClassName}>
            {copy.email}
          </a>
          <a
            href={`tel:${copy.phone.replace(/\s/g, '')}`}
            className={linkClassName}
          >
            {copy.phone}
          </a>
        </div>
      </div>

      <div className="page-shell grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:items-start lg:gap-10 lg:pb-14">
        {copy.columns.map((column) => (
          <nav key={column.id} aria-label={column.title}>
            <h2 className="font-display text-base font-semibold text-text-primary">
              {column.title}
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {column.links.map((link) => {
                const section = link.section ? anchors[link.section] : undefined

                return (
                  <li key={`${column.id}-${link.label}`}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        hash={section}
                        search={section ? search : undefined}
                        onClick={(event) => {
                          if (section) onSectionClick(event, section)
                        }}
                        className={linkClassName}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-text-secondary">
                        {link.label}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="font-display text-base font-semibold text-text-primary">
            {copy.socialLabel}
          </h2>
          <ul className="mt-4 flex flex-wrap items-center gap-2.5">
            {copy.socials.map((social) => (
              <li key={social.id}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-button border border-primary/60 text-primary transition-colors hover:bg-primary hover:text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <SocialIcon id={social.id} />
                </a>
              </li>
            ))}
          </ul>
          <h2 className="mt-7 font-display text-base font-semibold text-text-primary">
            {copy.walletsLabel}
          </h2>
          <p className="mt-3 inline-flex flex-wrap items-center gap-1.5 rounded-button border border-border bg-elevated px-3.5 py-2 font-mono text-[0.7rem] tracking-[0.05em] text-primary">
            {copy.wallets.map((wallet, index) => (
              <span key={wallet} className="flex items-center gap-1.5">
                {index > 0 ? <span aria-hidden="true">•</span> : null}
                {wallet}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="border-t border-border bg-background">
        <p className="page-shell py-5 text-center text-xs text-text-secondary">
          {copy.copyright}
        </p>
      </div>
    </footer>
  )
}
