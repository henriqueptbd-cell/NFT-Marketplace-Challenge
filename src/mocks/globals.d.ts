import type { MockScenario } from '@/mocks/scenarios'

declare global {
  interface Window {
    __mswReset: () => void
    __mswScenario: (name: MockScenario) => void
  }
}

export {}
