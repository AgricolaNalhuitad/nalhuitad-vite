# Nalhuitad — Vite Migration

New stack for the Nalhuitad hydroponic operations app. Replaces the legacy React 18 + Babel standalone single-file app at `C:\nalhuitad-app\www\index.html`.

## Stack

Vite 6 + React 19 + TypeScript + Firebase SDK v10 + Zustand + React Query + Vitest.

## Setup

Requires Node 20+ and pnpm 11+.

```bash
pnpm install
```

Create `.env.local` from `.env.example` and fill in your Firebase project credentials.

## Scripts

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Start dev server at http://localhost:5173 |
| `pnpm build` | Type-check + production build → `dist/` |
| `pnpm preview` | Serve the built app locally |
| `pnpm test` | Vitest in watch mode |
| `pnpm test:run` | Vitest single run |
| `pnpm typecheck` | TypeScript check without emitting |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier format |

## Docs

- Spec: `docs/specs/`
- Implementation plans: `docs/plans/`
