# Fase A Sprint 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Vite 6 + React 19 + TypeScript + Firebase SDK v10 scaffold for `C:\nalhuitad-vite\` with a complete authentication layer (login, session persistence, Zustand store, protected/public routes, React Query, AppShell with tab nav placeholders, theming, Vitest+RTL). Legacy app in `C:\nalhuitad-app\` is not touched.

**Architecture:** Feature-based folder structure (`src/features/<x>/` for domain code, `src/shared/` for cross-cutting UI, `src/lib/` for external integrations). Single `onAuthStateChanged` subscription in `useAuthBootstrap` writes to a Zustand store. Routes wrapped in `ProtectedRoute` or `PublicRoute` read from the store and redirect accordingly. CSS Modules + CSS variables for styling (no Tailwind).

**Tech Stack:** Vite 6, React 19, TypeScript 5 (strict), React Router 7 (`createBrowserRouter`), Firebase SDK 10 (Auth + Firestore initialized), Zustand 5, TanStack React Query 5, Vitest 2 + React Testing Library 16, ESLint 9 (flat config) + Prettier 3, pnpm 11.

**Spec reference:** `C:\nalhuitad-vite\docs\specs\2026-05-18-fase-a-scaffold-auth.md`

**Working directory throughout this plan:** `C:\nalhuitad-vite\`

---

## File Structure (created by this plan)

```
C:\nalhuitad-vite\
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
├── README.md
├── docs/
│   ├── specs/2026-05-18-fase-a-scaffold-auth.md     (already exists)
│   └── plans/2026-05-18-fase-a-scaffold-auth.md     (this file, already exists)
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── router.tsx
    ├── vite-env.d.ts
    ├── features/
    │   └── auth/
    │       ├── LoginScreen.tsx
    │       ├── LoginScreen.module.css
    │       ├── LoginScreen.test.tsx
    │       ├── ProtectedRoute.tsx
    │       ├── ProtectedRoute.test.tsx
    │       ├── PublicRoute.tsx
    │       ├── PublicRoute.test.tsx
    │       ├── useSessionStore.ts
    │       ├── useSessionStore.test.ts
    │       ├── useAuth.ts
    │       ├── useAuth.test.ts
    │       ├── useAuthBootstrap.ts
    │       ├── useAuthBootstrap.test.ts
    │       ├── errors.ts
    │       └── errors.test.ts
    ├── shared/components/
    │   ├── AppShell.tsx
    │   ├── AppShell.module.css
    │   ├── SplashScreen.tsx
    │   ├── SplashScreen.module.css
    │   ├── PlaceholderScreen.tsx
    │   ├── PlaceholderScreen.module.css
    │   ├── MasMenu.tsx
    │   └── MasMenu.module.css
    ├── lib/
    │   ├── firebase.ts
    │   ├── queryClient.ts
    │   └── theme.ts
    ├── styles/
    │   ├── tokens.css
    │   └── global.css
    └── tests/
        └── setup.ts
```

---

# Phase 1 — Foundation

## Task 1: Initialize repo + commit the spec

**Files:**
- Create: `.gitignore`, `README.md`
- Already present: `docs/specs/2026-05-18-fase-a-scaffold-auth.md`, `docs/plans/2026-05-18-fase-a-scaffold-auth.md`

- [ ] **Step 1: Initialize git repo**

Run from `C:\nalhuitad-vite\`:

```bash
git init -b main
```

Expected: `Initialized empty Git repository in C:/nalhuitad-vite/.git/`

- [ ] **Step 2: Create `.gitignore`**

```
node_modules
dist
.env.local
.env.*.local
*.log
.vite
coverage
.DS_Store
*.tsbuildinfo
```

- [ ] **Step 3: Create `README.md`**

```markdown
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
```

- [ ] **Step 4: First commit**

```bash
git add .gitignore README.md docs/
git commit -m "chore: init repo with design spec and implementation plan"
```

Expected: commit succeeds. `git status` shows clean working tree.

---

## Task 2: Vite + React + TypeScript scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "nalhuitad-vite",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "^11",
      "onFail": "download"
    }
  }
}
```

- [ ] **Step 2: Install runtime and dev dependencies**

```bash
pnpm add react@^19 react-dom@^19
pnpm add -D vite@^6 @vitejs/plugin-react@^4 typescript@^5 @types/react@^19 @types/react-dom@^19 vite-tsconfig-paths
```

Expected: pnpm-lock.yaml created, no peer-dep warnings (or only minor ones).

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "useDefineForClassFields": true,
    "allowImportingTsExtensions": false,
    "verbatimModuleSyntax": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 5: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: { port: 5173 },
});
```

- [ ] **Step 6: Create `index.html`**

```html
<!doctype html>
<html lang="es" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Nalhuitad</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

- [ ] **Step 8: Create `src/App.tsx`**

```tsx
export function App() {
  return <div>Hello Nalhuitad</div>;
}
```

- [ ] **Step 9: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 10: Verify typecheck and dev server**

```bash
pnpm typecheck
```

Expected: no output, exit code 0.

```bash
pnpm dev
```

Expected: `VITE v6.x.x ready in Xms` and `Local: http://localhost:5173/`. Open in browser, see "Hello Nalhuitad". Stop with Ctrl+C.

- [ ] **Step 11: Commit**

```bash
git add .
git commit -m "feat: vite + react 19 + typescript scaffold"
```

---

## Task 3: ESLint + Prettier

**Files:**
- Create: `eslint.config.js`, `.prettierrc`, `.prettierignore`
- Modify: `package.json` (add scripts)

- [ ] **Step 1: Install ESLint + Prettier + plugins**

