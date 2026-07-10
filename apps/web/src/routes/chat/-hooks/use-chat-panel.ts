import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { ChatUIMessage } from '@cyper-me/shared'

import { consumePendingChatMessage } from '../-utils/pending-message'

export function useChatPanel(conversation: { id: string; messages: ChatUIMessage[] }) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingMessageSentRef = useRef(false)
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/chat/${conversation.id}`,
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            id,
            message: messages[messages.length - 1],
          },
        }),
      }),
    [conversation.id],
  )
  const chat = useChat({
    id: conversation.id,
    messages: conversation.messages,
    transport,
  })
  const { messages, sendMessage, status } = chat

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, status])

  useEffect(() => {
    if (pendingMessageSentRef.current) {
      return
    }

    const pendingMessage = consumePendingChatMessage(conversation.id)
    if (!pendingMessage) {
      return
    }

    pendingMessageSentRef.current = true
    sendMessage({ text: pendingMessage })
  }, [conversation.id, sendMessage])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const message = input.trim()
    if (!message || status !== 'ready') {
      return
    }

    setInput('')
    await sendMessage({ text: message })
  }

  return {
    ...chat,
    input,
    setInput,
    scrollRef,
    canSubmit: Boolean(input.trim()) && status === 'ready',
    handleSubmit,
  }
}
