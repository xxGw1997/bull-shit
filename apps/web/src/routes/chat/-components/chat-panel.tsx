import type { UIMessage } from 'ai'

import { useChatPanel } from '../-hooks/use-chat-panel'
import { ChatComposer, ChatNotice, ComposerFooter, MessageBubble } from './chat-ui'

export function ChatPanel({ conversation }: { conversation: { id: string; messages: UIMessage[] } }) {
  const { input, setInput, scrollRef, messages, status, error, stop, regenerate, canSubmit, handleSubmit } = useChatPanel(conversation)

  return (
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

        {status === 'submitted' ? <ThinkingMessage /> : null}
        <div ref={scrollRef} />
      </div>

      <ChatComposer
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        placeholder="继续输入你的问题"
        rows={3}
        disabled={status !== 'ready'}
        footer={
          <ComposerFooter
            label={error ? error.message : status === 'streaming' ? 'AI 正在回复...' : 'Enter 发送，Shift + Enter 换行'}
            buttonLabel={status === 'submitted' || status === 'streaming' ? '停止' : error ? '重试' : '发送'}
            disabled={!canSubmit && !error}
            buttonType={status === 'submitted' || status === 'streaming' || error ? 'button' : 'submit'}
            onButtonClick={status === 'submitted' || status === 'streaming' ? stop : error ? () => regenerate() : undefined}
          />
        }
      />
    </>
  )
}

function ThinkingMessage() {
  return (
    <div className="grid max-w-[min(76%,720px)] justify-items-start gap-2 max-md:max-w-[92%]">
      <div className="rounded-[18px] border border-[rgba(216,111,69,0.24)] bg-[#fffaf5]/90 px-4 py-3 leading-7 text-[#5e6f5f]">
        正在思考...
      </div>
    </div>
  )
}