```bash
pnpm add -D eslint@^9 @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals prettier@^3 eslint-config-prettier
```

- [ ] **Step 2: Create `eslint.config.js`**

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', '.vite'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  prettierConfig,
);
```

- [ ] **Step 3: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "arrowParens": "always"
}
```

- [ ] **Step 4: Create `.prettierignore`**

```
node_modules
dist
coverage
pnpm-lock.yaml
.vite
*.tsbuildinfo
```

- [ ] **Step 5: Add scripts to `package.json`**

Add to the existing `"scripts"` object:

```json
"lint": "eslint .",
"format": "prettier --write \"src/**/*.{ts,tsx,css,md}\""
```

- [ ] **Step 6: Verify lint passes**

```bash
pnpm lint
```

Expected: no errors, no warnings (the React 19 scaffold has no issues).

If `react-refresh/only-export-components` warns on `App.tsx`, fix by ensuring `App` is the only export.

- [ ] **Step 7: Format all files**

```bash
pnpm format
```

Expected: prints formatted file list, no errors.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "chore: add eslint flat config and prettier"
```

---

## Task 4: Vitest + React Testing Library

**Files:**
- Create: `vitest.config.ts`, `src/tests/setup.ts`, `src/tests/smoke.test.ts`
- Modify: `package.json` (add test scripts)

- [ ] **Step 1: Install Vitest + RTL + jsdom**

```bash
pnpm add -D vitest@^2 @vitest/ui @vitest/coverage-v8 @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14 jsdom@^25
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/tests/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: ['**/*.test.{ts,tsx}', 'src/tests/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      },
    },
  }),
);
```

- [ ] **Step 3: Create `src/tests/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  setPersistence: vi.fn(),
  browserLocalPersistence: 'browserLocalPersistence',
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
}));

vi.mock('@/lib/firebase', () => ({
  app: {},
  auth: {},
  db: {},
}));
```

- [ ] **Step 4: Update `tsconfig.json` to include test types**

Add to `compilerOptions.types` array (create the field if missing):

```json
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 5: Create smoke test `src/tests/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest';

describe('test infrastructure', () => {
  it('runs and reports', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Add test scripts to `package.json`**

```json
"test": "vitest",
"test:run": "vitest run",
"test:ui": "vitest --ui"
```

- [ ] **Step 7: Run the smoke test**

```bash
pnpm test:run
```

Expected: 1 test file, 1 test, 1 passed. Exit code 0.

- [ ] **Step 8: Run typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: both succeed.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "test: add vitest + rtl with smoke test"
```

---

## Task 5: Theming foundation (tokens, global, theme module)

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `src/lib/theme.ts`
- Modify: `src/main.tsx` (import styles)

- [ ] **Step 1: Create `src/styles/tokens.css`**

```css
:root,
[data-theme='dark'] {
  --bg-1: #0F1219;
  --bg-2: #1A1F2E;
  --bg-card: #1E2538;
  --bg-card-h: #242D44;
  --bg-input: #1A2030;
  --text-1: #F0F2F5;
  --text-2: #8A9BBF;
  --text-3: #556180;
  --border: #2A3350;
  --sep: #181E2E;
  --stage-a: #C4873B;
  --stage-t: #3B8DD4;
  --stage-r: #B83D7A;
  --stage-c: #7C4DDB;
  --green: #4ADE80;
  --red: #F87171;
  --amber: #FBBF24;
  --nav-bg: #0E1320;
  --nav-active: #4ADE80;
  --nav-inactive: #6B7FA3;
}

[data-theme='light'] {
  --bg-1: #F5F7FA;
  --bg-2: #EEF1F8;
  --bg-card: #FFFFFF;
  --bg-card-h: #EEF1F8;
  --bg-input: #F5F7FA;
  --text-1: #1A1E2E;
  --text-2: #4A5675;
  --text-3: #7A8BA8;
  --border: #CDD4E8;
  --sep: #E2E7F2;
  --stage-a: #B8701A;
  --stage-t: #1E6DB5;
  --stage-r: #A02870;
  --stage-c: #6B3FA0;
  --green: #157A40;
  --red: #C0392B;
  --amber: #C47A1A;
  --nav-bg: #FFFFFF;
  --nav-active: #157A40;
  --nav-inactive: #7A8BA8;
}
```

- [ ] **Step 2: Create `src/styles/global.css`**

```css
@import './tokens.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  padding: 0;
  height: 100%;
}

body {
  background: var(--bg-1);
  color: var(--text-1);
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-size: 15px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}

input,
button,
textarea,
select {
  font: inherit;
  color: inherit;
}

button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}
```

- [ ] **Step 3: Create `src/lib/theme.ts`**

```ts
export const colors = {
  dark: {
    bg1: '#0F1219',
    bg2: '#1A1F2E',
    bgCard: '#1E2538',
    bgCardH: '#242D44',
    bgInput: '#1A2030',
    text1: '#F0F2F5',
    text2: '#8A9BBF',
    text3: '#556180',
    border: '#2A3350',
    sep: '#181E2E',
    stageA: '#C4873B',
    stageT: '#3B8DD4',
    stageR: '#B83D7A',
    stageC: '#7C4DDB',
    green: '#4ADE80',
    red: '#F87171',
    amber: '#FBBF24',
    navBg: '#0E1320',
    navActive: '#4ADE80',
    navInactive: '#6B7FA3',
  },
  light: {
    bg1: '#F5F7FA',
    bg2: '#EEF1F8',
    bgCard: '#FFFFFF',
    bgCardH: '#EEF1F8',
    bgInput: '#F5F7FA',
    text1: '#1A1E2E',
    text2: '#4A5675',
    text3: '#7A8BA8',
    border: '#CDD4E8',
    sep: '#E2E7F2',
    stageA: '#B8701A',
    stageT: '#1E6DB5',
    stageR: '#A02870',
    stageC: '#6B3FA0',
    green: '#157A40',
    red: '#C0392B',
    amber: '#C47A1A',
    navBg: '#FFFFFF',
    navActive: '#157A40',
    navInactive: '#7A8BA8',
  },
} as const;

export type ColorToken = keyof typeof colors.dark;

function kebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function cssVar(token: ColorToken): string {
  return `var(--${kebab(token)})`;
}
```

