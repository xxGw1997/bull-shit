import type { ModelMessage, ToolSet } from 'ai'
import type { AgentResponse } from '@cyper-me/shared'

export type AgentServiceOptions = {
  apiKey: string
  baseUrl: string
  model: string
  tools?: ToolSet
  maxSteps?: number
}

export type AgentRunInput = {
  input?: string
  prompt?: string
  system?: string
  systemPrompt?: string
  messages?: ModelMessage[]
  context?: ModelMessage[]
}

export type AgentService = {
  run(input: AgentRunInput): Promise<AgentResponse>
  runText(input: AgentRunInput): Promise<AgentResponse>
  streamText(input: AgentRunInput): Response
}
