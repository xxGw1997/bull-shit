import { KeyboardEvent, ReactNode } from 'react'
import type { UIMessage } from 'ai'

import { api } from '../api'

export type ChatConversation = {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  messages: UIMessage[]
}

export const pendingChatMessageKey = (conversationId: string) => `pending-chat-message:${conversationId}`

export function ComposerFooter({
  label,
  buttonLabel,
  disabled,
  buttonType = 'submit',
  onButtonClick,
}: {
  label: string
  buttonLabel: string
  disabled: boolean
  buttonType?: 'button' | 'submit'
  onButtonClick?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[rgba(21,32,24,0.12)] p-3 max-md:flex-col max-md:items-stretch">
      <span className="text-sm leading-5 text-[#5e6f5f]">{label}</span>
      <button
        className="flex-none rounded-full bg-[#152018] px-5 py-3 font-extrabold text-[#fffaf0] disabled:cursor-not-allowed disabled:opacity-70 max-md:w-full"
        type={buttonType}
        disabled={disabled}
        onClick={onButtonClick}
      >
        {buttonLabel}
      </button>
    </div>
  )
}

export function MessageBubble({ message }: { message: UIMessage }) {
  const roleLabel = message.role === 'user' ? '你' : message.role === 'assistant' ? 'AI' : message.role
  const isUser = message.role === 'user'

  return (
    <div className={`grid max-w-[min(76%,720px)] gap-2 max-md:max-w-[92%] ${isUser ? 'self-end justify-items-end' : 'self-start justify-items-start'}`}>
      <div className="text-xs font-black uppercase text-[#5e6f5f]">{roleLabel}</div>
      <div
        className={`whitespace-pre-wrap break-words rounded-[18px] border px-4 py-3 leading-7 ${
          isUser
            ? 'border-[#152018]/20 bg-[#22392b] text-[#fffaf0]'
            : 'border-[rgba(216,111,69,0.24)] bg-[#fffaf5]/90 text-[#152018]'
        }`}
      >
        <div className="grid gap-3">
          {message.parts.map((part, index) => (
            <MessagePart key={`${message.id}-${index}`} part={part} />
          ))}
        </div>
      </div>
    </div>
  )
}

type MessagePartValue = UIMessage['parts'][number]

function MessagePart({ part }: { part: MessagePartValue }) {
  if (part.type === 'text') {
    return <span>{part.text}</span>
  }

  if (part.type === 'reasoning') {
    return (
      <details className="rounded-xl border border-[#d86f45]/25 bg-[#f8f0dd]/70 p-3 text-sm text-[#5e4f3d]" open={part.state === 'streaming'}>
        <summary className="cursor-pointer font-black text-[#d86f45]">推理过程 {part.state === 'streaming' ? '生成中' : ''}</summary>
        <div className="mt-2 whitespace-pre-wrap leading-6">{part.text}</div>
      </details>
    )
  }

  if (part.type === 'reasoning-file') {
    return (
      <PartFrame title="推理文件">
        <a className="font-bold underline" href={part.url} target="_blank" rel="noreferrer">
          {part.mediaType}
        </a>
      </PartFrame>
    )
  }

  if (part.type === 'source-url') {
    return (
      <PartFrame title="来源链接">
        <a className="font-bold underline" href={part.url} target="_blank" rel="noreferrer">
          {part.title ?? part.url}
        </a>
      </PartFrame>
    )
  }

  if (part.type === 'source-document') {
    return <PartFrame title="来源文档">{part.title || part.filename || part.mediaType}</PartFrame>
  }

  if (part.type === 'file') {
    return (
      <PartFrame title="文件">
        <a className="font-bold underline" href={part.url} target="_blank" rel="noreferrer">
          {part.filename ?? part.mediaType}
        </a>
      </PartFrame>
    )
  }

  if (part.type === 'step-start') {
    return <div className="text-xs font-black uppercase tracking-[0.16em] text-[#5e6f5f]">New step</div>
  }

  if (part.type === 'dynamic-tool' || part.type.startsWith('tool-')) {
    return <ToolPart part={part} />
  }

  if (part.type.startsWith('data-')) {
    return <PartFrame title={part.type}>{formatJson('data' in part ? part.data : part)}</PartFrame>
  }

  if (part.type === 'custom') {
    return <PartFrame title={`自定义内容：${part.kind}`}>{formatJson(part)}</PartFrame>
  }

  return <PartFrame title={part.type}>{formatJson(part)}</PartFrame>
}

function ToolPart({ part }: { part: MessagePartValue }) {
  const tool = part as MessagePartValue & {
    input?: unknown
    output?: unknown
    errorText?: string
    state?: string
    toolCallId?: string
    toolName?: string
  }
  const toolName = tool.type === 'dynamic-tool' ? tool.toolName : tool.type.replace(/^tool-/, '')

  return (
    <PartFrame title={`工具调用：${toolName}`} badge={tool.state}>
      <div className="grid gap-2">
        {'input' in tool && tool.input !== undefined ? (
          <JsonBlock label={tool.state === 'input-streaming' ? '输入生成中' : '输入'} value={tool.input} />
        ) : null}
        {'output' in tool && tool.output !== undefined ? <JsonBlock label="输出" value={tool.output} /> : null}
        {tool.errorText ? <div className="font-bold text-[#a1372a]">{tool.errorText}</div> : null}
        {'approval' in tool && tool.approval ? <JsonBlock label="审批" value={tool.approval} /> : null}
      </div>
    </PartFrame>
  )
}

function PartFrame({ title, badge, children }: { title: string; badge?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 rounded-xl border border-[#152018]/10 bg-white/35 p-3 text-sm text-[#314536]">
      <div className="flex flex-wrap items-center justify-between gap-2 font-black text-[#152018]">
        <span>{title}</span>
        {badge ? <span className="rounded-full bg-[#152018]/10 px-2 py-1 text-xs text-[#5e6f5f]">{badge}</span> : null}
      </div>
      <div>{children}</div>
    </div>
  )
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="grid gap-1">
      <div className="text-xs font-black uppercase text-[#5e6f5f]">{label}</div>
      <pre className="max-h-64 overflow-auto rounded-lg bg-[#152018]/90 p-3 text-xs leading-5 text-[#fffaf0]">{formatJson(value)}</pre>
    </div>
  )
}

function formatJson(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function ChatNotice({ title, body, tone = 'default' }: { title: string; body: string; tone?: 'default' | 'danger' }) {
  return (
    <div
      className={`grid gap-1 rounded-[18px] border border-dashed bg-[#fffaf5]/60 p-5 ${
        tone === 'danger' ? 'border-[#a1372a]/30 text-[#8c342b]' : 'border-[#152018]/25 text-[#5e6f5f]'
      }`}
    >
      <strong className="text-[#152018]">{title}</strong>
      <span>{body}</span>
    </div>
  )
}

export function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }
}

export async function createChatConversation() {
  const { data, error } = await api.api.chat.create.get()

  if (error || !data || !('conversationId' in data)) {
    throw error
  }

  return data
}

export async function getChatConversation(conversationId: string): Promise<ChatConversation> {
  const { data, error } = await api.api.chat({ conversationId }).get()

  if (error || !data || !('messages' in data)) {
    throw error
  }

  return data as ChatConversation
}

export function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object' && 'value' in error) {
    const value = (error as { value?: { message?: string } }).value
    return value?.message ?? fallback
  }

  return fallback
}