- [ ] **Step 4: Import global styles in `src/main.tsx`**

Add at the top of `src/main.tsx`, before other imports:

```ts
import './styles/global.css';
```

- [ ] **Step 5: Verify dev server shows dark background**

```bash
pnpm dev
```

Open http://localhost:5173 — background is `#0F1219` (very dark blue-black), text is `#F0F2F5` (off-white). Stop with Ctrl+C.

- [ ] **Step 6: Run all checks**

```bash
pnpm typecheck && pnpm lint && pnpm test:run
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: theme tokens (css variables + ts module) and global styles"
```

---

# Phase 2 — Firebase + state

## Task 6: Firebase init module + env example

**Files:**
- Create: `.env.example`, `src/lib/firebase.ts`

- [ ] **Step 1: Install Firebase**

```bash
pnpm add firebase@^10
```

- [ ] **Step 2: Create `.env.example`**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

- [ ] **Step 3: Create `src/lib/firebase.ts`**

```ts
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

type RequiredVar = (typeof REQUIRED_VARS)[number];

function readConfig(): Record<RequiredVar, string> {
  const missing: RequiredVar[] = [];
  const config = {} as Record<RequiredVar, string>;
  for (const key of REQUIRED_VARS) {
    const value = import.meta.env[key];
    if (!value) {
      missing.push(key);
    } else {
      config[key] = value;
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Firebase config inválida — faltan variables de entorno: ${missing.join(', ')}. ` +
        `Copia .env.example a .env.local y completa los valores.`,
    );
  }
  return config;
}

const env = readConfig();

