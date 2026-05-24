import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/tests/setup.ts'],
      exclude: ['node_modules', 'dist', 'tests/security/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: ['**/*.test.{ts,tsx}', 'src/tests/**', 'tests/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      },
    },
  }),
);
