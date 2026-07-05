import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

import {
  ChatConversation,
  ChatNotice,
  ComposerFooter,
  MessageBubble,
  getChatConversation,
  pendingChatMessageKey,
  submitOnEnter,
  toErrorMessage,
} from './chat.shared'

export function ChatConversationPage() {
  const { conversationId } = useParams({ from: '/chat/$conversationId' })
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

  if (isLoading) {
    return <ChatShell title="继续对话" body={<ChatNotice title="正在读取历史" body="会话消息加载完成后就可以继续发送。" />} />
  }

  if (loadError || !conversation) {
    return <ChatShell title="继续对话" body={<ChatNotice title="加载失败" body={loadError ?? '会话不存在。'} tone="danger" />} />
  }

  return <ChatPanel key={conversation.id} conversation={conversation} />
}

function ChatPanel({ conversation }: { conversation: ChatConversation }) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingMessageSentRef = useRef(false)
  const { messages, sendMessage, status, error, stop, regenerate } = useChat({
    id: conversation.id,
    messages: conversation.messages,
    transport: new DefaultChatTransport({
      api: `/api/chat/${conversation.id}`,
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          id,
          message: messages[messages.length - 1],
        },
      }),
    }),
  })

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, status])

  useEffect(() => {
    if (pendingMessageSentRef.current) {
      return
    }

    const pendingMessage = sessionStorage.getItem(pendingChatMessageKey(conversation.id))
    if (!pendingMessage) {
      return
    }

    pendingMessageSentRef.current = true
    sessionStorage.removeItem(pendingChatMessageKey(conversation.id))
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

  return (
    <ChatShell
      title={conversation.title ?? '继续对话'}
      body={
        <>
          <div
            className="flex max-h-[calc(100vh-380px)] min-h-[420px] flex-col gap-5 overflow-y-auto rounded-3xl border border-[rgba(21,32,24,0.12)] bg-[#fffaf5]/70 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] max-md:max-h-none max-md:min-h-[360px] max-md:p-4"
            aria-live="polite"
          >
            {error && messages.length === 0 ? <ChatNotice title="加载失败" body={error.message} tone="danger" /> : null}
            {!error && messages.length === 0 ? <ChatNotice title="这段对话还没有消息" body="从下面输入第一条消息开始。" /> : null}

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {status === 'submitted' ? (
              <div className="grid max-w-[min(76%,720px)] justify-items-start gap-2 max-md:max-w-[92%]">
                <div className="rounded-[18px] border border-[rgba(216,111,69,0.24)] bg-[#fffaf5]/90 px-4 py-3 leading-7 text-[#5e6f5f]">
                  正在思考...
                </div>
              </div>
            ) : null}
            <div ref={scrollRef} />
          </div>

          <form
            className="overflow-hidden rounded-[22px] border border-[rgba(21,32,24,0.12)] bg-[#fffaf5]/85 shadow-[0_24px_80px_rgba(21,32,24,0.10)]"
            onSubmit={handleSubmit}
          >
            <textarea
              className="block min-h-24 w-full resize-y bg-transparent p-5 leading-7 text-[#152018] outline-none placeholder:text-[#5e6f5f]/75"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={submitOnEnter}
              placeholder="继续输入你的问题"
              rows={3}
              disabled={status !== 'ready'}
            />
            <ComposerFooter
              label={error ? error.message : status === 'streaming' ? 'AI 正在回复...' : 'Enter 发送，Shift + Enter 换行'}
              buttonLabel={status === 'submitted' || status === 'streaming' ? '停止' : error ? '重试' : '发送'}
              disabled={status === 'ready' && !input.trim() && !error}
              buttonType={status === 'submitted' || status === 'streaming' || error ? 'button' : 'submit'}
              onButtonClick={status === 'submitted' || status === 'streaming' ? stop : error ? () => regenerate() : undefined}
            />
          </form>
        </>
      }
    />
  )
}

function ChatShell({ title, body }: { title: string; body: ReactNode }) {
  return (
    <section className="grid min-h-[calc(100vh-194px)] animate-[rise_520ms_ease-out_both] gap-5 max-md:min-h-0">
      <header className="flex items-end justify-between gap-5 max-md:flex-col max-md:items-start">
        <div>
          <p className="eyebrow">Conversation</p>
          <h1 className="text-[clamp(2.4rem,6vw,4.6rem)]">{title}</h1>
        </div>
        <Link
          to="/chat"
          className="rounded-full bg-[#152018] px-5 py-3 text-center font-extrabold text-[#fffaf0] max-md:w-full"
        >
          新对话
        </Link>
      </header>
      {body}
    </section>
  )
}
