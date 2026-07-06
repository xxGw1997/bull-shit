import { createFileRoute } from '@tanstack/react-router'

import { ChatComposer, ComposerFooter } from './-components/chat-ui'
import { useCreateChat } from './-hooks/use-create-chat'

export const Route = createFileRoute('/chat/')({
  component: NewChatPage,
})

export function NewChatPage() {
  const { input, setInput, status, error, isSending, canSubmit, handleSubmit } = useCreateChat()

  return (
    <section className="grid animate-[rise_520ms_ease-out_both] items-end gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.78fr)]">
      <div>
        <p className="eyebrow">AI chat</p>
        <h1 className="max-w-2xl">开始一段新的对话。</h1>
        <p className="lede">输入你想讨论的问题，系统会自动创建会话并保存上下文，之后可以从链接继续接着聊。</p>
      </div>

      <ChatComposer
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        placeholder="例如：帮我梳理一下这个项目的下一步迭代计划"
        rows={5}
        disabled={isSending}
        footer={
          <>
            <ComposerFooter
              label={isSending ? '正在创建会话...' : 'Enter 发送，Shift + Enter 换行'}
              buttonLabel={isSending ? '发送中' : '开始对话'}
              disabled={!canSubmit}
            />
            {error ? <p className="px-5 pb-4 font-bold text-[#a1372a]">{error}</p> : null}
          </>
        }
      />
    </section>
  )
}
