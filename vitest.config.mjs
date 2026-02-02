import { defineConfig } from 'vitest/config';
import { VitestReporter } from 'tdd-guard-vitest';

export default defineConfig({
  define: {
    // Provide a test version for __VERSION__ global used in the card
    __VERSION__: JSON.stringify('0.0.0-test'),
  },
  test: {
    environment: 'jsdom',
    include: ['**/tests/**/*.spec.{js,ts}'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
    setupFiles: ['./tests/vitest.setup.ts'],
    globals: true,
    reporters: [
      'default',
      new VitestReporter(process.cwd()),
    ],
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
      reporter: ['text', 'text-summary', 'html', 'lcov'],
    },
    alias: [
      { find: /^lit$/, replacement: '/node_modules/lit/index.js' },
    ],
  },
});
