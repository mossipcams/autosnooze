import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    // Provide a test version for __VERSION__ global used in the card
    __VERSION__: JSON.stringify('0.0.0-test'),
  },
  test: {
    environment: 'jsdom',
    include: ['**/tests/**/*.spec.js'],
    setupFiles: ['./tests/vitest.setup.js'],
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks',
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.js'],
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
    alias: {
      lit: '/node_modules/lit/index.js',
    },
  },
});
