import type {
  generateText,
  LanguageModel,
  ModelMessage,
  streamText,
  TextStreamPart,
  ToolSet,
} from 'ai'

export type AgentEvent = TextStreamPart<ToolSet>

export type AgentRunResult = Awaited<ReturnType<typeof generateText<ToolSet>>>

export type AgentStreamResult = ReturnType<typeof streamText<ToolSet>>

export type AgentLimits = {
  maxSteps: number
  maxMessages: number
  maxMessageChars: number
  maxTotalChars: number
}

export type AgentServiceOptions = {
  apiKey: string
  baseUrl: string
  model: string
  tools?: ToolSet
  maxSteps?: number
  maxMessages?: number
  maxMessageChars?: number
  maxTotalChars?: number
}

export type AgentRunInput = {
  input?: string
  system?: string
  messages?: ModelMessage[]
  tools?: ToolSet
  metadata?: Record<string, unknown>
  abortSignal?: AbortSignal
}

export type AgentRuntimeOptions = {
  model: LanguageModel
  tools?: ToolSet
  limits: AgentLimits
}

export type AgentService = {
  run(input: AgentRunInput): Promise<AgentRunResult>
  runText(input: AgentRunInput): Promise<AgentRunResult>
  stream(input: AgentRunInput): AgentStreamResult
  streamText(input: AgentRunInput): AgentStreamResult
}
