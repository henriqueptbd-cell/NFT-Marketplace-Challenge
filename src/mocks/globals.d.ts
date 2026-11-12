import type { MockScenario } from '@/mocks/scenarios'
import type { MockState } from '@/mocks/store'

declare global {
  interface Window {
    __mswReset: () => void
    __mswScenario: (name: MockScenario) => void
    __mswPatch: (mutator: (draft: MockState) => void) => void
  }
}

export {}
