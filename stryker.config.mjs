/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: "npm",
  reporters: ["html", "clear-text", "progress"],
  testRunner: "vitest",
  vitest: {
    configFile: "vitest.config.js",
  },
  coverageAnalysis: "all",
  mutate: ["src/**/*.js", "!src/**/*.test.js", "!src/**/*.spec.js"],
  thresholds: { high: 80, low: 60, break: 70 },
  concurrency: 4,
  timeoutMS: 30000,
  dryRunTimeoutMinutes: 5,
  tempDirName: ".stryker-tmp",
  cleanTempDir: "always",
};
