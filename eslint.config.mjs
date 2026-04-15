import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

const sharedGlobals = {
  ...globals.browser,
  ...globals.es2021,
  ...globals.node,
  __VERSION__: "readonly",
  createMockHass: "readonly",
  waitForLitUpdate: "readonly",
  createAndConnectElement: "readonly",
  vi: "readonly",
  describe: "readonly",
  test: "readonly",
  expect: "readonly",
  beforeEach: "readonly",
  afterEach: "readonly",
};

const sharedRules = {
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
    },
  ],
  "no-unused-vars": "off",
  "no-console": "off",
  "prefer-const": "error",
  "no-var": "error",
  eqeqeq: ["error", "always"],
  "no-multiple-empty-lines": [
    "error",
    {
      max: 2,
    },
  ],
  "no-regex-spaces": "off",
  "preserve-caught-error": "off",
};

export default [
  {
    ignores: ["*.mjs", "custom_components/**/*.js"],
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
  js.configs.recommended,
  {
    files: ["src/**/*.ts", "tests/**/*.ts", "tests/**/*.js"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: sharedGlobals,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...sharedRules,
    },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
      },
    },
  },
  {
    files: ["src/tests/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.test.json"],
      },
    },
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.test.json"],
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-nocheck": "allow-with-description",
          minimumDescriptionLength: 3,
        },
      ],
    },
  },
  {
    files: ["tests/**/*.js"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
