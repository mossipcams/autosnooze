# Technology Stack

**Analysis Date:** 2026-01-31

## Languages

**Primary:**
- Python 3.12+ - Backend integration for Home Assistant
- TypeScript 5.9+ - Frontend card component (Lit-based web component)
- JavaScript (ES2021) - Build scripts and bundled output

**Secondary:**
- YAML - Service definitions and CI/CD configuration

## Runtime

**Environment:**
- Python 3.12.8 (from `.github/workflows/build.yml`)
- Node.js (via devcontainer features)

**Package Manager:**
- npm (with package-lock.json)
- pip (Python dependencies via requirements_test.txt)

## Frameworks

**Core:**
- Lit 3.3.2 - Frontend web component library for reactive UI (`src/autosnooze-card.ts`)
- Home Assistant core APIs - Python backend integration using `homeassistant.core`, `homeassistant.helpers`

**Build/Dev:**
- Rollup 4.55.2 - JavaScript bundler with plugins:
  - @rollup/plugin-typescript - TypeScript compilation
  - @rollup/plugin-node-resolve - Node module resolution
  - @rollup/plugin-replace - Version injection via `__VERSION__`
  - @rollup/plugin-terser - Code minification
  - @rollup/plugin-json - JSON import support
- TypeScript 5.9.3 - Type checking and compilation

**Testing:**
- Vitest 4.0.16 - JavaScript unit test framework with jsdom
- pytest 7.4.0+ - Python unit test framework
- pytest-asyncio 0.23.0+ - Async test support for Python
- pytest-homeassistant-custom-component 0.13.0+ - Home Assistant test fixtures
- Playwright 1.40.0+ - E2E test framework (supports Chrome, Firefox, mobile)
- Stryker 9.4.0 - Mutation testing for JavaScript quality assessment

**Code Quality:**
- ruff 0.1.0+ - Python linter and formatter (unified tool)
- ESLint 8.57.0 - JavaScript/TypeScript linter with @typescript-eslint plugins
- Pyright 1.1.0+ - Python type checker
- husky 9.0.0 - Git hooks framework
- lint-staged 15.0.0 - Run linters on staged files

## Key Dependencies

**Critical:**
- lit 3.3.2 - Core dependency for reactive frontend component
- homeassistant package - Provided by Home Assistant runtime environment (not in requirements, available in HA container)

**Infrastructure:**
- pytest-cov 4.1.0 - Coverage reporting for Python tests
- @vitest/coverage-istanbul 4.0.17 - JavaScript coverage via Istanbul
- @vitest/coverage-v8 4.0.17 - JavaScript coverage via V8
- @typescript-eslint/parser 8.53.0 - TypeScript parsing for ESLint
- @typescript-eslint/eslint-plugin 8.53.1 - TypeScript-specific ESLint rules

**Build Support:**
- tslib 2.8.1 - TypeScript runtime helpers
- yaml 2.8.2 - YAML parsing (used in Vitest config)
- voluptuous - Python schema validation for service configuration (imported from `homeassistant.helpers`)

## Configuration

**Environment:**
- No external API keys or secrets required (Home Assistant local integration)
- Configuration via Home Assistant UI (config_flow.ts, config_flow.py)
- Defaults in `const.py`: duration presets, label names, storage version

**Build:**
- `rollup.config.mjs` - Bundles `src/index.ts` → `custom_components/autosnooze/www/autosnooze-card.js`
- Version injection: `package.json` version → `__VERSION__` global via replace plugin
- Output: ES module format, single-file bundle with source maps, minified for production
- `tsconfig.json` - ES2021 target, strict mode, experimental decorators
- `tsconfig.test.json` - Test-specific TypeScript config

**Python Build:**
- `pyproject.toml` - ruff config (target Python 3.12, 120-char line length), pytest settings, coverage thresholds (85% fail-under)
- `pyrightconfig.json` - Python type checking (basic mode, Python 3.12)

## Platform Requirements

**Development:**
- Python 3.12.8
- Node.js (version not specified, managed by devcontainer)
- Docker (devcontainer with image `mcr.microsoft.com/devcontainers/python:3.12`)
- Home Assistant instance (port 8124 forwarded in devcontainer)

**Production:**
- Home Assistant 2024.x or later (consumed as custom integration via HACS)
- Modern web browser with Web Components support
- Local network access (iot_class: local_push in `manifest.json`)

---

*Stack analysis: 2026-01-31*
