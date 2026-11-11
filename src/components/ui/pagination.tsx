import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  ariaLabel: string
  labels: {
    previous: string
    next: string
    page: (page: number) => string
  }
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  ariaLabel,
  labels,
}: PaginationProps) {
  const pages = Array.from(
    { length: Math.max(0, pageCount) },
    (_, index) => index + 1,
  )

  return (
    <nav
      aria-label={ariaLabel}
      className="flex items-center justify-center gap-1"
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label={labels.previous}
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </Button>
      {pages.map((pageNumber) => (
        <Button
          key={pageNumber}
          variant={pageNumber === page ? 'default' : 'ghost'}
          size="sm"
          aria-label={labels.page(pageNumber)}
          aria-current={pageNumber === page ? 'page' : undefined}
          onClick={() => onPageChange(pageNumber)}
        >
          {pageNumber}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="icon"
        aria-label={labels.next}
        disabled={page >= pageCount}
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </Button>
    </nav>
  )
}
