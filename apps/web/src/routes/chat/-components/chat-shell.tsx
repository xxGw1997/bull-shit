import { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

export function ChatShell({ title, body }: { title: string; body: ReactNode }) {
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
