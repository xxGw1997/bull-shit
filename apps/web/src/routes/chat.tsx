import { FormEvent, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { ComposerFooter, createChatConversation, pendingChatMessageKey, submitOnEnter, toErrorMessage } from './chat.shared'

export function NewChatPage() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const message = input.trim()
    if (!message || status === 'sending') {
      return
    }

    setStatus('sending')
    setError(null)

    try {
      const conversation = await createChatConversation()
      sessionStorage.setItem(pendingChatMessageKey(conversation.conversationId), message)
      await navigate({ to: '/chat/$conversationId', params: { conversationId: conversation.conversationId } })
    } catch (unknownError) {
      setError(toErrorMessage(unknownError, '创建对话失败，请稍后再试。'))
      setStatus('idle')
    }
  }

  return (
    <section className="grid animate-[rise_520ms_ease-out_both] items-end gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.78fr)]">
      <div>
        <p className="eyebrow">AI chat</p>
        <h1 className="max-w-2xl">开始一段新的对话。</h1>
        <p className="lede">输入你想讨论的问题，系统会自动创建会话并保存上下文，之后可以从链接继续接着聊。</p>
      </div>

      <form
        className="overflow-hidden rounded-[22px] border border-[rgba(21,32,24,0.12)] bg-[#fffaf5]/85 shadow-[0_24px_80px_rgba(21,32,24,0.10)]"
        onSubmit={handleSubmit}
      >
        <textarea
          className="block min-h-32 w-full resize-y bg-transparent p-5 leading-7 text-[#152018] outline-none placeholder:text-[#5e6f5f]/75"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={submitOnEnter}
          placeholder="例如：帮我梳理一下这个项目的下一步迭代计划"
          rows={5}
          disabled={status === 'sending'}
        />
        <ComposerFooter
          label={status === 'sending' ? '正在创建会话...' : 'Enter 发送，Shift + Enter 换行'}
          buttonLabel={status === 'sending' ? '发送中' : '开始对话'}
          disabled={!input.trim() || status === 'sending'}
        />
        {error ? <p className="px-5 pb-4 font-bold text-[#a1372a]">{error}</p> : null}
      </form>
    </section>
  )
}
