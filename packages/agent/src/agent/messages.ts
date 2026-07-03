import type { ModelMessage } from 'ai'
import type { AgentLimits, AgentRunInput } from './types'

export const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.'

export function getInputPrompt(input: AgentRunInput): string {
  if (!input.input) {
    throw new Error('Agent run input requires `input`.')
  }

  return input.input
}

export function getSystemPrompt(input: AgentRunInput): string {
  return input.system ?? DEFAULT_SYSTEM_PROMPT
}

export function buildMessages(input: AgentRunInput): ModelMessage[] {
  return [...(input.messages ?? []), { role: 'user', content: getInputPrompt(input) }]
}

export function prepareMessages(input: AgentRunInput, limits: AgentLimits): ModelMessage[] {
  const messages = buildMessages(input)
  const trimmedMessages = trimMessageCount(messages, limits.maxMessages)
  const charTrimmedMessages = trimMessageChars(trimmedMessages, limits.maxMessageChars)

  return trimTotalMessageChars(charTrimmedMessages, limits.maxTotalChars)
}

function trimMessageCount(messages: ModelMessage[], maxMessages: number): ModelMessage[] {
  if (messages.length <= maxMessages) {
    return messages
  }

  const systemMessages = messages.filter((message) => message.role === 'system')
  const nonSystemMessages = messages.filter((message) => message.role !== 'system')
  const remainingSlots = Math.max(maxMessages - systemMessages.length, 1)

  return [...systemMessages, ...nonSystemMessages.slice(-remainingSlots)]
}

function trimMessageChars(messages: ModelMessage[], maxChars: number): ModelMessage[] {
  return messages.map((message) => trimMessageContent(message, maxChars))
}

function trimTotalMessageChars(messages: ModelMessage[], maxTotalChars: number): ModelMessage[] {
  let totalChars = 0
  const result: ModelMessage[] = []

  for (const message of [...messages].reverse()) {
    const messageChars = getContentChars(message.content)

    if (totalChars + messageChars <= maxTotalChars || result.length === 0) {
      result.unshift(message)
      totalChars += messageChars
    }
  }

  return result
}

function trimMessageContent(message: ModelMessage, maxChars: number): ModelMessage {
  if (typeof message.content !== 'string') {
    return message
  }

  if (message.content.length <= maxChars) {
    return message
  }

  return {
    ...message,
    content: `${message.content.slice(0, maxChars)}\n[truncated]`,
  } as ModelMessage
}

function getContentChars(content: ModelMessage['content']): number {
  if (typeof content === 'string') {
    return content.length
  }

  return JSON.stringify(content).length
}
