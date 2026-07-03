import type { ToolSet } from 'ai'
import { getWeather } from './get-weather'

export type AgentToolPermission = 'safe' | 'project' | 'network' | 'dangerous'

export type AgentToolDefinition = {
  name: string
  tool: ToolSet[string]
  enabledByDefault?: boolean
  permission?: AgentToolPermission
}

export function createDefaultToolRegistry(): ToolSet {
  return {
    getWeather,
  } satisfies ToolSet
}
