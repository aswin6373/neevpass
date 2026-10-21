import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for the web application.
 *
 * Tests here cover pure logic extracted from the app — the logger's redaction,
 * error mapping, and later the document builders. React component tests would
 * need a DOM environment; that is deliberately not enabled yet, because the
 * components in this phase are presentational and are covered by the build and
 * by end-to-end tests instead.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      // Mirrors the `@/*` path alias in tsconfig.json.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
