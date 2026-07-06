import { createFileRoute, useParams } from '@tanstack/react-router'

import { ChatPanel } from './-components/chat-panel'
import { ChatShell } from './-components/chat-shell'
import { ChatNotice } from './-components/chat-ui'
import { useChatConversation } from './-hooks/use-chat-conversation'

export const Route = createFileRoute('/chat/$conversationId')({
  component: ChatConversationPage,
})

export function ChatConversationPage() {
  const { conversationId } = useParams({ from: '/chat/$conversationId' })
  const { conversation, isLoading, loadError } = useChatConversation(conversationId)

  if (isLoading) {
    return <ChatShell title="继续对话" body={<ChatNotice title="正在读取历史" body="会话消息加载完成后就可以继续发送。" />} />
  }

  if (loadError || !conversation) {
    return <ChatShell title="继续对话" body={<ChatNotice title="加载失败" body={loadError ?? '会话不存在。'} tone="danger" />} />
  }

  return <ChatPanel key={conversation.id} conversation={conversation} />
}
