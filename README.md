# Bun TypeScript Monorepo

This monorepo contains two Bun + TypeScript apps:

- `apps/api`: Elysia backend service
- `apps/web`: React frontend with TanStack Router

## Scripts

```bash
bun install
bun dev:api
bun dev:web
bun typecheck
bun build
```

The API runs on `http://localhost:3000` by default.
The web app runs on `http://localhost:5173` by default.
