export function AboutPage() {
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
