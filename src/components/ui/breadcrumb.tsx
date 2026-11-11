import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  ariaLabel: string
}

export function Breadcrumb({ items, ariaLabel }: BreadcrumbProps) {
  return (
    <nav aria-label={ariaLabel}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1
          return (
            <li
              key={`${item.label}-${index}`}
              className="inline-flex items-center gap-2"
            >
              {item.href && !isCurrent ? (
                <a className="rounded-sm hover:text-primary" href={item.href}>
                  {item.label}
                </a>
              ) : (
                <span aria-current={isCurrent ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isCurrent ? (
                <ChevronRight aria-hidden="true" className="size-3" />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
