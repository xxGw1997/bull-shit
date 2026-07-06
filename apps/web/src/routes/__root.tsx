import { Link, Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootLayout,
})

export function RootLayout() {
  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Primary navigation">
        <Link to="/" className="brand">
          Bun Monorepo
        </Link>
        <div className="nav-links">
          <Link to="/" activeProps={{ className: 'active' }}>
            Home
          </Link>
          <Link to="/chat" activeProps={{ className: 'active' }}>
            Chat
          </Link>
          <Link to="/about" activeProps={{ className: 'active' }}>
            About
          </Link>
        </div>
      </nav>
      <Outlet />
    </main>
  )
}
