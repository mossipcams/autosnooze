import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    // Provide a test version for __VERSION__ global used in the card
    __VERSION__: JSON.stringify('0.0.0-test'),
  },
  test: {
    environment: 'jsdom',
    include: ['**/tests/**/*.spec.{js,ts}'],
    setupFiles: ['./tests/vitest.setup.ts'],
    globals: true,
    deps: {
      inline: ['lit', 'lit-element', 'lit-html', '@lit/reactive-element'],
    },
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/legacy/**'],
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
  },
});
