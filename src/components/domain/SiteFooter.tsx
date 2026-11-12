import { Link } from '@tanstack/react-router'
import { useSectionNav } from '@/hooks/useSectionNav'
import { cn } from '@/lib/cn'
import { discoveryCopy } from '@/lib/discovery-copy'

export interface SiteFooterProps {
  className?: string
}

/** Rodapé global: contato, colunas de links, redes sociais e carteiras. */
export function SiteFooter({ className }: SiteFooterProps) {
  const copy = discoveryCopy.footer
  const anchors = discoveryCopy.nav.anchors
  const { search, onSectionClick } = useSectionNav()

  return (
    <footer
      aria-label={copy.label}
      className={cn('border-t border-border bg-background', className)}
    >
      <div className="page-shell pt-10">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-text-secondary">
          <p className="font-display text-lg font-bold tracking-wide text-text-primary">
            {discoveryCopy.brand}
          </p>
          <p>{copy.tagline}</p>
          <a
            href={`mailto:${copy.email}`}
            className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {copy.email}
          </a>
          <a
            href={`tel:${copy.phone.replace(/\s/g, '')}`}
            className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {copy.phone}
          </a>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {copy.columns.map((column) => (
            <nav key={column.id} aria-label={column.title}>
              <h2 className="font-display text-base font-semibold text-text-primary">
                {column.title}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm text-text-secondary">
                {column.links.map((link) => {
                  const section = link.section
                    ? anchors[link.section]
                    : undefined

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
                          className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <span>{link.label}</span>
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
            <ul className="mt-4 flex flex-wrap items-center gap-2">
              {copy.socials.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex size-8 items-center justify-center rounded-button border border-primary text-xs text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span aria-hidden="true">{social.short}</span>
                    <span className="sr-only">{social.label}</span>
                  </a>
                </li>
              ))}
            </ul>
            <h2 className="mt-6 font-display text-base font-semibold text-text-primary">
              {copy.walletsLabel}
            </h2>
            <p className="mt-3 inline-block rounded-button border border-border px-3 py-1.5 font-mono text-[0.7rem] tracking-wide text-text-secondary">
              {copy.wallets.join(' · ')}
            </p>
          </div>
        </div>

        <p className="mt-10 border-t border-border py-5 text-center text-xs text-muted">
          {copy.copyright}
        </p>
      </div>
    </footer>
  )
}
