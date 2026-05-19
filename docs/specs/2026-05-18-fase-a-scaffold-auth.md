# Fase A — Sprint 1: Scaffold Vite + Capa de autenticación Firebase

**Fecha:** 2026-05-18
**Estado:** Diseño aprobado, listo para plan de implementación
**Proyecto:** Nalhuitad (migración Fase A del stack legacy)
**Repo destino:** `C:\nalhuitad-vite\` (nuevo directorio, hermano de `C:\nalhuitad-app\`)

---

## 1. Objetivo

Crear el scaffold del nuevo stack y la capa de autenticación completa con la plomería de routing/estado lista para enchufar las 12 pantallas de la migración en sprints posteriores.

La app legacy en `C:\nalhuitad-app\www\index.html` (React 18 + Babel standalone) permanece intocada y en producción durante toda esta fase. Las dos apps coexisten sin interferir.

## 2. Decisiones aprobadas en brainstorming

| # | Decisión | Valor |
|---|----------|-------|
| 1 | Ubicación del nuevo proyecto | `C:\nalhuitad-vite\` (hermano de `nalhuitad-app`) |
| 2 | Alcance de la capa de auth | Auth + plomería completa (Zustand + React Router + React Query + AppShell con tab nav placeholders + estilos base) |
| 3 | Estrategia de config Firebase | Vars `VITE_FIREBASE_*` en `.env.local` (gitignored). `.env.example` commiteado |
| 4 | Sesión legacy (`hidro_auth_v1`) | No se toca. Nueva app usa persistencia nativa de Firebase SDK v10 |
| 5 | Testing | Vitest + RTL desde día 1, con 3 tests de humo |
| 6 | Estructura de código | Feature-based desde el inicio (Enfoque B) |
| 7 | Styling | CSS Modules + variables CSS. Sin Tailwind |
| 8 | Tema | Dark mode por defecto. Variables CSS para ambos modos. Toggle UI deferido |

## 3. Stack

### Runtime
- `react@^19`, `react-dom@^19`
- `react-router-dom@^7` (code-based routing)
- `firebase@^10` (Auth + Firestore; Firestore listo pero no usado en este sprint)
- `zustand@^5`
- `@tanstack/react-query@^5`

### Dev
- `vite@^6`, `@vitejs/plugin-react@^4`
- `typescript@^5`, `@types/react@^19`, `@types/react-dom@^19`
- `vitest@^2`, `@testing-library/react@^16`, `@testing-library/jest-dom@^6`, `jsdom@^25`
- `eslint@^9` (flat config) + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` + `eslint-config-prettier`
- `prettier@^3`
- `vite-tsconfig-paths` (para que `@/*` funcione en tests también)

Versiones exactas se resuelven al instalar (latest stable de cada major). Manager: **pnpm exclusivamente** (CLAUDE.md prohibe npm/yarn).

## 4. Estructura de directorios

```
C:\nalhuitad-vite\
├── .env.local                  ← gitignored, credenciales reales
├── .env.example                ← commiteado, plantilla con keys vacías
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── index.html                  ← entry HTML mínimo, <html data-theme="dark"><div id="root">
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json               ← strict: true, paths: { "@/*": ["src/*"] }
├── tsconfig.node.json
├── vite.config.ts              ← plugin react, vite-tsconfig-paths
├── vitest.config.ts            ← extends vite.config, jsdom, setupFiles
├── README.md                   ← cómo correr, env vars requeridas
├── docs/
│   └── specs/
│       └── 2026-05-18-fase-a-scaffold-auth.md   ← este documento
└── src/
    ├── main.tsx                ← createRoot, providers (QueryClient)
    ├── App.tsx                 ← useAuthBootstrap + <RouterProvider />
    ├── router.tsx              ← createBrowserRouter, rutas, ProtectedRoute, PublicRoute
    ├── features/
    │   └── auth/
    │       ├── LoginScreen.tsx
    │       ├── LoginScreen.module.css
    │       ├── LoginScreen.test.tsx
    │       ├── ProtectedRoute.tsx
    │       ├── ProtectedRoute.test.tsx
    │       ├── PublicRoute.tsx
    │       ├── useSessionStore.ts          ← Zustand: { user, status }
    │       ├── useSessionStore.test.ts
    │       ├── useAuth.ts                  ← signIn, signOut
    │       ├── useAuthBootstrap.ts         ← onAuthStateChanged subscription
    │       └── errors.ts                   ← mapeo códigos Firebase → mensajes ES
    ├── shared/
    │   ├── components/
    │   │   ├── AppShell.tsx                ← layout + bottom tab nav
    │   │   ├── AppShell.module.css
    │   │   ├── SplashScreen.tsx            ← estado initializing
    │   │   ├── PlaceholderScreen.tsx       ← "Próximamente — pantalla X"
    │   │   └── MasMenu.tsx                 ← lista de screens accesibles desde "Más"
    │   ├── hooks/                          ← (vacío en este sprint)
    │   └── ui/                             ← (vacío, primitivos compartidos futuros)
    ├── lib/
    │   ├── firebase.ts                     ← initializeApp + getAuth + getFirestore + validación env
    │   ├── queryClient.ts                  ← new QueryClient con defaults
    │   └── theme.ts                        ← tokens TS de colores
    ├── styles/
    │   ├── tokens.css                      ← CSS variables (dark + light)
    │   └── global.css                      ← reset, body defaults
    └── tests/
        └── setup.ts                        ← @testing-library/jest-dom, mocks Firebase
```

