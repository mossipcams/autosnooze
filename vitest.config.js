import { defineConfig } from 'vitest/config';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
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
