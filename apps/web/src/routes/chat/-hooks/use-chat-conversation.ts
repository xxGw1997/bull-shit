import { useEffect, useState } from 'react'

import { ChatConversation, getChatConversation, toErrorMessage } from '../-api/chat-api'

export function useChatConversation(conversationId: string) {
  const [conversation, setConversation] = useState<ChatConversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    async function load() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const nextConversation = await getChatConversation(conversationId)
        if (isCurrent) {
          setConversation(nextConversation)
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
