import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

export function HomePage() {
  return (
    <section className="hero">
      <p className="eyebrow">Bun + TypeScript workspace</p>
      <h1>One monorepo for a fast Elysia API and a typed React app.</h1>
      <p className="lede">
        Start both projects independently, share tooling from the root, and call the backend through the Vite `/api` proxy
        during local development.
      </p>
      <div className="actions">
        <a href="/api/health" target="_blank" rel="noreferrer">
          Check API health
        </a>
        <Link to="/about">View stack details</Link>
      </div>
    </section>
  )
}
