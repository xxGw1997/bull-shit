const pendingChatMessageKey = (conversationId: string) => `pending-chat-message:${conversationId}`

export function savePendingChatMessage(conversationId: string, message: string) {
  sessionStorage.setItem(pendingChatMessageKey(conversationId), message)
}

export function consumePendingChatMessage(conversationId: string) {
  const key = pendingChatMessageKey(conversationId)
  const message = sessionStorage.getItem(key)

  if (message) {
    sessionStorage.removeItem(key)
  }

  return message
}
