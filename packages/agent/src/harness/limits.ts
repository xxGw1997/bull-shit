import type { AgentLimits } from '../agent/types'

export const DEFAULT_AGENT_LIMITS: AgentLimits = {
  maxSteps: 10,
  maxMessages: 20,
  maxMessageChars: 8000,
  maxTotalChars: 40000,
}

export function createAgentLimits(overrides: Partial<AgentLimits> = {}): AgentLimits {
  const definedOverrides = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined),
  ) as Partial<AgentLimits>

  return {
    ...DEFAULT_AGENT_LIMITS,
    ...definedOverrides,
  }
}