**Reglas de organización:**
- **`features/<x>/`** — todo lo específico de una pantalla/dominio (componentes, hooks, api, tests)
- **`shared/`** — componentes/hooks usados por 2+ features
- **`lib/`** — integración con libs externas y utilidades sin lógica de UI
- **Tests colocados junto al código** (`X.test.tsx` al lado de `X.tsx`), no en carpeta separada
- **CSS Modules por componente** (`X.module.css` al lado de `X.tsx`)

## 5. Capa de autenticación

### 5.1 Flujo de boot

```
main.tsx (createRoot)
  └─ <QueryClientProvider>
       └─ <App />
            ├─ useAuthBootstrap()           ← una sola suscripción
            └─ <RouterProvider router={appRouter} />
```

`useAuthBootstrap()` (hook que corre una vez en `App.tsx`):

```ts
useEffect(() => {
  setPersistence(auth, browserLocalPersistence);
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    useSessionStore.setState({
      user,
      status: user ? 'authenticated' : 'unauthenticated',
    });
  });
  return unsubscribe;
}, []);
```

### 5.2 `lib/firebase.ts`

```ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const missing = requiredVars.filter((k) => !import.meta.env[k]);
if (missing.length > 0) {
  throw new Error(`Firebase config inválida — faltan: ${missing.join(', ')}`);
}

const config = {
  apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId:      import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app  = initializeApp(config);
export const auth = getAuth(app);
export const db   = getFirestore(app);    // listo, no usado en este sprint
```

### 5.3 `features/auth/useSessionStore.ts` (Zustand)

```ts
type Status = 'initializing' | 'authenticated' | 'unauthenticated';

interface SessionState {
  user: User | null;
  status: Status;
}

export const useSessionStore = create<SessionState>(() => ({
  user: null,
  status: 'initializing',
}));
```

Sin acciones públicas en el store — solo `useAuthBootstrap` escribe vía `setState`. Lectura desde componentes con selectores: `const status = useSessionStore(s => s.status)`.

### 5.4 `features/auth/useAuth.ts`

Hook que expone solo acciones (no lee estado):

```ts
useAuth() returns {
  signIn(email, password): Promise<{ ok: true } | { ok: false; error: string }>
  signOut(): Promise<void>
}
```

### 5.5 `features/auth/errors.ts` — mapeo Firebase → español

| Código Firebase | Mensaje al usuario |
|-----------------|--------------------|
| `auth/invalid-credential` | "Email o contraseña incorrectos" |
| `auth/invalid-email` | "Email inválido" |
| `auth/user-disabled` | "Esta cuenta está deshabilitada" |
| `auth/network-request-failed` | "Sin conexión. Revisa tu red." |
| `auth/too-many-requests` | "Demasiados intentos. Espera unos minutos." |
| (otros) | "Error de autenticación. Reintenta." |

### 5.6 Routing (`router.tsx`)

```
/login          → <PublicRoute><LoginScreen /></PublicRoute>
/               → <ProtectedRoute><AppShell /></ProtectedRoute>
  index         → <Navigate to="/lotes" replace />
  /lotes        → <PlaceholderScreen name="Lotes" />
  /dashboard    → <PlaceholderScreen name="Dashboard" />
  /alertas      → <PlaceholderScreen name="Alertas" />
  /produccion   → <PlaceholderScreen name="Producción" />
  /mas          → <MasMenu />     ← links a Historial, Notas, Clínica, Sensores, Config, Nuevo
  /mas/:screen  → <PlaceholderScreen name={screen} />
*               → <Navigate to="/" replace />
```

