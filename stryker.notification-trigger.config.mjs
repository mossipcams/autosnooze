/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.mjs',
  },
  coverageAnalysis: 'perTest',
  mutate: ['src/utils/notification-trigger-request.ts'],
  testFiles: ['src/tests/notification-trigger-pause.spec.ts'],
  thresholds: { high: 90, low: 70, break: 70 },
  concurrency: 8,
  timeoutMS: 10000,
  dryRunTimeoutMinutes: 5,
  tempDirName: '.stryker-tmp',
  cleanTempDir: 'always',
};
