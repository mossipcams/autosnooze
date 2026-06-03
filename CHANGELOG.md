# Changelog

## [0.2.22](https://github.com/mossipcams/autosnooze/compare/v0.2.21...v0.2.22) (2026-06-03)


### Features

* add "Last" duration pill to remember previous snooze duration ([#253](https://github.com/mossipcams/autosnooze/issues/253)) ([b143a6e](https://github.com/mossipcams/autosnooze/commit/b143a6ecbe3acfbee1d49c99d9f85163e28bf058))
* add adjust snooze, card refactoring, and tech debt cleanup ([#273](https://github.com/mossipcams/autosnooze/issues/273)) ([6982374](https://github.com/mossipcams/autosnooze/commit/6982374ff3f105312f197ddf91e09faee384d697))
* add configurable duration pill presets via integration settings ([#265](https://github.com/mossipcams/autosnooze/issues/265)) ([44ccd24](https://github.com/mossipcams/autosnooze/commit/44ccd24aacf9e4846ec19553d083bc39d2ac28f6))
* add frontend internationalization support ([#263](https://github.com/mossipcams/autosnooze/issues/263)) ([e8453ad](https://github.com/mossipcams/autosnooze/commit/e8453ad0398c8a2b94681161648469325cb5ec61))
* add label-based filtering for automations ([#227](https://github.com/mossipcams/autosnooze/issues/227)) ([7025d9d](https://github.com/mossipcams/autosnooze/commit/7025d9d2d4419dbcf0a3d62483e49848e03555fd))
* add snoozed-only Lovelace card ([#397](https://github.com/mossipcams/autosnooze/issues/397)) ([e5b418a](https://github.com/mossipcams/autosnooze/commit/e5b418a3438216863c96c2b3cca9f51a0d4ac9a3))
* auto-create autosnooze_include and autosnooze_exclude labels on setup ([74be992](https://github.com/mossipcams/autosnooze/commit/74be992b2d0a27e7fe1f90c438e39b38f4044eb9))
* auto-create autosnooze_include and autosnooze_exclude labels on setup ([#229](https://github.com/mossipcams/autosnooze/issues/229)) ([303c274](https://github.com/mossipcams/autosnooze/commit/303c274349d87ff07a2371bcf2eb1e680ab23588))
* autofill current date/time when entering schedule mode ([#179](https://github.com/mossipcams/autosnooze/issues/179)) ([8aa2397](https://github.com/mossipcams/autosnooze/commit/8aa23978698d0bb1db55e607beb0bf3fc2b22a09))
* **card:** add quick-clear search interactions ([#303](https://github.com/mossipcams/autosnooze/issues/303)) ([c9c5e4f](https://github.com/mossipcams/autosnooze/commit/c9c5e4f755919702da4033502a61e62712ac591c))
* **card:** harden custom card registration and metadata ([#302](https://github.com/mossipcams/autosnooze/issues/302)) ([cc60c7f](https://github.com/mossipcams/autosnooze/commit/cc60c7f9e37f611c07d33458c1a4df194c7a14ca))
* configurable snooze notifications on natural expiry ([#400](https://github.com/mossipcams/autosnooze/issues/400)) ([d790ab3](https://github.com/mossipcams/autosnooze/commit/d790ab3247e55a221b87b7925262e5bf5735f28d))
* enhance mobile UX with refined visual design ([#197](https://github.com/mossipcams/autosnooze/issues/197)) ([c7393e5](https://github.com/mossipcams/autosnooze/commit/c7393e597c0d6c9e6a69f622b6b03ae53da664a4))
* hide autosnooze_include and autosnooze_exclude labels from labels view ([#249](https://github.com/mossipcams/autosnooze/issues/249)) ([5f302a7](https://github.com/mossipcams/autosnooze/commit/5f302a7d01f593c59ae2939a48acaa2c5f712409))
* implement architecture remediation plan ([#299](https://github.com/mossipcams/autosnooze/issues/299)) ([a07db76](https://github.com/mossipcams/autosnooze/commit/a07db76d96717bb81eb2b16f1cd406ef175bf105))
* improve automation list recents and selection layout ([8c4a481](https://github.com/mossipcams/autosnooze/commit/8c4a4815f47e060aefb0520440326987c6c16d4c))
* improve duration preset UX with individual configuration fields ([#266](https://github.com/mossipcams/autosnooze/issues/266)) ([471087a](https://github.com/mossipcams/autosnooze/commit/471087ab54a18b388f2b981a468c7116b1af390a))
* major architectural improvements and contract hardening ([#301](https://github.com/mossipcams/autosnooze/issues/301)) ([349afbb](https://github.com/mossipcams/autosnooze/commit/349afbbd37cc81485c13ef851a06964de16c31a9))
* make the snoozed-only card read-only ([#408](https://github.com/mossipcams/autosnooze/issues/408)) ([59655f3](https://github.com/mossipcams/autosnooze/commit/59655f3fb00300d72686896e93c55b3ac086af8c))
* **mobile:** enhance UX with touch optimizations and haptic feedback ([#198](https://github.com/mossipcams/autosnooze/issues/198)) ([88eb51d](https://github.com/mossipcams/autosnooze/commit/88eb51d2fd231562f1b958882599db931a9dc824))
* replace manual version bump with Release Please ([#182](https://github.com/mossipcams/autosnooze/issues/182)) ([8f2197a](https://github.com/mossipcams/autosnooze/commit/8f2197ae53077a81906953e2fa38ffba4514647f))


### Bug Fixes

* add include-component-in-tag to match existing release tag format ([e124cbd](https://github.com/mossipcams/autosnooze/commit/e124cbd20262734a7666d20a4890d24d46bc73b5))
* Add manifest.json to root for HACS compatibility ([#51](https://github.com/mossipcams/autosnooze/issues/51)) ([d6669aa](https://github.com/mossipcams/autosnooze/commit/d6669aa99f8e5a0826d2b242060f619935bb8293))
* add pool forks and debug info for CI test hang ([7e5f9f6](https://github.com/mossipcams/autosnooze/commit/7e5f9f69b9203f325113652d6fc9f3ac0d9e205a))
* add timeout and memory limit for CI tests ([29b97de](https://github.com/mossipcams/autosnooze/commit/29b97dea503fbb85fa4a6ed003b68e6ef69ff1c0))
* add write permissions to version bump workflow ([#180](https://github.com/mossipcams/autosnooze/issues/180)) ([be6cc39](https://github.com/mossipcams/autosnooze/commit/be6cc39e4b916907545dfca0e31eae392352ade7))
* align card registration boundaries ([d9cbd10](https://github.com/mossipcams/autosnooze/commit/d9cbd10cc7aa980bf11e0ec0f3697223df72a31c))
* Auto version bump workflow creates PR instead of direct push ([#77](https://github.com/mossipcams/autosnooze/issues/77)) ([3ac6ecf](https://github.com/mossipcams/autosnooze/commit/3ac6ecf9655aaa5569c07b8ab3784e20e52387e8))
* Bundle Lit library to prevent breaking other cards ([095dbd0](https://github.com/mossipcams/autosnooze/commit/095dbd057fe951a82875f4b54614a123c0792f2d))
* Card disappears after page refresh in iOS Companion app ([21e6824](https://github.com/mossipcams/autosnooze/commit/21e6824fdb94135b786d9e5c07c3ea776214b01c))
* Card not loading in YAML-mode dashboards ([#52](https://github.com/mossipcams/autosnooze/issues/52)) ([5ff7f0d](https://github.com/mossipcams/autosnooze/commit/5ff7f0d2f581e93a4621b50d29b4f3dd5c8084ee))
* check built card for version instead of source file ([d3ca29e](https://github.com/mossipcams/autosnooze/commit/d3ca29e2081d9e1479669cb7119e3b857a34435f))
* **ci:** allow manual release-please dispatch ([#337](https://github.com/mossipcams/autosnooze/issues/337)) ([8ac6e2e](https://github.com/mossipcams/autosnooze/commit/8ac6e2e3f20e6ce2f5b8c3242616c6819489872c))
* **ci:** remove redundant knip entry ([f9fc7cc](https://github.com/mossipcams/autosnooze/commit/f9fc7cc1c7c668ba268b46a5be08c292b20eeefd))
* **ci:** sync release PR build status on workflow_dispatch ([#409](https://github.com/mossipcams/autosnooze/issues/409)) ([a741b89](https://github.com/mossipcams/autosnooze/commit/a741b8946c4750d94edfa9fdea41145177b16399))
* configure vitest for CI compatibility with v4.x ([96ab3e4](https://github.com/mossipcams/autosnooze/commit/96ab3e4b76d656238675edd1058feb8805f26936))
* correct YAML indentation in cleanup-branches workflow ([#183](https://github.com/mossipcams/autosnooze/issues/183)) ([0d0b107](https://github.com/mossipcams/autosnooze/commit/0d0b1075861f23d1dd7e033a13fe9263af2be307))
* cover and correct modular refactor regressions ([#339](https://github.com/mossipcams/autosnooze/issues/339)) ([856c386](https://github.com/mossipcams/autosnooze/commit/856c386a047ebf03b3b859419097ea976387a3b1))
* critical reliability, guardrails, and frontend UX improvements ([#282](https://github.com/mossipcams/autosnooze/issues/282)) ([f813b87](https://github.com/mossipcams/autosnooze/commit/f813b87d35907a5ad2ae64ad8668cf08925eeef1))
* Detect stale ES module cache and recover (iOS refresh fix) ([#80](https://github.com/mossipcams/autosnooze/issues/80)) ([471b4c7](https://github.com/mossipcams/autosnooze/commit/471b4c72e52c34b67c5e5892712427257b154499))
* Disable aggressive cache headers (iOS refresh fix) ([#79](https://github.com/mossipcams/autosnooze/issues/79)) ([7e141f2](https://github.com/mossipcams/autosnooze/commit/7e141f2baaaabb369fe9958cac79f0d1d1f9ac78))
* downgrade jsdom from 27.x to 25.x to fix ESM error ([30ee69a](https://github.com/mossipcams/autosnooze/commit/30ee69ac1c49a902e576c4f8fd0d5eb7b7917c6c))
* downgrade jsdom to 25.x for CI compatibility ([a3fd208](https://github.com/mossipcams/autosnooze/commit/a3fd208a71cbb219f8f8ce45a06e2e79f4b69f4e))
* downgrade vitest from 4.x to 3.x to fix CI hang ([87f9eaa](https://github.com/mossipcams/autosnooze/commit/87f9eaaa88e4870c6461fa39f4c754f340fae2bc))
* Guard render until hass/config ready (iOS refresh fix) ([#78](https://github.com/mossipcams/autosnooze/issues/78)) ([00d244c](https://github.com/mossipcams/autosnooze/commit/00d244cdc73dd53a9a1db470d44387e8fc231e05))
* HACS configuration to find JS file in root ([#49](https://github.com/mossipcams/autosnooze/issues/49)) ([300a3c2](https://github.com/mossipcams/autosnooze/commit/300a3c24ff55e05e933bb82fed7ece92a31b9a50))
* HACS-style resource registration and category display ([#47](https://github.com/mossipcams/autosnooze/issues/47)) ([843214d](https://github.com/mossipcams/autosnooze/commit/843214d2f1f54e101f856cbd6d106d02f3cdf983))
* Handle reload and use modern Lovelace API ([#29](https://github.com/mossipcams/autosnooze/issues/29)) ([0bebf5e](https://github.com/mossipcams/autosnooze/commit/0bebf5e3e1a133880c940026ed075eb4acc32a37))
* harden autosnooze scheduling races ([e18d024](https://github.com/mossipcams/autosnooze/commit/e18d024589cda34708e44ef22a3b5181b4ee564e))
* Hide automation areas in Categories tab ([#54](https://github.com/mossipcams/autosnooze/issues/54)) ([2054af4](https://github.com/mossipcams/autosnooze/commit/2054af437af13656d9242dbb3a1bcc4780b1fe66))
* **i18n:** add missing Button 4 translation for preset_4 ([#271](https://github.com/mossipcams/autosnooze/issues/271)) ([ba63444](https://github.com/mossipcams/autosnooze/commit/ba63444ffc61665fee49530cbc9f776389bfb1d9))
* improve mobile UX spacing, proportions, and typography ([#193](https://github.com/mossipcams/autosnooze/issues/193)) ([6676642](https://github.com/mossipcams/autosnooze/commit/6676642118fbe246889447eb0b5fea8d4035fe06))
* isolate CI test hang - run tests without coverage first ([e2f3e60](https://github.com/mossipcams/autosnooze/commit/e2f3e605ed3d958cf51e0b23d48d5b159824f252))
* keep automation list grouping spec CI-safe ([6ebbd03](https://github.com/mossipcams/autosnooze/commit/6ebbd031f509f0c0cd798693ff36389f269e47fe))
* make dep-cruiser blocking for component boundaries ([01b1cdd](https://github.com/mossipcams/autosnooze/commit/01b1cddad88948e90d0450a6036e17ea4565d2db))
* make pre-commit work without ruff installed locally ([67e84a0](https://github.com/mossipcams/autosnooze/commit/67e84a007f707ad86fafe7e1a69f01f8fca422d3))
* Match any autosnooze URL format for resource update ([#30](https://github.com/mossipcams/autosnooze/issues/30)) ([8a2d925](https://github.com/mossipcams/autosnooze/commit/8a2d92596905f7c4aaa6ed4a1711de43e3cc73d7))
* **mobile:** align snoozed automations row layout ([#203](https://github.com/mossipcams/autosnooze/issues/203)) ([a218f8c](https://github.com/mossipcams/autosnooze/commit/a218f8ca8d90c3b3ef62d1affaf2e479c31bfcd9))
* **mobile:** use Home Assistant native haptic events for iOS support ([#252](https://github.com/mossipcams/autosnooze/issues/252)) ([ea7e44e](https://github.com/mossipcams/autosnooze/commit/ea7e44e48a26b3fb572a129b00683c4de01250f4))
* move release-please version annotation to same line ([#187](https://github.com/mossipcams/autosnooze/issues/187)) ([fa88643](https://github.com/mossipcams/autosnooze/commit/fa8864386b3816cf9534ed3be62eb7b439ba431d))
* move SKILL.md to correct skills directory structure ([#196](https://github.com/mossipcams/autosnooze/issues/196)) ([9a0fab8](https://github.com/mossipcams/autosnooze/commit/9a0fab81b7c088b98b7a1e18bd5ed671462ba99c))
* normalize inconsistent font sizes across automation list UI ([652a84d](https://github.com/mossipcams/autosnooze/commit/652a84d20eec241a71ff2945c215b5b02056612d))
* polish automation search row layout ([4f986bb](https://github.com/mossipcams/autosnooze/commit/4f986bb5dc3629eb7bd1a72ea6d16c65fdf5cfd4))
* polish mobile UX spacing, touch targets, and visual consistency ([200363e](https://github.com/mossipcams/autosnooze/commit/200363ea57a4e1c6ca3bffef206ff71000655b10))
* polish recent group header and search row visuals ([de30375](https://github.com/mossipcams/autosnooze/commit/de30375c8e1991e6dcf20e70ae848c6046e91560))
* polish search bar row with toolbar styling and aria-label fix ([fd3e7f8](https://github.com/mossipcams/autosnooze/commit/fd3e7f8ff1d751dac5fc59f24237493d3b3fed25))
* Prevent Lovelace resource registration from breaking other cards ([#36](https://github.com/mossipcams/autosnooze/issues/36)) ([c83e6ed](https://github.com/mossipcams/autosnooze/commit/c83e6ed08db27ddd141b3460878bccabae17767c))
* reapply automation list font normalization ([b96bd24](https://github.com/mossipcams/autosnooze/commit/b96bd245616cea0728502973b230ae8d5456edf5))
* remove dead automation list helper export ([15ec572](https://github.com/mossipcams/autosnooze/commit/15ec572ceba37ab50d894b24e71ec719e8175900))
* remove duplicate automation list grouping ([08bcd0d](https://github.com/mossipcams/autosnooze/commit/08bcd0d4bfa899f716c23575bd5bec3ecf4f091d))
* remove orange background from countdown timer ([#207](https://github.com/mossipcams/autosnooze/issues/207)) ([2ffd6a1](https://github.com/mossipcams/autosnooze/commit/2ffd6a19335ef9ed08e34eb7af1bf01103c63648))
* remove sticky snooze action bar from card UI ([#292](https://github.com/mossipcams/autosnooze/issues/292)) ([8b44438](https://github.com/mossipcams/autosnooze/commit/8b44438f48d3c383996e05b58b0de6ec5d79d2f3))
* rename vitest.config.js to .mjs for ESM compatibility ([1812e87](https://github.com/mossipcams/autosnooze/commit/1812e87867853f02df95b4c13e5e0f508be21d07))
* resolve Vitest 4.0 CI hang and add label filtering tests ([6228b48](https://github.com/mossipcams/autosnooze/commit/6228b4884dc044e5ab883c21b8d4f2adbf52bfd8))
* restore active pauses cleanup bootstrap ([90e6c8a](https://github.com/mossipcams/autosnooze/commit/90e6c8ac2760c871edcbdb9427df84df86cfed76))
* restore claude/ branch prefix removal in pre-commit ([410b3de](https://github.com/mossipcams/autosnooze/commit/410b3de33ded67c597286ca6262ac911b293737e))
* restore original timer color to deep orange (#e65100) ([#205](https://github.com/mossipcams/autosnooze/issues/205)) ([d1f0a1e](https://github.com/mossipcams/autosnooze/commit/d1f0a1ee3272b1a8451c93fe771fb07951cd9b76))
* Revert to query-param cache busting (HA ecosystem standard) ([05701dd](https://github.com/mossipcams/autosnooze/commit/05701dd577995d088e00cc7adc3e9e4a549c36ee))
* revert vitest to 3.x for CI compatibility ([52b5fb2](https://github.com/mossipcams/autosnooze/commit/52b5fb25ca5d266908f82e56b79c02d8d52ee592))
* satisfy knip for version sync helper ([1032d71](https://github.com/mossipcams/autosnooze/commit/1032d71f380897748bfb794b733029eb18803f94))
* simplify and tighten README copy ([#343](https://github.com/mossipcams/autosnooze/issues/343)) ([1843be9](https://github.com/mossipcams/autosnooze/commit/1843be96c4f284f249d097f894006975efc120eb))
* Simplify HACS config for integration type ([#50](https://github.com/mossipcams/autosnooze/issues/50)) ([494685c](https://github.com/mossipcams/autosnooze/commit/494685c2114a229fc1a279f4e96105e9134a8bbe))
* simplify vitest config to fix CI hang ([5fa3561](https://github.com/mossipcams/autosnooze/commit/5fa3561e3ec9f62a6db3d4c44ac4cf186a9e147b))
* switch from v8 to istanbul coverage provider ([413d0e5](https://github.com/mossipcams/autosnooze/commit/413d0e563d1ab0bc846b8fe31ff8fe821611ee5b))
* tighten mobile snooze layout ([#386](https://github.com/mossipcams/autosnooze/issues/386)) ([4acb11d](https://github.com/mossipcams/autosnooze/commit/4acb11d66995aabd0b6d821a1a2a59799021c9b0))
* **ui:** hide select-all when fully selected and neutralize clear hover ([#309](https://github.com/mossipcams/autosnooze/issues/309)) ([87b0744](https://github.com/mossipcams/autosnooze/commit/87b07448d88fc5417c0a000a4a1840861877d5a3))
* update version extraction regex for minified output ([5657a17](https://github.com/mossipcams/autosnooze/commit/5657a17843e952ddbc021c88aede2b36ac1de202))
* Use /api/ prefix for reverse proxy compatibility ([#31](https://github.com/mossipcams/autosnooze/issues/31)) ([c14d4bc](https://github.com/mossipcams/autosnooze/commit/c14d4bc12367493fe06b1644cb4e0bc3c40bd825))
* Use Lovelace Resources only (iOS refresh fix) ([#81](https://github.com/mossipcams/autosnooze/issues/81)) ([b2b2959](https://github.com/mossipcams/autosnooze/commit/b2b29592f1ac0155c4263869772cc893045ef759))
* use pool forks to prevent test hang in CI ([392a36c](https://github.com/mossipcams/autosnooze/commit/392a36c319b40624096b9f0c5471432419eb44ab))
* use relative path for lit alias in vitest config ([baa1c52](https://github.com/mossipcams/autosnooze/commit/baa1c52c393431078fbeaf453b9c9ca1fb1df6fd))
* Use root-level path like browser_mod to avoid conflicts ([#33](https://github.com/mossipcams/autosnooze/issues/33)) ([9d27f7a](https://github.com/mossipcams/autosnooze/commit/9d27f7a0191404aaa7947a4e89db221199f37105))
* use secondary text color for countdown timers ([#206](https://github.com/mossipcams/autosnooze/issues/206)) ([9092e18](https://github.com/mossipcams/autosnooze/commit/9092e187bc3acc3627aa0974fc73fd72917e6549))
* use theme text colors for countdown timer display ([#208](https://github.com/mossipcams/autosnooze/issues/208)) ([06d35e6](https://github.com/mossipcams/autosnooze/commit/06d35e673b462d3939b3ff02c7f0b716e173a4b0))


### Performance Improvements

* Optimize for 100+ automations, add defect log ([697930c](https://github.com/mossipcams/autosnooze/commit/697930cdbe635a8369289d3cfc23ec98699c0c7f))
* speed up card load and action flows ([2e1e6c8](https://github.com/mossipcams/autosnooze/commit/2e1e6c8239f0c15a9ef29d95efb54c79075e2e31))


### Reverts

* temporarily revert label auto-creation for squash ([bc9002c](https://github.com/mossipcams/autosnooze/commit/bc9002cf63ec055983ac0cf9e7deb015d8c7f5e7))
* Undo HACS configuration changes from PRs [#49](https://github.com/mossipcams/autosnooze/issues/49), [#50](https://github.com/mossipcams/autosnooze/issues/50), [#51](https://github.com/mossipcams/autosnooze/issues/51) ([#52](https://github.com/mossipcams/autosnooze/issues/52)) ([2a8142f](https://github.com/mossipcams/autosnooze/commit/2a8142fc1163535d10be426c37973b1748207a13))

## [0.2.21](https://github.com/mossipcams/autosnooze/compare/v0.2.20...v0.2.21) (2026-06-02)


### Features

* add snoozed-only Lovelace card ([#397](https://github.com/mossipcams/autosnooze/issues/397)) ([e5b418a](https://github.com/mossipcams/autosnooze/commit/e5b418a3438216863c96c2b3cca9f51a0d4ac9a3))

## [0.2.20](https://github.com/mossipcams/autosnooze/compare/v0.2.19...v0.2.20) (2026-05-18)


### Bug Fixes

* align card registration boundaries ([d9cbd10](https://github.com/mossipcams/autosnooze/commit/d9cbd10cc7aa980bf11e0ec0f3697223df72a31c))
* tighten mobile snooze layout ([#386](https://github.com/mossipcams/autosnooze/issues/386)) ([4acb11d](https://github.com/mossipcams/autosnooze/commit/4acb11d66995aabd0b6d821a1a2a59799021c9b0))

## [0.2.19](https://github.com/mossipcams/autosnooze/compare/v0.2.18...v0.2.19) (2026-05-04)


### Bug Fixes

* harden autosnooze scheduling races ([e18d024](https://github.com/mossipcams/autosnooze/commit/e18d024589cda34708e44ef22a3b5181b4ee564e))
* normalize inconsistent font sizes across automation list UI ([652a84d](https://github.com/mossipcams/autosnooze/commit/652a84d20eec241a71ff2945c215b5b02056612d))
* polish mobile UX spacing, touch targets, and visual consistency ([200363e](https://github.com/mossipcams/autosnooze/commit/200363ea57a4e1c6ca3bffef206ff71000655b10))
* reapply automation list font normalization ([b96bd24](https://github.com/mossipcams/autosnooze/commit/b96bd245616cea0728502973b230ae8d5456edf5))

## [0.2.18](https://github.com/mossipcams/autosnooze/compare/v0.2.17...v0.2.18) (2026-04-13)


### Features

* improve automation list recents and selection layout ([2b307db](https://github.com/mossipcams/autosnooze/commit/2b307db9b16f1142d4dde7cd2bf3694008827190))


### Bug Fixes

* make dep-cruiser blocking for component boundaries ([185f212](https://github.com/mossipcams/autosnooze/commit/185f212bd8a1022c28750af4df8bc6068b521591))
* polish automation search row layout ([c09f4e3](https://github.com/mossipcams/autosnooze/commit/c09f4e3d058fdce2312fa3a12aeaa68ccbcb82d0))
* polish recent group header and search row visuals ([320db1b](https://github.com/mossipcams/autosnooze/commit/320db1ba08a73f24ab9ba0b8b496cd0709fd7233))
* polish search bar row with toolbar styling and aria-label fix ([be8b294](https://github.com/mossipcams/autosnooze/commit/be8b294af56ae3bccdcfa35f936baf08980e1516))
* satisfy knip for version sync helper ([f466224](https://github.com/mossipcams/autosnooze/commit/f466224fea7e01c470fc7bd3e28a1346add14cd0))

## [0.2.17](https://github.com/mossipcams/autosnooze/compare/v0.2.16...v0.2.17) (2026-04-07)


### Bug Fixes

* simplify and tighten README copy ([#343](https://github.com/mossipcams/autosnooze/issues/343)) ([28a87de](https://github.com/mossipcams/autosnooze/commit/28a87de352b408f4b904c6bcf679a3f614815a4a))

## [0.2.16](https://github.com/mossipcams/autosnooze/compare/v0.2.15...v0.2.16) (2026-04-07)


### Bug Fixes

* **ci:** allow manual release-please dispatch ([#337](https://github.com/mossipcams/autosnooze/issues/337)) ([bc1d48f](https://github.com/mossipcams/autosnooze/commit/bc1d48fbe1b6ff7c0a341cd89a8867dbd2c52a59))
* **ci:** remove redundant knip entry ([bc96446](https://github.com/mossipcams/autosnooze/commit/bc964460a566a560d0c118d153ebe799261f742b))
* cover and correct modular refactor regressions ([#339](https://github.com/mossipcams/autosnooze/issues/339)) ([e73c254](https://github.com/mossipcams/autosnooze/commit/e73c254005622f36ee3fa34a41d2f69b6e6ba25f))
* keep automation list grouping spec CI-safe ([f10dbf6](https://github.com/mossipcams/autosnooze/commit/f10dbf639c816d23859218a69a58dc568a7be5a7))
* remove dead automation list helper export ([5d074ae](https://github.com/mossipcams/autosnooze/commit/5d074aeae8b3c84ddee05e41842df8beaee10fdc))
* remove duplicate automation list grouping ([9eed1f8](https://github.com/mossipcams/autosnooze/commit/9eed1f8f4e3f494d744b2a23c5a5355f1dd9b5bc))
* restore active pauses cleanup bootstrap ([098cf99](https://github.com/mossipcams/autosnooze/commit/098cf99c5ebf8ab32628802be475e3be651fbd5d))


### Performance Improvements

* speed up card load and action flows ([86be364](https://github.com/mossipcams/autosnooze/commit/86be36447d22173ba8e4873959b61f1ff904a5c7))

## [0.2.15](https://github.com/mossipcams/autosnooze/compare/v0.2.14...v0.2.15) (2026-03-10)


### Bug Fixes

* **ui:** hide select-all when fully selected and neutralize clear hover ([#309](https://github.com/mossipcams/autosnooze/issues/309)) ([c48788d](https://github.com/mossipcams/autosnooze/commit/c48788d188969380799caff56170989fd5b39420))

## [0.2.14](https://github.com/mossipcams/autosnooze/compare/v0.2.13...v0.2.14) (2026-02-27)


### Features

* **card:** add quick-clear search interactions ([#303](https://github.com/mossipcams/autosnooze/issues/303)) ([e70b30d](https://github.com/mossipcams/autosnooze/commit/e70b30d757946e9aaac3216c4f85eba03066ee4c))
* **card:** harden custom card registration and metadata ([#302](https://github.com/mossipcams/autosnooze/issues/302)) ([73b5166](https://github.com/mossipcams/autosnooze/commit/73b5166e375a42b7ab2c8e301dc4a88e575e5415))
* implement architecture remediation plan ([#299](https://github.com/mossipcams/autosnooze/issues/299)) ([e996875](https://github.com/mossipcams/autosnooze/commit/e996875eb2600b26f9c1d9ce97b83b77d97bf19b))
* major architectural improvements and contract hardening ([#301](https://github.com/mossipcams/autosnooze/issues/301)) ([bc591f4](https://github.com/mossipcams/autosnooze/commit/bc591f4e471d2577809079cdb6cc6aac368e3ac4))

### Bug Fixes

* dependency cleanup and selection UX polish (includes CI/security dependency fixes and removal of redundant "Deselect All" action) ([#308](https://github.com/mossipcams/autosnooze/issues/308)) ([87597c9](https://github.com/mossipcams/autosnooze/commit/87597c9cee66119efb2cd177ddf75196adb574fa))

## [0.2.13](https://github.com/mossipcams/autosnooze/compare/v0.2.12...v0.2.13) (2026-02-10)


### Bug Fixes

* remove sticky snooze action bar from card UI ([#292](https://github.com/mossipcams/autosnooze/issues/292)) ([e02bfce](https://github.com/mossipcams/autosnooze/commit/e02bfce6791e516e0079ea66442b0b56c66151cc))

## [0.2.12](https://github.com/mossipcams/autosnooze/compare/v0.2.11...v0.2.12) (2026-02-10)


### Bug Fixes

* critical reliability, guardrails, and frontend UX improvements ([#282](https://github.com/mossipcams/autosnooze/issues/282)) ([c70b248](https://github.com/mossipcams/autosnooze/commit/c70b248a08da6f267285b5a7b1cb25cb55232477))

## [0.2.11](https://github.com/mossipcams/autosnooze/compare/v0.2.10...v0.2.11) (2026-02-02)


### Features

* add adjust snooze, card refactoring, and tech debt cleanup ([#273](https://github.com/mossipcams/autosnooze/issues/273)) ([8706755](https://github.com/mossipcams/autosnooze/commit/870675513f4f0b478c5188844cc954126bcfeb96))


### Bug Fixes

* **i18n:** add missing Button 4 translation for preset_4 ([#271](https://github.com/mossipcams/autosnooze/issues/271)) ([c1c6b61](https://github.com/mossipcams/autosnooze/commit/c1c6b615d386c8472b1019fcade6a1c47b162acf))

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