export const app: FirebaseApp = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
```

- [ ] **Step 4: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

Note: this module is mocked in tests (`src/tests/setup.ts` already mocks `@/lib/firebase` and `firebase/*`), so `pnpm test:run` doesn't need real env vars. Dev server (`pnpm dev`) will throw the validation error until Grigor creates `.env.local` — that's expected.

- [ ] **Step 5: Verify tests still pass**

```bash
pnpm test:run
```

Expected: smoke test passes.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: firebase init with env validation"
```

---

## Task 7: React Query client

**Files:**
- Create: `src/lib/queryClient.ts`

- [ ] **Step 1: Install React Query**

```bash
pnpm add @tanstack/react-query@^5
```

- [ ] **Step 2: Create `src/lib/queryClient.ts`**

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: react query client with conservative defaults"
```

---

## Task 8: Session store (TDD)

**Files:**
- Create: `src/features/auth/useSessionStore.ts`, `src/features/auth/useSessionStore.test.ts`

- [ ] **Step 1: Install Zustand**

```bash
pnpm add zustand@^5
```

- [ ] **Step 2: Write failing test `src/features/auth/useSessionStore.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from './useSessionStore';

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({ user: null, status: 'initializing' });
  });

  it('starts in initializing status with null user', () => {
    const state = useSessionStore.getState();
    expect(state.status).toBe('initializing');
    expect(state.user).toBeNull();
  });

  it('reflects authenticated state after setState', () => {
    const fakeUser = { uid: 'u1', email: 'a@b.cl' } as any;
    useSessionStore.setState({ user: fakeUser, status: 'authenticated' });
    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(useSessionStore.getState().user?.uid).toBe('u1');
  });

  it('reflects unauthenticated state after setState', () => {
    useSessionStore.setState({ user: null, status: 'unauthenticated' });
    expect(useSessionStore.getState().status).toBe('unauthenticated');
    expect(useSessionStore.getState().user).toBeNull();
  });
});
```

- [ ] **Step 3: Run test — expect FAIL**

```bash
pnpm test:run src/features/auth/useSessionStore.test.ts
```

Expected: import error — module `./useSessionStore` not found.

- [ ] **Step 4: Implement `src/features/auth/useSessionStore.ts`**

```ts
import { create } from 'zustand';
import type { User } from 'firebase/auth';

export type SessionStatus = 'initializing' | 'authenticated' | 'unauthenticated';

export interface SessionState {
  user: User | null;
  status: SessionStatus;
}

export const useSessionStore = create<SessionState>(() => ({
  user: null,
  status: 'initializing',
}));
```

- [ ] **Step 5: Run test — expect PASS**

```bash
pnpm test:run src/features/auth/useSessionStore.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 6: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: both succeed.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(auth): session store with status machine"
```

---

## Task 9: Error code mapping (TDD)

**Files:**
- Create: `src/features/auth/errors.ts`, `src/features/auth/errors.test.ts`

- [ ] **Step 1: Write failing test `src/features/auth/errors.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { mapAuthError } from './errors';

describe('mapAuthError', () => {
  it('maps invalid-credential to Spanish message', () => {
    expect(mapAuthError({ code: 'auth/invalid-credential' })).toBe(
      'Email o contraseña incorrectos',
    );
  });

  it('maps invalid-email', () => {
    expect(mapAuthError({ code: 'auth/invalid-email' })).toBe('Email inválido');
  });

  it('maps user-disabled', () => {
    expect(mapAuthError({ code: 'auth/user-disabled' })).toBe('Esta cuenta está deshabilitada');
  });

  it('maps network-request-failed', () => {
    expect(mapAuthError({ code: 'auth/network-request-failed' })).toBe(
      'Sin conexión. Revisa tu red.',
    );
  });

  it('maps too-many-requests', () => {
    expect(mapAuthError({ code: 'auth/too-many-requests' })).toBe(
      'Demasiados intentos. Espera unos minutos.',
    );
  });

  it('falls back to generic message for unknown code', () => {
    expect(mapAuthError({ code: 'auth/some-new-thing' })).toBe(
      'Error de autenticación. Reintenta.',
    );
  });

  it('falls back for non-object input', () => {
    expect(mapAuthError(null)).toBe('Error de autenticación. Reintenta.');
    expect(mapAuthError(undefined)).toBe('Error de autenticación. Reintenta.');
    expect(mapAuthError('string error')).toBe('Error de autenticación. Reintenta.');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm test:run src/features/auth/errors.test.ts
```

Expected: module not found.

- [ ] **Step 3: Implement `src/features/auth/errors.ts`**

```ts
const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email o contraseña incorrectos',
  'auth/invalid-email': 'Email inválido',
  'auth/user-disabled': 'Esta cuenta está deshabilitada',
  'auth/user-not-found': 'Email o contraseña incorrectos',
  'auth/wrong-password': 'Email o contraseña incorrectos',
  'auth/network-request-failed': 'Sin conexión. Revisa tu red.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
};

const FALLBACK = 'Error de autenticación. Reintenta.';

export function mapAuthError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string' && code in MESSAGES) {
      return MESSAGES[code];
    }
  }
  return FALLBACK;
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm test:run src/features/auth/errors.test.ts
```

Expected: 7 tests pass.

- [ ] **Step 5: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(auth): firebase error code mapping to spanish messages"
```

---

# Phase 3 — Auth hooks

## Task 10: useAuth hook (TDD)

**Files:**
- Create: `src/features/auth/useAuth.ts`, `src/features/auth/useAuth.test.ts`

- [ ] **Step 1: Write failing test `src/features/auth/useAuth.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signIn returns ok: true on success', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: 'u1', email: 'a@b.cl' },
    } as any);

    const { result } = renderHook(() => useAuth());
    let res: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signIn('a@b.cl', 'pw');
    });
    expect(res).toEqual({ ok: true });
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'a@b.cl', 'pw');
  });

  it('signIn returns ok: false with mapped error on failure', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce({
      code: 'auth/invalid-credential',
    });

    const { result } = renderHook(() => useAuth());
    let res: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signIn('a@b.cl', 'wrong');
    });
    expect(res).toEqual({ ok: false, error: 'Email o contraseña incorrectos' });
  });

  it('signIn falls back to generic error on unknown failure', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() => useAuth());
    let res: { ok: boolean; error?: string } | undefined;
    await act(async () => {
      res = await result.current.signIn('a@b.cl', 'pw');
    });
    expect(res).toEqual({ ok: false, error: 'Error de autenticación. Reintenta.' });
  });

  it('signOut calls firebase signOut', async () => {
    vi.mocked(signOut).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signOut();
    });
    expect(signOut).toHaveBeenCalledWith({});
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (module not found)**

```bash
pnpm test:run src/features/auth/useAuth.test.ts
```

Expected: import error.

- [ ] **Step 3: Implement `src/features/auth/useAuth.ts`**

```ts
import { useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { mapAuthError } from './errors';

export type SignInResult = { ok: true } | { ok: false; error: string };

export function useAuth() {
  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: mapAuthError(e) };
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await fbSignOut(auth);
  }, []);

  return { signIn, signOut };
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm test:run src/features/auth/useAuth.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(auth): useAuth hook with signIn/signOut and error mapping"
```

---

## Task 11: useAuthBootstrap hook (TDD)

**Files:**
- Create: `src/features/auth/useAuthBootstrap.ts`, `src/features/auth/useAuthBootstrap.test.ts`

- [ ] **Step 1: Write failing test `src/features/auth/useAuthBootstrap.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { onAuthStateChanged, setPersistence } from 'firebase/auth';
import { useAuthBootstrap } from './useAuthBootstrap';
import { useSessionStore } from './useSessionStore';

describe('useAuthBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({ user: null, status: 'initializing' });
  });

  it('configures persistence and subscribes to auth changes', () => {
    const unsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValue(unsubscribe);

    renderHook(() => useAuthBootstrap());

    expect(setPersistence).toHaveBeenCalled();
    expect(onAuthStateChanged).toHaveBeenCalledTimes(1);
  });

  it('writes authenticated state when callback fires with user', () => {
    let captured: ((u: any) => void) | null = null;
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb: any) => {
      captured = cb;
      return vi.fn();
    });

    renderHook(() => useAuthBootstrap());
    expect(captured).not.toBeNull();
    captured!({ uid: 'u1', email: 'a@b.cl' });

    const state = useSessionStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.user?.uid).toBe('u1');
  });

  it('writes unauthenticated state when callback fires with null', () => {
    let captured: ((u: any) => void) | null = null;
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, cb: any) => {
      captured = cb;
      return vi.fn();
    });

    renderHook(() => useAuthBootstrap());
    captured!(null);

    const state = useSessionStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.user).toBeNull();
  });

  it('calls unsubscribe on cleanup', () => {
    const unsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useAuthBootstrap());
    unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm test:run src/features/auth/useAuthBootstrap.test.ts
```

Expected: module not found.

- [ ] **Step 3: Implement `src/features/auth/useAuthBootstrap.ts`**

```ts
import { useEffect } from 'react';
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useSessionStore } from './useSessionStore';

export function useAuthBootstrap(): void {
  useEffect(() => {
    void setPersistence(auth, browserLocalPersistence);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      useSessionStore.setState({
        user,
        status: user ? 'authenticated' : 'unauthenticated',
      });
    });
    return unsubscribe;
  }, []);
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm test:run src/features/auth/useAuthBootstrap.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Run all checks**

```bash
pnpm typecheck && pnpm lint && pnpm test:run
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(auth): bootstrap hook subscribes to onAuthStateChanged"
```

---

# Phase 4 — UI components

## Task 12: SplashScreen + PlaceholderScreen

**Files:**
- Create: `src/shared/components/SplashScreen.tsx`, `src/shared/components/SplashScreen.module.css`, `src/shared/components/PlaceholderScreen.tsx`, `src/shared/components/PlaceholderScreen.module.css`

- [ ] **Step 1: Create `src/shared/components/SplashScreen.tsx`**

```tsx
import styles from './SplashScreen.module.css';

export function SplashScreen() {
  return (
    <div className={styles.root} role="status" aria-live="polite">
      <div className={styles.spinner} />
      <p className={styles.label}>Cargando…</p>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/shared/components/SplashScreen.module.css`**

```css
.root {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--bg-1);
  color: var(--text-2);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--green);
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.label {
  margin: 0;
  font-size: 14px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

- [ ] **Step 3: Create `src/shared/components/PlaceholderScreen.tsx`**

```tsx
import styles from './PlaceholderScreen.module.css';

interface Props {
  name: string;
}

export function PlaceholderScreen({ name }: Props) {
  return (
    <section className={styles.root}>
      <h1 className={styles.title}>{name}</h1>
      <p className={styles.note}>Próximamente — pantalla {name} de la migración Fase A.</p>
    </section>
  );
}
```

- [ ] **Step 4: Create `src/shared/components/PlaceholderScreen.module.css`**

```css
.root {
  padding: 24px 16px;
  max-width: 600px;
  margin: 0 auto;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--text-1);
}

.note {
  margin: 0;
  color: var(--text-2);
  font-size: 14px;
}
```

- [ ] **Step 5: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(ui): SplashScreen and PlaceholderScreen components"
```

---

## Task 13: MasMenu component

**Files:**
- Create: `src/shared/components/MasMenu.tsx`, `src/shared/components/MasMenu.module.css`

- [ ] **Step 1: Install react-router-dom**

```bash
pnpm add react-router-dom@^7
```

- [ ] **Step 2: Create `src/shared/components/MasMenu.tsx`**

```tsx
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import styles from './MasMenu.module.css';

const ITEMS = [
  { slug: 'nuevo', label: 'Nuevo lote' },
  { slug: 'historial', label: 'Historial' },
  { slug: 'notas', label: 'Notas' },
  { slug: 'clinica', label: 'Clínica' },
  { slug: 'sensores', label: 'Sensores' },
  { slug: 'config', label: 'Configuración' },
] as const;

export function MasMenu() {
  const { signOut } = useAuth();

  return (
    <section className={styles.root}>
      <h1 className={styles.title}>Más</h1>
      <nav className={styles.list}>
        {ITEMS.map((item) => (
          <Link key={item.slug} to={`/mas/${item.slug}`} className={styles.item}>
            {item.label}
          </Link>
        ))}
      </nav>
      <button type="button" onClick={() => void signOut()} className={styles.signOut}>
        Cerrar sesión
      </button>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/shared/components/MasMenu.module.css`**

```css
.root {
  padding: 24px 16px;
  max-width: 600px;
  margin: 0 auto;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--text-1);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--sep);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}

.item {
  display: block;
  padding: 14px 16px;
  background: var(--bg-card);
  color: var(--text-1);
  font-size: 15px;
}

.item:hover {
  background: var(--bg-card-h);
}

.signOut {
  width: 100%;
  padding: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--red);
  font-size: 15px;
  font-weight: 500;
}

.signOut:hover {
  background: var(--bg-card-h);
}
```

- [ ] **Step 4: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(ui): MasMenu with secondary screens list and signOut"
```

---

## Task 14: AppShell layout + bottom tab nav

**Files:**
- Create: `src/shared/components/AppShell.tsx`, `src/shared/components/AppShell.module.css`

- [ ] **Step 1: Create `src/shared/components/AppShell.tsx`**

```tsx
import { NavLink, Outlet } from 'react-router-dom';
import styles from './AppShell.module.css';

const TABS = [
  { to: '/lotes', label: 'Lotes', icon: '🌱' },
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/alertas', label: 'Alertas', icon: '🔔' },
  { to: '/produccion', label: 'Producción', icon: '📦' },
  { to: '/mas', label: 'Más', icon: '⋯' },
] as const;

export function AppShell() {
  return (
    <div className={styles.root}>
      <main className={styles.content}>
        <Outlet />
      </main>
      <nav className={styles.nav} aria-label="Navegación principal">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `${styles.tab} ${isActive ? styles.tabActive : ''}`.trim()
            }
          >
            <span className={styles.icon} aria-hidden="true">
              {tab.icon}
            </span>
            <span className={styles.label}>{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/shared/components/AppShell.module.css`**

```css
.root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg-1);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 72px;
}

.nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  background: var(--nav-bg);
  border-top: 1px solid var(--border);
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 4px;
  color: var(--nav-inactive);
  font-size: 11px;
  font-weight: 500;
}

.tabActive {
  color: var(--nav-active);
}

.icon {
  font-size: 20px;
  line-height: 1;
}

.label {
  font-size: 11px;
}
```

- [ ] **Step 3: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(ui): AppShell with bottom tab nav"
```

---

## Task 15: ProtectedRoute (TDD)

**Files:**
- Create: `src/features/auth/ProtectedRoute.tsx`, `src/features/auth/ProtectedRoute.test.tsx`

- [ ] **Step 1: Write failing test `src/features/auth/ProtectedRoute.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useSessionStore } from './useSessionStore';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>secret</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useSessionStore.setState({ user: null, status: 'initializing' });
  });

  it('renders SplashScreen while initializing', () => {
    renderAt('/protected');
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    useSessionStore.setState({ user: null, status: 'unauthenticated' });
    renderAt('/protected');
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    useSessionStore.setState({ user: { uid: 'u1' } as any, status: 'authenticated' });
    renderAt('/protected');
    expect(screen.getByText('secret')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm test:run src/features/auth/ProtectedRoute.test.tsx
```

Expected: module not found.

- [ ] **Step 3: Implement `src/features/auth/ProtectedRoute.tsx`**

```tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionStore } from './useSessionStore';
import { SplashScreen } from '@/shared/components/SplashScreen';

interface Props {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const status = useSessionStore((s) => s.status);

  if (status === 'initializing') return <SplashScreen />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm test:run src/features/auth/ProtectedRoute.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Run all checks**

```bash
pnpm typecheck && pnpm lint && pnpm test:run
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(auth): ProtectedRoute with splash + redirect logic"
```

---

## Task 16: PublicRoute (TDD)

**Files:**
- Create: `src/features/auth/PublicRoute.tsx`, `src/features/auth/PublicRoute.test.tsx`

- [ ] **Step 1: Write failing test `src/features/auth/PublicRoute.test.tsx`**

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PublicRoute } from './PublicRoute';
import { useSessionStore } from './useSessionStore';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <div>login form</div>
            </PublicRoute>
          }
        />
        <Route path="/" element={<div>home page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PublicRoute', () => {
  beforeEach(() => {
    useSessionStore.setState({ user: null, status: 'initializing' });
  });

  it('renders SplashScreen while initializing', () => {
    renderAt('/login');
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(screen.queryByText('login form')).not.toBeInTheDocument();
  });

  it('redirects to / when authenticated', () => {
    useSessionStore.setState({ user: { uid: 'u1' } as any, status: 'authenticated' });
    renderAt('/login');
    expect(screen.getByText('home page')).toBeInTheDocument();
    expect(screen.queryByText('login form')).not.toBeInTheDocument();
  });

  it('renders children when unauthenticated', () => {
    useSessionStore.setState({ user: null, status: 'unauthenticated' });
    renderAt('/login');
    expect(screen.getByText('login form')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm test:run src/features/auth/PublicRoute.test.tsx
```

Expected: module not found.

- [ ] **Step 3: Implement `src/features/auth/PublicRoute.tsx`**

```tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionStore } from './useSessionStore';
import { SplashScreen } from '@/shared/components/SplashScreen';

interface Props {
  children: ReactNode;
}

export function PublicRoute({ children }: Props) {
  const status = useSessionStore((s) => s.status);

  if (status === 'initializing') return <SplashScreen />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm test:run src/features/auth/PublicRoute.test.tsx
```

Expected: 3 tests pass.

- [ ] **Step 5: Run all checks**

```bash
pnpm typecheck && pnpm lint && pnpm test:run
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat(auth): PublicRoute redirects authenticated users away from /login"
```

---

## Task 17: LoginScreen (TDD)

**Files:**
- Create: `src/features/auth/LoginScreen.tsx`, `src/features/auth/LoginScreen.module.css`, `src/features/auth/LoginScreen.test.tsx`

- [ ] **Step 1: Write failing test `src/features/auth/LoginScreen.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { MemoryRouter } from 'react-router-dom';
import { LoginScreen } from './LoginScreen';

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginScreen />
    </MemoryRouter>,
  );
}

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email, password, and submit button', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('does not call signIn when fields are empty', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
    expect(screen.getByText(/completa email y contraseña/i)).toBeInTheDocument();
  });

  it('does not call signIn when email is whitespace only', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), '   ');
    await user.type(screen.getByLabelText(/contraseña/i), 'pw');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it('calls signIn with trimmed email and password on valid submit', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({
      user: { uid: 'u1' },
    } as any);
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), '  a@b.cl  ');
    await user.type(screen.getByLabelText(/contraseña/i), 'pw123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'a@b.cl', 'pw123');
  });

  it('shows mapped error message on signIn failure', async () => {
    vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce({
      code: 'auth/invalid-credential',
    });
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'a@b.cl');
    await user.type(screen.getByLabelText(/contraseña/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(await screen.findByText(/email o contraseña incorrectos/i)).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    let resolve!: (v: any) => void;
    vi.mocked(signInWithEmailAndPassword).mockReturnValueOnce(
      new Promise((r) => {
        resolve = r;
      }) as any,
    );
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText(/email/i), 'a@b.cl');
    await user.type(screen.getByLabelText(/contraseña/i), 'pw');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled();
    resolve({ user: { uid: 'u1' } });
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm test:run src/features/auth/LoginScreen.test.tsx
```

Expected: module not found.

- [ ] **Step 3: Implement `src/features/auth/LoginScreen.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { useAuth } from './useAuth';
import styles from './LoginScreen.module.css';

type Status = 'idle' | 'submitting' | 'error';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (trimmedEmail === '' || password === '') {
      setStatus('error');
      setError('Completa email y contraseña');
      return;
    }
    setStatus('submitting');
    setError(null);
    const result = await signIn(trimmedEmail, password);
    if (result.ok) {
      setStatus('idle');
    } else {
      setStatus('error');
      setError(result.error);
    }
  };

  return (
    <div className={styles.root}>
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <h1 className={styles.title}>Nalhuitad</h1>
        <p className={styles.subtitle}>Ingresa a tu cuenta</p>

        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            disabled={status === 'submitting'}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            disabled={status === 'submitting'}
          />
        </label>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className={styles.button} disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/features/auth/LoginScreen.module.css`**

```css
.root {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--bg-1);
}

.card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--text-1);
  text-align: center;
}

.subtitle {
  margin: 0 0 8px;
  text-align: center;
  color: var(--text-2);
  font-size: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 13px;
  color: var(--text-2);
  font-weight: 500;
}

.input {
  padding: 12px 14px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-1);
  font-size: 15px;
  outline: none;
  transition: border-color 0.15s;
}

.input:focus {
  border-color: var(--green);
}

.input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  margin: 0;
  padding: 10px 12px;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid var(--red);
  border-radius: 8px;
  color: var(--red);
  font-size: 13px;
}

.button {
  margin-top: 8px;
  padding: 13px;
  background: var(--green);
  color: #0F1219;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  transition: opacity 0.15s;
}

.button:hover:not(:disabled) {
  opacity: 0.9;
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Run test — expect PASS**

```bash
pnpm test:run src/features/auth/LoginScreen.test.tsx
```

Expected: 6 tests pass.

- [ ] **Step 6: Run all checks**

```bash
pnpm typecheck && pnpm lint && pnpm test:run
```

Expected: all green; total test count now around 23 tests across 7 files.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(auth): LoginScreen with form validation and error display"
```

---

# Phase 5 — Wire-up

## Task 18: Router

**Files:**
- Create: `src/router.tsx`

- [ ] **Step 1: Create `src/router.tsx`**

```tsx
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { PublicRoute } from '@/features/auth/PublicRoute';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { AppShell } from '@/shared/components/AppShell';
import { PlaceholderScreen } from '@/shared/components/PlaceholderScreen';
import { MasMenu } from '@/shared/components/MasMenu';

function MasSubScreen() {
  const { screen } = useParams<{ screen: string }>();
  const label = screen ? screen.charAt(0).toUpperCase() + screen.slice(1) : 'Más';
  return <PlaceholderScreen name={label} />;
}

export const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginScreen />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/lotes" replace /> },
      { path: 'lotes', element: <PlaceholderScreen name="Lotes" /> },
      { path: 'dashboard', element: <PlaceholderScreen name="Dashboard" /> },
      { path: 'alertas', element: <PlaceholderScreen name="Alertas" /> },
      { path: 'produccion', element: <PlaceholderScreen name="Producción" /> },
      { path: 'mas', element: <MasMenu /> },
      { path: 'mas/:screen', element: <MasSubScreen /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
```

- [ ] **Step 2: Run typecheck + lint**

```bash
pnpm typecheck && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: router assembling protected and public routes"
```

---

## Task 19: Wire App.tsx + main.tsx (providers + bootstrap)

**Files:**
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import { RouterProvider } from 'react-router-dom';
import { useAuthBootstrap } from '@/features/auth/useAuthBootstrap';
import { appRouter } from './router';

export function App() {
  useAuthBootstrap();
  return <RouterProvider router={appRouter} />;
}
```

- [ ] **Step 2: Replace `src/main.tsx`**

```tsx
import './styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { queryClient } from '@/lib/queryClient';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
```

- [ ] **Step 3: Run typecheck + lint + tests**

```bash
pnpm typecheck && pnpm lint && pnpm test:run
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: wire App + main with providers and auth bootstrap"
```

---

# Phase 6 — Verification

## Task 20: Automated verification (typecheck, lint, test, build, bundle size)

**Files:** none modified — this task only runs checks.

- [ ] **Step 1: Clean install**

```bash
pnpm install --frozen-lockfile
```

Expected: success, no peer-dep errors.

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

Expected: zero errors, exit code 0.

- [ ] **Step 3: Lint**

```bash
pnpm lint
```

Expected: zero errors, zero warnings.

- [ ] **Step 4: Tests**

```bash
pnpm test:run
```

Expected: all tests pass. Total count: ~23 tests across these files:
- `src/tests/smoke.test.ts` (1)
- `src/features/auth/useSessionStore.test.ts` (3)
- `src/features/auth/errors.test.ts` (7)
- `src/features/auth/useAuth.test.ts` (4)
- `src/features/auth/useAuthBootstrap.test.ts` (4)
- `src/features/auth/ProtectedRoute.test.tsx` (3)
- `src/features/auth/PublicRoute.test.tsx` (3)
- `src/features/auth/LoginScreen.test.tsx` (6)

Exact total: **31 tests**. If a number is off, debug before continuing.

- [ ] **Step 5: Production build**

```bash
pnpm build
```

Expected: success, prints gzip size summary like:
```
dist/assets/index-XXXX.js   ~XXX kB │ gzip: XXX kB
```

- [ ] **Step 6: Verify bundle under 500 KB gzipped**

Inspect the Vite build output. Sum all `dist/assets/*.js` gzip sizes. Must be < 500 KB gzipped total for JS.

If over budget: the likely culprit is Firebase. Check that imports are tree-shakeable (we import from `firebase/auth`, `firebase/firestore`, `firebase/app` — not the umbrella `firebase` package). If still over, document the size in the commit message and flag for Grigor's review.

- [ ] **Step 7: Confirm production server boots locally (briefly)**

```bash
pnpm preview
```

Open http://localhost:4173. Expect to see the env validation error in console (no `.env.local` in CI/clean state), or — if `.env.local` exists — the SplashScreen briefly then LoginScreen. Stop with Ctrl+C.

- [ ] **Step 8: Final commit (no code change, just marker)**

If any tweaks were made during verification, commit them. Otherwise skip this step.

```bash
git status
```

Expected: clean working tree.

---

## Task 21: Manual end-to-end checklist (Grigor)

**This task is NOT run by an agent. It is a handoff to Grigor with real Firebase credentials.**

- [ ] **Step 1: Verify `.env.local` exists with real Firebase config**

File `C:\nalhuitad-vite\.env.local` must exist with valid values for:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN` (should be `nalhuitad-d6758.firebaseapp.com`)
- `VITE_FIREBASE_PROJECT_ID` (should be `nalhuitad-d6758`)
- `VITE_FIREBASE_APP_ID`

If missing, Grigor copies from the Firebase Console → Project Settings → General → SDK setup.

- [ ] **Step 2: Start dev server**

```bash
pnpm dev
```

Open http://localhost:5173 in browser.

- [ ] **Step 3: Verify LoginScreen appearance**

- Dark background (`#0F1219`)
- Centered card, max-width 400px
- Title "Nalhuitad", subtitle "Ingresa a tu cuenta"
- Email + Contraseña fields with labels
- Green "Entrar" button at bottom

Resize browser to 375px width — layout still looks correct (mobile target).

- [ ] **Step 4: Test validation**

Click "Entrar" with both fields empty. Expect red error box: "Completa email y contraseña".

- [ ] **Step 5: Test invalid credentials**

Type fake email + password. Click Entrar. Expect red error: "Email o contraseña incorrectos" (or appropriate Firebase-mapped message).

- [ ] **Step 6: Test successful login**

Type Grigor's real Nalhuitad credentials. Click Entrar.

Expected: button changes to "Entrando…", then navigates to `/lotes` showing the PlaceholderScreen with title "Lotes".

- [ ] **Step 7: Test tab navigation**

Tap each tab in bottom nav (Lotes, Dashboard, Alertas, Producción, Más). Each navigates to its placeholder. Active tab shows in green (`--nav-active`).

- [ ] **Step 8: Test /mas sub-screens**

Tap Más → tap each item (Nuevo lote, Historial, Notas, Clínica, Sensores, Configuración). Each navigates to its placeholder.

- [ ] **Step 9: Test persistence**

Close the browser tab completely. Reopen http://localhost:5173. Expect: brief SplashScreen ("Cargando…") then directly to `/lotes` (NOT back to login). Sessions persist via Firebase's `browserLocalPersistence`.

- [ ] **Step 10: Test sign out**

Navigate to /mas. Tap "Cerrar sesión" (red button). Expect: navigates back to `/login`. Trying to manually visit `/lotes` redirects to `/login`.

- [ ] **Step 11: Verify legacy app still works**

Open Grigor's legacy production URL (https://agricolanalhuitad.github.io/nalhuitad.github.io). Verify it still loads and works as before — the new Vite app has not affected it in any way.

- [ ] **Step 12: Sign-off**

If all checks pass: Sprint 1 is complete. The scaffold is ready for the Lotes screen sprint (next phase).

If any check fails: file the issue in Grigor's preferred tracking, fix in a follow-up task, then re-run from Step 2.

---

## Spec Coverage Check (self-review)

Verified mappings from spec sections to plan tasks:

| Spec section | Implementing task(s) |
|--------------|----------------------|
| §3 Stack — runtime + dev deps | Tasks 2, 3, 4, 6, 7, 8, 13 |
| §4 Estructura de directorios | All tasks (file paths exact) |
| §5.1 Flujo de boot | Task 11 (`useAuthBootstrap`), Task 19 (wires into App.tsx) |
| §5.2 `lib/firebase.ts` | Task 6 |
| §5.3 `useSessionStore` | Task 8 |
| §5.4 `useAuth` | Task 10 |
| §5.5 `errors.ts` | Task 9 |
| §5.6 Routing | Task 18 |
| §5.7 `AppShell` + tab nav | Task 14 |
| §5.8 `LoginScreen` | Task 17 |
| §6.1 `tokens.css` | Task 5 |
| §6.2 `global.css` | Task 5 |
| §6.3 `theme.ts` | Task 5 |
| §7.1 `tests/setup.ts` | Task 4 |
| §7.2 `vitest.config.ts` | Task 4 |
| §7.3 Tests de humo | Spec called for 3; plan delivers 7 test files (more coverage — exceeds spec, acceptable) |
| §8 Env vars | Task 6 (`.env.example` + validation) |
| §9 Build & scripts | Tasks 2, 3, 4 (incremental) |
| §10 `.gitignore` | Task 1 |
| §11 `tsconfig.json` | Task 2 |
| §12 ESLint flat config | Task 3 |
| §13 Criterios de aceptación 1-6 | Task 20 |
| §13 Criterio 7 (E2E manual) | Task 21 |
| §14 Fuera de scope | (not implemented — correct) |
| §15 Riesgos | Mitigations in place: env validation (Task 6), pnpm devEngines (Task 2), centralized Firebase mock (Task 4) |

All spec requirements have a task. No gaps.

---

**Plan complete and saved to `C:\nalhuitad-vite\docs\plans\2026-05-18-fase-a-scaffold-auth.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration with isolated context per step.

2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for review.

Which approach?
