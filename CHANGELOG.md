# Changelog

## [0.2.10](https://github.com/mossipcams/autosnooze/compare/v0.2.9...v0.2.10) (2026-01-27)


### Features

* add configurable duration pill presets via integration settings ([#265](https://github.com/mossipcams/autosnooze/issues/265)) ([22887a3](https://github.com/mossipcams/autosnooze/commit/22887a3414b1c679773228c838f16267457c59b4))
* add frontend internationalization support ([#263](https://github.com/mossipcams/autosnooze/issues/263)) ([056b783](https://github.com/mossipcams/autosnooze/commit/056b7835bd6b370f287429634500c1bb6e3603b7))
* improve duration preset UX with individual configuration fields ([#266](https://github.com/mossipcams/autosnooze/issues/266)) ([8aa3efa](https://github.com/mossipcams/autosnooze/commit/8aa3efab35728b87fcca9bf85b3dd6654037805e))

## [0.2.9](https://github.com/mossipcams/autosnooze/compare/v0.2.8...v0.2.9) (2026-01-20)


### Features

* add "Last" duration pill to remember previous snooze duration ([#253](https://github.com/mossipcams/autosnooze/issues/253)) ([861f269](https://github.com/mossipcams/autosnooze/commit/861f269b18c6390b7b632eb809f060e508097c57))
* hide autosnooze_include and autosnooze_exclude labels from labels view ([#249](https://github.com/mossipcams/autosnooze/issues/249)) ([e4668fe](https://github.com/mossipcams/autosnooze/commit/e4668fefbea10e7356f5a7caab80e5e39f6e0c05))


### Bug Fixes

* **mobile:** use Home Assistant native haptic events for iOS support ([#252](https://github.com/mossipcams/autosnooze/issues/252)) ([5e3b0ce](https://github.com/mossipcams/autosnooze/commit/5e3b0cef201623a51658563e31dc648b9ee8645b))

## [0.2.8](https://github.com/mossipcams/autosnooze/compare/v0.2.7...v0.2.8) (2026-01-14)


### Features

* auto-create autosnooze_include and autosnooze_exclude labels on setup ([c018b7e](https://github.com/mossipcams/autosnooze/commit/c018b7e584e10b7fae7a7727418e7d664d6222ff))
* auto-create autosnooze_include and autosnooze_exclude labels on setup ([#229](https://github.com/mossipcams/autosnooze/issues/229)) ([88f2dfc](https://github.com/mossipcams/autosnooze/commit/88f2dfc96efc4d5a96f21b739d4b825c770e9d52))


### Bug Fixes

* resolve Vitest 4.0 CI hang and add label filtering tests ([3fd4e95](https://github.com/mossipcams/autosnooze/commit/3fd4e956c2077e1bfa92d59f717bb1f922ee9fd0))


### Reverts

* temporarily revert label auto-creation for squash ([26a6a79](https://github.com/mossipcams/autosnooze/commit/26a6a79f589da84f1134054d5d7a134d77864b82))

## [0.2.7](https://github.com/mossipcams/autosnooze/compare/v0.2.6...v0.2.7) (2026-01-07)


### Features

* add label-based filtering for automations ([#227](https://github.com/mossipcams/autosnooze/issues/227)) ([6795ea4](https://github.com/mossipcams/autosnooze/commit/6795ea448a4ac58e482eac0609acf0783062f44a))


### Bug Fixes

* add include-component-in-tag to match existing release tag format ([5a57bf8](https://github.com/mossipcams/autosnooze/commit/5a57bf8e36de48ef290621815e84bfa0f8867c05))
* add pool forks and debug info for CI test hang ([8cddaf8](https://github.com/mossipcams/autosnooze/commit/8cddaf8822ee6a16cdfcfe495bccc85850b16494))
* add timeout and memory limit for CI tests ([31caf05](https://github.com/mossipcams/autosnooze/commit/31caf05f6778e499a00bbef54d4604e4e5e1d513))
* check built card for version instead of source file ([f77f8ae](https://github.com/mossipcams/autosnooze/commit/f77f8ae64fad3cf2332ba0dbc498b499c88a3295))
* configure vitest for CI compatibility with v4.x ([021e1a8](https://github.com/mossipcams/autosnooze/commit/021e1a8158fbce81d0ce573d758203fa8738757d))
* downgrade jsdom from 27.x to 25.x to fix ESM error ([fc98e01](https://github.com/mossipcams/autosnooze/commit/fc98e015c0009c8573138d6837bcc2ee661a427b))
* downgrade jsdom to 25.x for CI compatibility ([4c5ac9d](https://github.com/mossipcams/autosnooze/commit/4c5ac9dc94599489c503bbc11a03004eb8f33ef7))
* downgrade vitest from 4.x to 3.x to fix CI hang ([b0b63df](https://github.com/mossipcams/autosnooze/commit/b0b63df422ed00eb940f2d608939d4ef9f141133))
* isolate CI test hang - run tests without coverage first ([d4205f4](https://github.com/mossipcams/autosnooze/commit/d4205f4f729ad2cc3bc8c8b11a28875eb7efc613))
* make pre-commit work without ruff installed locally ([c5f737b](https://github.com/mossipcams/autosnooze/commit/c5f737b9791745e824db04d78c80e9d0a81ed726))
* rename vitest.config.js to .mjs for ESM compatibility ([1147465](https://github.com/mossipcams/autosnooze/commit/1147465199284a085b55090586d8ffad994aa6cf))
* restore claude/ branch prefix removal in pre-commit ([796fd0b](https://github.com/mossipcams/autosnooze/commit/796fd0b4fee355bab82acb8582498d6d186a5726))
* revert vitest to 3.x for CI compatibility ([05fbd70](https://github.com/mossipcams/autosnooze/commit/05fbd702d4f2f3a929b61a4b5b43b85ece5e146a))
* simplify vitest config to fix CI hang ([51476b7](https://github.com/mossipcams/autosnooze/commit/51476b7c3172088bada5bae0056efa14c115082e))
* switch from v8 to istanbul coverage provider ([605a627](https://github.com/mossipcams/autosnooze/commit/605a627595e61c2d78f6bd6e7f7189a04a91bb76))
* update version extraction regex for minified output ([d91a6fe](https://github.com/mossipcams/autosnooze/commit/d91a6fe5b027fe3bdef55d39a05cb4dffd46665a))
* use pool forks to prevent test hang in CI ([b12bcdf](https://github.com/mossipcams/autosnooze/commit/b12bcdf9acc1aeebe752b366f71bb7d724ffe618))
* use relative path for lit alias in vitest config ([ea19866](https://github.com/mossipcams/autosnooze/commit/ea19866c3fc8670354be186024f6a4999c37bcf4))

## [0.2.6](https://github.com/mossipcams/autosnooze/compare/autosnooze-v0.2.5...autosnooze-v0.2.6) (2025-12-29)


### Features

* autofill current date/time when entering schedule mode ([#179](https://github.com/mossipcams/autosnooze/issues/179)) ([f1695e5](https://github.com/mossipcams/autosnooze/commit/f1695e5476c5f662583cddb10eeb7ea6a1ec129f))
* enhance mobile UX with refined visual design ([#197](https://github.com/mossipcams/autosnooze/issues/197)) ([6033ccb](https://github.com/mossipcams/autosnooze/commit/6033ccb30aa6f90ffc2f5eeeaa578cf274911fa3))
* **mobile:** enhance UX with touch optimizations and haptic feedback ([#198](https://github.com/mossipcams/autosnooze/issues/198)) ([6c5e4ad](https://github.com/mossipcams/autosnooze/commit/6c5e4ada3bfe8dd13fe11b88d8f23831b041035f))
* replace manual version bump with Release Please ([#182](https://github.com/mossipcams/autosnooze/issues/182)) ([c987c48](https://github.com/mossipcams/autosnooze/commit/c987c48956cea57de09a6a8f1c27ea3cfc681dcc))


### Bug Fixes

* Add manifest.json to root for HACS compatibility ([#51](https://github.com/mossipcams/autosnooze/issues/51)) ([32a5c00](https://github.com/mossipcams/autosnooze/commit/32a5c002a3a313e65a56ae43c3656bb6487ad1d4))
* add write permissions to version bump workflow ([#180](https://github.com/mossipcams/autosnooze/issues/180)) ([dcdd5fd](https://github.com/mossipcams/autosnooze/commit/dcdd5fd53e9851aed511af06d9504239a4ff03ba))
* Auto version bump workflow creates PR instead of direct push ([#77](https://github.com/mossipcams/autosnooze/issues/77)) ([0d0dbcb](https://github.com/mossipcams/autosnooze/commit/0d0dbcbf8b7430b1ced91788febb42275ca0739f))
* Bundle Lit library to prevent breaking other cards ([a4d31af](https://github.com/mossipcams/autosnooze/commit/a4d31afd2ddd8e90e98a52208c06deaf9f186859))
* Card disappears after page refresh in iOS Companion app ([caedfcb](https://github.com/mossipcams/autosnooze/commit/caedfcbbc7b22c1aa7d67d349a29908110ee217c))
* Card not loading in YAML-mode dashboards ([#52](https://github.com/mossipcams/autosnooze/issues/52)) ([d06db8d](https://github.com/mossipcams/autosnooze/commit/d06db8dc803b5fe6611e1839bcbee898a3c2b01a))
* Convert TypeScript to plain JavaScript to prevent breaking other cards ([32d323d](https://github.com/mossipcams/autosnooze/commit/32d323d70efae39f215a617dac0a30777775ddc8))
* correct YAML indentation in cleanup-branches workflow ([#183](https://github.com/mossipcams/autosnooze/issues/183)) ([625c737](https://github.com/mossipcams/autosnooze/commit/625c737a424f11881db5d35e48d569a2d5dca604))
* Detect stale ES module cache and recover (iOS refresh fix) ([#80](https://github.com/mossipcams/autosnooze/issues/80)) ([946b136](https://github.com/mossipcams/autosnooze/commit/946b136db6fac6fb6de072cda714cd846cd7f262))
* Disable aggressive cache headers (iOS refresh fix) ([#79](https://github.com/mossipcams/autosnooze/issues/79)) ([eb55d13](https://github.com/mossipcams/autosnooze/commit/eb55d136f772d64d8d47382af9fc404cfae44595))
* Disable automatic Lovelace registration to prevent breaking other cards ([44a773f](https://github.com/mossipcams/autosnooze/commit/44a773ff828ee06a7cc5fd248937984d9e95f30f))
* Guard render until hass/config ready (iOS refresh fix) ([#78](https://github.com/mossipcams/autosnooze/issues/78)) ([7109dd6](https://github.com/mossipcams/autosnooze/commit/7109dd615acd0132b350e598cc273d3e6d31dbb5))
* HACS configuration to find JS file in root ([#49](https://github.com/mossipcams/autosnooze/issues/49)) ([3e99541](https://github.com/mossipcams/autosnooze/commit/3e995412252e471d03f0e74631b605a067da24db))
* HACS-style resource registration and category display ([#47](https://github.com/mossipcams/autosnooze/issues/47)) ([6c44aaf](https://github.com/mossipcams/autosnooze/commit/6c44aaf9a870b849dade58bbfd55a2e2a8ca0fdb))
* Handle reload and use modern Lovelace API ([#29](https://github.com/mossipcams/autosnooze/issues/29)) ([0d57a8e](https://github.com/mossipcams/autosnooze/commit/0d57a8e0cce14b04090df8c2d87cb675c04dd156))
* Hide automation areas in Categories tab ([#54](https://github.com/mossipcams/autosnooze/issues/54)) ([005cc3c](https://github.com/mossipcams/autosnooze/commit/005cc3ca86fc763e30f8784d3a1592d0c19594b0))
* improve mobile UX spacing, proportions, and typography ([#193](https://github.com/mossipcams/autosnooze/issues/193)) ([d1c06e5](https://github.com/mossipcams/autosnooze/commit/d1c06e5764729932bdaa1a258c3838e84577f1c6))
* Match any autosnooze URL format for resource update ([#30](https://github.com/mossipcams/autosnooze/issues/30)) ([e375440](https://github.com/mossipcams/autosnooze/commit/e375440984f80c1b64d2d206e6995775fa09065d))
* **mobile:** align snoozed automations row layout ([#203](https://github.com/mossipcams/autosnooze/issues/203)) ([2c890c2](https://github.com/mossipcams/autosnooze/commit/2c890c28b6a6afe39472cf413d8a24a24f812b87))
* move release-please version annotation to same line ([#187](https://github.com/mossipcams/autosnooze/issues/187)) ([75efbb8](https://github.com/mossipcams/autosnooze/commit/75efbb86b578c1ea74e632a31e3f99cd9fa3164d))
* move SKILL.md to correct skills directory structure ([#196](https://github.com/mossipcams/autosnooze/issues/196)) ([40130d2](https://github.com/mossipcams/autosnooze/commit/40130d269123273a42b0b3c53ade780542c080af))
* Prevent Lovelace resource registration from breaking other cards ([#36](https://github.com/mossipcams/autosnooze/issues/36)) ([8789213](https://github.com/mossipcams/autosnooze/commit/87892134006778bad89ad091b1230517f91ee879))
* remove orange background from countdown timer ([#207](https://github.com/mossipcams/autosnooze/issues/207)) ([5d16098](https://github.com/mossipcams/autosnooze/commit/5d160985c088fc6baf3bf9fe407eaa078f432bbf))
* restore original timer color to deep orange (#e65100) ([#205](https://github.com/mossipcams/autosnooze/issues/205)) ([582efc7](https://github.com/mossipcams/autosnooze/commit/582efc7b1465f21489a23e642d9b91387642c054))
* Revert to query-param cache busting (HA ecosystem standard) ([7a17f35](https://github.com/mossipcams/autosnooze/commit/7a17f35c2f3ab9318e5597950e7ea8ff8985d8ef))
* Simplify HACS config for integration type ([#50](https://github.com/mossipcams/autosnooze/issues/50)) ([3954bf6](https://github.com/mossipcams/autosnooze/commit/3954bf61d45ee6e14d14cf7176aad9f343c170d3))
* Use /api/ prefix for reverse proxy compatibility ([#31](https://github.com/mossipcams/autosnooze/issues/31)) ([8f63911](https://github.com/mossipcams/autosnooze/commit/8f6391153093de26ad028fa5d38a44c638618734))
* Use Lovelace Resources only (iOS refresh fix) ([#81](https://github.com/mossipcams/autosnooze/issues/81)) ([2e4fcc0](https://github.com/mossipcams/autosnooze/commit/2e4fcc0dd7b542ac892caefafb5733738f41f455))
* Use root-level path like browser_mod to avoid conflicts ([#33](https://github.com/mossipcams/autosnooze/issues/33)) ([2c7ce91](https://github.com/mossipcams/autosnooze/commit/2c7ce9144f1131508e17564dc663ec53f199b302))
* use secondary text color for countdown timers ([#206](https://github.com/mossipcams/autosnooze/issues/206)) ([164647d](https://github.com/mossipcams/autosnooze/commit/164647d1943374871b5c6c517cba9b4a2e88507d))
* use theme text colors for countdown timer display ([#208](https://github.com/mossipcams/autosnooze/issues/208)) ([a48b354](https://github.com/mossipcams/autosnooze/commit/a48b3546e311b53bb9608707faa6eebd5f6824ad))


### Performance Improvements

* Optimize for 100+ automations, add defect log ([64f1dff](https://github.com/mossipcams/autosnooze/commit/64f1dffd1ee87de51b37ba03b8cfd959bb48aac2))


### Reverts

* Undo HACS configuration changes from PRs [#49](https://github.com/mossipcams/autosnooze/issues/49), [#50](https://github.com/mossipcams/autosnooze/issues/50), [#51](https://github.com/mossipcams/autosnooze/issues/51) ([#52](https://github.com/mossipcams/autosnooze/issues/52)) ([d31f32c](https://github.com/mossipcams/autosnooze/commit/d31f32ca2cbe4a8d91a910cf8b9b60b5603f3611))
