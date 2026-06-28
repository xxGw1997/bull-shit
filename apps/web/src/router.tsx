import { createRootRoute, createRoute, createRouter, Link, Outlet } from '@tanstack/react-router'

const rootRoute = createRootRoute({
  component: () => (
    <main className="app-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <Link to="/" className="brand">
          Bun Monorepo
        </Link>
        <div className="nav-links">
          <Link to="/" activeProps={{ className: 'active' }}>
            Home
          </Link>
          <Link to="/about" activeProps={{ className: 'active' }}>
            About
          </Link>
        </div>
      </nav>
      <Outlet />
    </main>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: AboutPage,
})

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function HomePage() {
  return (
    <section className="hero">
      <p className="eyebrow">Bun + TypeScript workspace</p>
      <h1>One monorepo for a fast Elysia API and a typed React app.</h1>
      <p className="lede">
        Start both projects independently, share tooling from the root, and call the backend through the Vite
        `/api` proxy during local development.
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

function AboutPage() {
  return (
    <section className="panel">
      <p className="eyebrow">Included apps</p>
      <h1>Ready-to-extend project layout.</h1>
      <div className="cards">
        <article>
          <h2>apps/api</h2>
          <p>Elysia server running on Bun with CORS and health endpoints.</p>
        </article>
        <article>
          <h2>apps/web</h2>
          <p>React app powered by Vite and TanStack Router code-based routes.</p>
        </article>
      </div>
    </section>
  )
}
