# Dependency Update PRs - Breaking Changes Review

## Summary

| PR Branch | Change | Risk Level | Recommendation |
|-----------|--------|------------|----------------|
| `jsdom-27.4.0` | 25 → 27 | **HIGH** | Review CSS tests carefully |
| `typescript-eslint/eslint-plugin-8.53.0` | 6 → 8 | **HIGH** | Requires ESLint 9 + config migration |
| `typescript-eslint/parser-8.53.0` | 6 → 8 | **HIGH** | Must update with eslint-plugin |
| `rollup/plugin-typescript-12.3.0` | 11 → 12 | **MEDIUM** | outDir validation may break build |
| `npm-minor-patch-22c22c80d3` | minor/patch | LOW | Safe to merge |
| `actions/setup-node-6.1.0` | SHA update | LOW | Safe to merge |
| `github/codeql-action-4.31.10` | SHA update | LOW | Safe to merge |
| `googleapis/release-please-action-*` | SHA update | LOW | Safe to merge |

---

## Detailed Analysis

### 1. jsdom 25 → 27 (HIGH RISK)

**PR Branch:** `dependabot/npm_and_yarn/jsdom-27.4.0`

#### Breaking Changes:
- **Node.js Requirement**: Now requires Node.js v20.19.0+, v22.12.0+, or v24.0.0+
  - ✅ **Project OK**: Using Node.js v22.21.1

- **User Agent Stylesheet**: CSS stylesheet now derived from HTML Standard instead of Chromium
  - ⚠️ **Potential Impact**: `getComputedStyle()` results may differ
  - ✅ **Project OK**: Tests don't appear to use `getComputedStyle()` directly

- **window.location Mocking**: Pattern `delete window.location; Object.defineProperty(...)` no longer works
  - ✅ **Project OK**: No `window.location` mocking found in tests

- **Cookie Handling**: `http://localhost/` now treated as secure context
  - ✅ **Project OK**: No cookie handling in tests

- **Window Object Changes**: Various data properties changed to accessor properties
  - ⚠️ **Potential Impact**: May affect custom element testing

#### Project-Specific Assessment:
The test setup at `tests/vitest.setup.ts` relies heavily on jsdom for Lit component testing. The main concerns are:
1. `adoptedStyleSheets` mock behavior may change
2. `CSSStyleSheet.replaceSync` polyfill may interact differently

**Recommendation**: Test thoroughly after upgrade. Run full test suite and mutation tests.

---

### 2. @typescript-eslint 6 → 8 (HIGH RISK)

**PR Branches:**
- `dependabot/npm_and_yarn/typescript-eslint/eslint-plugin-8.53.0`
- `dependabot/npm_and_yarn/typescript-eslint/parser-8.53.0`

#### Breaking Changes:
- **ESLint 9 Required**: typescript-eslint v8 requires ESLint v9 support
  - ❌ **Project Issue**: Currently using ESLint ^8.57.0

- **Flat Config Support**: While legacy `.eslintrc.json` still works, v8 is designed for flat config
  - ⚠️ **Project Impact**: Uses legacy `.eslintrc.json` format

- **Deprecated Rules Removed**:
  - `no-throw-literal` removed → use `only-throw-error`
  - `prefer-ts-expect-error` deprecated → use `ban-ts-comment`
  - `no-var-requires` deprecated → use `no-require-imports`
  - ✅ **Project OK**: None of these are in `.eslintrc.json`

- **AST Changes**: Strict parent types for nodes may break custom rules
  - ✅ **Project OK**: No custom ESLint rules

#### Project-Specific Assessment:
**CRITICAL**: These PRs cannot be merged individually. You must:
1. Upgrade ESLint from ^8.57.0 to ^9.x
2. Upgrade both `@typescript-eslint/eslint-plugin` AND `@typescript-eslint/parser` together
3. Consider migrating to flat config (`eslint.config.mjs`)

**Recommendation**: Create a combined PR that upgrades ESLint + both typescript-eslint packages together.

---

### 3. @rollup/plugin-typescript 11 → 12 (MEDIUM RISK)

**PR Branch:** `dependabot/npm_and_yarn/rollup/plugin-typescript-12.3.0`

#### Breaking Changes:
- **outDir/declarationDir Validation**: v12 enforces that TypeScript's `outDir` must be inside the same directory as Rollup's `file` output

#### Project-Specific Assessment:
Current configuration:
```javascript
// tsconfig.json
"outDir": "./dist"

// rollup.config.mjs
output: {
  file: 'custom_components/autosnooze/www/autosnooze-card.js'
}
```

- ⚠️ **Potential Issue**: `./dist` is NOT inside `custom_components/autosnooze/www/`
- The build may fail with: "Path of Typescript compiler option 'outDir' must be located inside the same directory as the Rollup 'file' option."

**Workaround**: Modify `rollup.config.mjs` to explicitly set `compilerOptions`:
```javascript
typescript({
  compilerOptions: {
    outDir: 'custom_components/autosnooze/www'
  }
})
```

**Recommendation**: Test build locally before merging.

---

### 4. GitHub Actions Updates (LOW RISK)

All GitHub Actions updates are SHA-pinned updates within the same major version (v4/v3):

| Action | Change | Risk |
|--------|--------|------|
| `actions/setup-node` | v4 SHA update | Safe |
| `github/codeql-action` | v3 SHA update | Safe |
| `googleapis/release-please-action` | v4 SHA update | Safe |

**Recommendation**: Safe to merge all three.

---

### 5. npm-minor-patch Group (LOW RISK)

**PR Branch:** `dependabot/npm_and_yarn/npm-minor-patch-22c22c80d3`

This appears to be an empty or no-change PR (diff shows no changes to package.json).

**Recommendation**: Verify contents and merge if valid.

---

## Recommended Merge Order

1. **Immediate (Low Risk)**:
   - `actions/setup-node-6.1.0`
   - `github/codeql-action-4.31.10`
   - `googleapis/release-please-action-*`

2. **After Testing (Medium Risk)**:
   - `rollup/plugin-typescript-12.3.0` (test build first, may need config change)
   - `jsdom-27.4.0` (run full test suite)

3. **Requires Combined Effort (High Risk)**:
   - `typescript-eslint/eslint-plugin-8.53.0` + `typescript-eslint/parser-8.53.0`
   - **Must also upgrade**: ESLint ^8.57.0 → ^9.x
   - Consider migrating `.eslintrc.json` to `eslint.config.mjs`

---

## Sources

- [jsdom Releases](https://github.com/jsdom/jsdom/releases)
- [jsdom Changelog](https://github.com/jsdom/jsdom/blob/main/Changelog.md)
- [typescript-eslint v8 Announcement](https://typescript-eslint.io/blog/announcing-typescript-eslint-v8/)
- [ESLint v9 Migration Guide](https://eslint.org/docs/latest/use/migrate-to-9.0.0)
- [@rollup/plugin-typescript Changelog](https://github.com/rollup/plugins/blob/master/packages/typescript/CHANGELOG.md)
- [@rollup/plugin-typescript Issue #1813](https://github.com/rollup/plugins/issues/1813)
