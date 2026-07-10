import { FormEvent, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { client } from '../../../api'
import { toErrorMessage } from '../-utils/errors'
import { savePendingChatMessage } from '../-utils/pending-message'

export function useCreateChat() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending'>('idle')
  const [error, setError] = useState<string | null>(null)
  const message = input.trim()
  const isSending = status === 'sending'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!message || isSending) {
      return
    }

    setStatus('sending')
    setError(null)

    try {
      const { data, error } = await client.api.chat.create.get()

      if (error || !data || !('conversationId' in data)) {
        throw error
      }

      savePendingChatMessage(data.conversationId, message)
      await navigate({ to: '/chat/$conversationId', params: { conversationId: data.conversationId } })
    } catch (unknownError) {
      setError(toErrorMessage(unknownError, '创建对话失败，请稍后再试。'))
      setStatus('idle')
    }
  }

  return {
    input,
    setInput,
    status,
    error,
    isSending,
    canSubmit: Boolean(message) && !isSending,
    handleSubmit,
  }
}
