import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['**/tests/**/*.spec.js'],
    setupFiles: ['./tests/vitest.setup.js'],
    globals: true,
    coverage: {
      provider: 'v8',
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
