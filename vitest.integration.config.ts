import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

/**
 * Tests de integración sobre el emulador de Firestore (no jsdom).
 * Se corren con `pnpm test:integration`, que los envuelve en `firebase emulators:exec`.
 * Hereda el alias `@/` de vite.config (tsconfigPaths) para resolver imports de la app,
 * pero NO usa el setup de jsdom/RTL (entorno node) ni la persistencia IndexedDB.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      globals: true,
      include: ['src/**/*.integration.test.ts'],
      testTimeout: 30000,
      hookTimeout: 30000,
      pool: 'forks',
    },
  }),
);
