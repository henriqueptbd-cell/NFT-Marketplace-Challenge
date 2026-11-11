import { useCallback, useMemo, type MouseEvent } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { isHomeSection, scrollToSection } from '@/lib/section-scroll'
import {
  defaultMarketplaceSearch,
  parseMarketplaceSearch,
  stripDefaultSearch,
  type MarketplaceSearch,
} from '@/lib/validation'

export interface SectionNav {
  /**
   * Search a repassar ao `<Link>` da seção. Contém apenas os filtros ativos,
   * para a URL não carregar valores padrão.
   */
  search: Partial<MarketplaceSearch>
  onSectionClick: (
    event: MouseEvent<HTMLAnchorElement>,
    section: string,
  ) => void
}

/**
 * Complementa o `<Link>` de seção: quando a Home já está na URL atual com o
 * mesmo hash, o router não navega e o scroll não aconteceria.
 */
export function useSectionNav(): SectionNav {
  const location = useRouterState({ select: (state) => state.location })
  const isHome = location.pathname === '/'

  const search = useMemo(
    () =>
      stripDefaultSearch(
        isHome
          ? parseMarketplaceSearch(location.search)
          : defaultMarketplaceSearch,
      ),
    [isHome, location.search],
  )

  const onSectionClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, section: string) => {
      const expectedHash = isHomeSection(section) ? '' : section
      if (!isHome || location.hash !== expectedHash) return
      event.preventDefault()
      scrollToSection(section)
    },
    [isHome, location.hash],
  )

  return { search, onSectionClick }
}
