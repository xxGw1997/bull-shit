export type AgentContextMessage = {
  role: string
  content: unknown
}

export type AgentResponse = {
  output: string
  context: AgentContextMessage[]
  finishReason?: string
}