**`ProtectedRoute`:**
- `status === 'initializing'` → `<SplashScreen />`
- `status === 'unauthenticated'` → `<Navigate to="/login" replace />`
- `status === 'authenticated'` → `<Outlet />`

**`PublicRoute`** (para `/login`):
- `status === 'initializing'` → `<SplashScreen />`
- `status === 'authenticated'` → `<Navigate to="/" replace />`
- `status === 'unauthenticated'` → `<Outlet />`

### 5.7 `AppShell.tsx` — bottom tab nav

Layout fijo mobile-first (375px target). Contenido scrollable + bottom nav fija. Tabs visibles:

| Tab | Ruta | Icono (placeholder texto) |
|-----|------|---------------------------|
| Lotes | `/lotes` | 🌱 |
| Dashboard | `/dashboard` | 📊 |
| Alertas | `/alertas` | 🔔 |
| Producción | `/produccion` | 📦 |
| Más | `/mas` | ⋯ |

`/mas` muestra lista de: Historial, Notas, Clínica, Sensores, Config, Nuevo lote, + botón SignOut. Iconos definitivos (lucide-react u otra lib) se deciden en el sprint de Lotes.

### 5.8 `LoginScreen.tsx`

Form simple: email + password + botón "Entrar".

- Estados: `idle | submitting | error`
- Validación local antes de llamar a Firebase: `email.trim() !== ''` y `password !== ''`. Si fallan, mostrar mensaje "Completa email y contraseña" sin llamar a `signIn`
- Submit deshabilita el botón mientras `submitting`
- Error se muestra debajo del form en color `--red`
- Ancho máx 400px, centrado vertical y horizontal, dark mode
- Sin "recordar sesión" (persistencia es automática vía `browserLocalPersistence`)
- Sin "olvidé contraseña" (deferido — Firebase soporta `sendPasswordResetEmail`)

## 6. Theming

### 6.1 `src/styles/tokens.css`

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
  --bg-card: #FFFFFF;
  --bg-card-h: #EEF1F8;
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
}
```

### 6.2 `src/styles/global.css`

Reset mínimo + `body { background: var(--bg-1); color: var(--text-1); font-family: system-ui, -apple-system, sans-serif; }` + `*, *::before, *::after { box-sizing: border-box; }` + scrollbar styling discreto.

### 6.3 `src/lib/theme.ts`

Tokens TS tipados para los pocos casos que necesiten color en JS (props dinámicos, charts futuros). CSS Modules siempre debe preferir las variables CSS directamente.

```ts
export const colors = {
  dark: { bg1: '#0F1219', /* ... */ },
  light: { bg1: '#F5F7FA', /* ... */ },
} as const;

export type ColorToken = keyof typeof colors.dark;
export const cssVar = (token: ColorToken) => `var(--${kebab(token)})`;
```

## 7. Testing

### 7.1 `src/tests/setup.ts`

```ts
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(cleanup);

vi.mock('firebase/auth', () => ({ /* signInWithEmailAndPassword, signOut, onAuthStateChanged, ... */ }));
vi.mock('@/lib/firebase', () => ({ auth: {}, db: {}, app: {} }));
```

### 7.2 `vitest.config.ts`

- `environment: 'jsdom'`
- `globals: true`
- `setupFiles: ['./src/tests/setup.ts']`
- `coverage: { provider: 'v8', reporter: ['text', 'html'] }`

### 7.3 Tests de humo (3)

1. **`LoginScreen.test.tsx`**
   - Renderiza form con email, password, botón
   - Submit con campos vacíos no llama a `signIn`
   - Submit con campos llenos llama a `signIn` con esos valores
2. **`ProtectedRoute.test.tsx`**
   - Con `status === 'initializing'` renderiza `<SplashScreen />`
   - Con `status === 'unauthenticated'` redirige a `/login`
   - Con `status === 'authenticated'` renderiza `children`
3. **`useSessionStore.test.ts`**
   - Estado inicial: `status === 'initializing'`, `user === null`

## 8. Env vars

### 8.1 `.env.local` (gitignored — Grigor lo crea localmente)

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=nalhuitad-d6758.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=nalhuitad-d6758
VITE_FIREBASE_APP_ID=1:...:web:...
```

