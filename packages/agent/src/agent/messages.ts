import type { ModelMessage } from 'ai'
import type { AgentRunInput } from './types'

export const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.'

export function getInputPrompt(input: AgentRunInput): string {
  const prompt = input.input ?? input.prompt

  if (!prompt) {
    throw new Error('Agent run input requires `input` or `prompt`.')
  }

  return prompt
}

export function getSystemPrompt(input: AgentRunInput): string {
  return input.system ?? input.systemPrompt ?? DEFAULT_SYSTEM_PROMPT
}

export function buildMessages(input: AgentRunInput): ModelMessage[] {
  return [...(input.context ?? input.messages ?? []), { role: 'user', content: getInputPrompt(input) }]
}
