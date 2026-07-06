import { useEffect, useState } from 'react'
import type { UIMessage } from 'ai'

import { client } from '../../../api'
import { toErrorMessage } from '../-api/chat-api'

export function useChatConversation(conversationId: string) {
  const [conversation, setConversation] = useState<{
    id: string
    messages: UIMessage[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    async function load() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const { data, error } = await client.api.chat({ conversationId }).get()

        if (error || !data || !('messages' in data)) {
          throw error
        }

        if (isCurrent) {
          setConversation(data)
        }
      } catch (unknownError) {
        if (isCurrent) {
          setLoadError(toErrorMessage(unknownError, '读取历史对话失败。'))
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      isCurrent = false
    }
  }, [conversationId])

  return { conversation, isLoading, loadError }
}
