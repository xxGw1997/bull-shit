import type { UIMessage } from 'ai'

import { client } from '../../../api'

export type ChatConversation = {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  messages: UIMessage[]
}

export async function createChatConversation() {
  const { data, error } = await client.api.chat.create.get()

  if (error || !data || !('conversationId' in data)) {
    throw error
  }

  return data
}

export async function getChatConversation(conversationId: string): Promise<ChatConversation> {
  const { data, error } = await client.api.chat({ conversationId }).get()

  if (error || !data || !('messages' in data)) {
    throw error
  }

  return data as ChatConversation
}

export function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object' && 'value' in error) {
    const value = (error as { value?: { message?: string } }).value
    return value?.message ?? fallback
  }

  return fallback
}
