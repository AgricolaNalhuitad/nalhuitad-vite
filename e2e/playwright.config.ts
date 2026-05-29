import { defineConfig, devices } from '@playwright/test';

/**
 * E2E de Trazabilidad LO+UP sobre el emulador de Firebase.
 *
 * `pnpm test:e2e` envuelve este runner en `firebase emulators:exec --only firestore,auth`,
 * y el servidor de Vite que se levanta aquí apunta al emulador (NO a producción) vía
 * `VITE_USE_EMULATOR`.
 *
 * ⚠ Prerrequisito pendiente (T023): `src/lib/firebase.ts` debe honrar `VITE_USE_EMULATOR`
 * y conectar a los emuladores. Hasta entonces NO ejecutar `pnpm test:e2e` — la app
 * apuntaría a Firestore de producción. El projectId `demo-*` es una segunda barrera:
 * el emulador trata los proyectos `demo-` como locales y sin credenciales.
 */
const PORT = 5273; // puerto dedicado a E2E (no colisiona con `pnpm dev` en 5173)
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './flujos',
  globalSetup: './fixtures/seed.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev --port 5273 --host 127.0.0.1',
    url: BASE_URL,
    // Nunca reusar un server existente: garantiza que el server E2E corre con
    // VITE_USE_EMULATOR (apuntando al emulador), no un `pnpm dev` contra prod.
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_USE_EMULATOR: 'true',
      VITE_FIREBASE_API_KEY: 'demo-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: '127.0.0.1',
      VITE_FIREBASE_PROJECT_ID: 'demo-nalhuitad',
      VITE_FIREBASE_APP_ID: 'demo-app-id',
    },
  },
});