### 8.2 `.env.example` (commiteado)

Mismas keys, valores vacíos. Plantilla.

### 8.3 Validación al boot

`lib/firebase.ts` verifica que todas las vars existan. Si falta alguna, lanza error explícito con el nombre de la var faltante. No fallback silencioso.

## 9. Build & scripts (`package.json`)

```json
"scripts": {
  "dev":        "vite",
  "build":      "tsc -b && vite build",
  "preview":    "vite preview",
  "test":       "vitest",
  "test:run":   "vitest run",
  "test:ui":    "vitest --ui",
  "typecheck":  "tsc --noEmit",
  "lint":       "eslint .",
  "format":     "prettier --write \"src/**/*.{ts,tsx,css,md}\""
}
```

```json
"devEngines": {
  "packageManager": {
    "name": "pnpm",
    "version": "^11",
    "onFail": "download"
  }
}
```

## 10. `.gitignore`

```
node_modules
dist
.env.local
.env.*.local
*.log
.vite
coverage
.DS_Store
```

## 11. `tsconfig.json` (compilerOptions críticos)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

## 12. ESLint (flat config `eslint.config.js`)

- `@typescript-eslint/recommended`
- `eslint-plugin-react-hooks` (recommended)
- `eslint-plugin-react-refresh` (only-export-components)
- `eslint-config-prettier` (apaga conflictos con Prettier)

Sin reglas custom propias en este sprint.

## 13. Criterios de aceptación

Checks 1-6 los corre y reporta Claude antes de cerrar el sprint. Check 7 lo valida Grigor manualmente con credencial real (Claude no tiene credenciales de producción).

1. `pnpm install` — sin errores ni warnings de peer deps no resueltos
2. `pnpm typecheck` — cero errores TypeScript
3. `pnpm lint` — cero errores, cero warnings
4. `pnpm test:run` — los 3 tests de humo pasan
5. `pnpm build` — cero errores; `dist/` generado; bundle inicial < 500 KB gzipped
6. `pnpm dev` arranca en `http://localhost:5173` y la app monta sin errores de runtime
7. **End-to-end manual con credencial real de `nalhuitad-d6758` (Grigor):**
   - `/login` aparece en dark mode, mobile-friendly a 375px
   - Email/password inválidos → mensaje en español, color `--red`
   - Email/password válidos → navega a `/lotes` (placeholder visible)
   - Tabs en bottom nav navegan correctamente entre placeholders
   - `/mas` muestra lista + botón SignOut
   - Cerrar pestaña → reabrir → sigue en la última ruta autenticada (persistencia OK)
   - SignOut → vuelve a `/login`
   - Reintento de acceder a `/lotes` sin sesión → redirige a `/login`

## 14. Fuera de scope (explícito)

- Pantalla de Lotes con Firestore real
- Modales, formularios de creación/edición/raleo/cosecha
- Migrar wrapper Capacitor (`nalhuitad-app/`) a consumir `dist/`
- Toggle UI dark/light (variables CSS quedan listas)
- Forgot password
- Firebase Hosting deploy
- Service worker / offline / PWA
- Sensores screen (bloqueado por hardware)
- Iconos definitivos (lucide-react u otra lib)
- Internacionalización (todo en español hard-coded)

## 15. Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| Firebase config inválida → app no arranca y error críptico | Validación al boot con mensaje explícito de qué var falta (sección 5.2) |
| pnpm no instalado en la máquina | `devEngines.packageManager` con `onFail: download` (sección 9) |
| Test mocking de Firebase rompe si cambia API | Mock centralizado en `tests/setup.ts`, no replicado por test |
| React 19 + React Router 7 + Firebase 10 — todos majors nuevos, conflictos posibles | Resolver al instalar; si hay incompat, fijar versión menor compatible y documentar en README |
| Bundle de Firebase pesado (~ 200 KB) | Aceptable para este sprint; tree-shaking en sprint posterior si pasa de 500 KB gzipped |
| Coexistencia legacy/nueva en mismo browser | Persistencia Firebase usa key propia (`firebase:authUser:*`), no toca `hidro_auth_v1` (sección 2, decisión 4) |

## 16. Próximo paso

Una vez aprobado este spec, invocar `superpowers:writing-plans` para producir el plan de implementación paso-a-paso (con tests, verificaciones y checkpoints de revisión).
