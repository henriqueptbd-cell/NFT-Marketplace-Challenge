import { z } from 'zod'

export const mockScenarioSchema = z.enum(['normal', 'latency', 'server-error'])
export type MockScenario = z.infer<typeof mockScenarioSchema>

const scenarioFromEnvironment = mockScenarioSchema.safeParse(
  import.meta.env.VITE_MOCK_SCENARIO || 'normal',
)

export const activeMockScenario: MockScenario = scenarioFromEnvironment.success
  ? scenarioFromEnvironment.data
  : 'normal'
