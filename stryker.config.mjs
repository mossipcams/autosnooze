/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress"],
  testRunner: "vitest",
  vitest: {
    configFile: "vitest.config.mjs",
  },
  coverageAnalysis: "all",
  mutate: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/*.spec.ts"],
  thresholds: { high: 80, low: 60, break: 70 },
  concurrency: 8,
  timeoutMS: 10000,
  dryRunTimeoutMinutes: 5,
  tempDirName: ".stryker-tmp",
  cleanTempDir: "always",
};
