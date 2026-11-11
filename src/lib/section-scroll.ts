import { discoveryCopy } from '@/lib/discovery-copy'

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'
}

export function isHomeSection(section: string): boolean {
  return section === discoveryCopy.nav.anchors.home
}

export function scrollToSection(section: string): void {
  if (isHomeSection(section)) {
    window.scrollTo({ top: 0, left: 0, behavior: scrollBehavior() })
    return
  }

  document
    .getElementById(section)
    ?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
}
