# Codebase Concerns

**Analysis Date:** 2026-01-31

## Tech Debt

**Large Monolithic Frontend Component:**
- Issue: `src/components/autosnooze-card.ts` is 1,338 lines, containing UI rendering, state management, WebSocket communication, and business logic in a single file
- Files: `src/components/autosnooze-card.ts`
- Impact: Makes testing harder, increases cognitive load for modifications, harder to reuse logic
- Fix approach: Extract state management (`_automationsCache`, `_labelRegistry`, etc.) into separate service classes; separate WebSocket registry fetching into dedicated module; consider splitting UI rendering into smaller sub-components

**Large CSS Stylesheet:**
- Issue: `src/styles/card.styles.ts` is 1,491 lines of inline CSS, containing all card styling in a single file
- Files: `src/styles/card.styles.ts`
- Impact: Difficult to navigate and modify specific styles; makes understanding visual organization harder
- Fix approach: Split into logical sections (layout.ts, theme.ts, utilities.ts) or use CSS modules if Lit component structure supports it

**Missing Cache Invalidation Strategy:**
- Issue: Frontend caches automations list with version key (`_automationsCacheVersion`) but no explicit mechanism to force cache refresh on demand
- Files: `src/components/autosnooze-card.ts` (lines 92-93), `src/state/automations.ts`
- Impact: User may see stale automation list if Home Assistant state changes externally without sensor update
- Fix approach: Add public cache invalidation method; consider real-time WebSocket subscriptions instead of poll-based approach

## Known Bugs

**E2E Test Flakiness - Recent Fixes:**
- Symptoms: Tests fail intermittently with timeout errors during button clicks and state transitions
- Files: `e2e/tests/` (multiple test files with timeout extensions)
- Trigger: Running full test suite; async operations not properly awaited
- Workaround: Increased timeouts from 2s to 5-10s, added explicit wait conditions
- Status: Partially mitigated with recent commits (b6f0cd2, 5608b82, fd55325) but underlying issue remains

**Uncovered Timer Callback Paths:**
- Symptoms: Timer callbacks in coordinator never execute in test environment
- Files: `custom_components/autosnooze/coordinator.py` lines 82-84, 137-139
- Trigger: Tests mock `async_track_point_in_time` without executing callbacks
- Coverage Gap: 13% of coordinator.py code untested (32 missing lines)
- Risk: Timer expiration and scheduled disable edge cases not validated

**Incomplete `handle_cancel_scheduled` Test Coverage:**
- Symptoms: Service handler for canceling scheduled snoozes is completely untested
- Files: `custom_components/autosnooze/services.py` lines 260-268
- Coverage: 0% (9 missing lines)
- Risk: Scheduled cancellation could fail silently in production

## Security Considerations

**No Input Validation for Duration Parameters:**
- Risk: Frontend accepts arbitrary duration strings without strict validation
- Files: `src/utils/duration-parsing.ts`, `src/components/autosnooze-card.ts`
- Current mitigation: Basic regex patterns; Home Assistant service layer validates entity IDs
- Recommendations: Add bounds checking (max duration limit); sanitize user input before service calls; validate all parameters server-side

**Blocking Service Calls:**
- Risk: `blocking=True` on `automation.turn_on/turn_off` calls can freeze Home Assistant if automations fail to respond
- Files: `custom_components/autosnooze/coordinator.py` line 39
- Current mitigation: 10-second HA timeout (built-in)
- Recommendations: Consider non-blocking calls with state polling; add timeout override if automations are slow; log all service call failures

**No Rate Limiting on Service Calls:**
- Risk: Frontend can issue rapid pause/wake requests without rate limiting
- Files: Service handlers in `custom_components/autosnooze/services.py`
- Current mitigation: None
- Recommendations: Implement client-side debouncing on button clicks; add server-side rate limit per entity

## Performance Bottlenecks

**Linear Automation State Iteration:**
- Problem: `shouldUpdate()` iterates through all `automation.*` entities on every Home Assistant state change
- Files: `src/components/autosnooze-card.ts` lines 163-175
- Cause: No indexed lookup; checks every automation individually
- Improvement path: Build Set of tracked automation IDs; only check members of set; use bloom filter for large deployments (100+ automations)

**Synchronous Registry Lookups:**
- Problem: `getLabelName()`, `getCategoryName()` perform object lookups for every item rendered
- Files: `src/state/automations.ts` lines 29-45
- Cause: No memoization; re-lookup on every render
- Improvement path: Memoize registry lookups; cache formatted names in automation item objects

**Single Save Operation Performance:**
- Problem: Each pause/resume triggers `async_save()` which persists entire state to disk
- Files: `custom_components/autosnooze/coordinator.py` line 98-120
- Cause: Store API requires full state write
- Improvement path: Implement delta persistence (only save changed entries); use in-memory queue with batched disk writes; consider SQLite for large pause counts

**Frontend Countdown Timer Loop:**
- Problem: Creates interval for every visible paused item to update countdown text
- Files: `src/components/autosnooze-card.ts` (timer setup)
- Cause: No timer consolidation; `getCardSize()` suggests many items = many intervals
- Improvement path: Single shared interval updating all timers; use CSS animation for visual updates; batch DOM updates per second

## Fragile Areas

**Automation State Restoration on Load:**
- Files: `custom_components/autosnooze/coordinator.py` lines 407-509 (`async_load_stored`)
- Why fragile: Complex error handling with silent failures; if `async_set_automation_state()` fails, entry is marked expired but no retry mechanism
- Safe modification: Add integration test for each failure mode (deleted automation, HA restart during restore, permission denied); validate restored state matches stored state
- Test coverage: 62% (21 missing lines cover error paths)
- Gap: Timer expiration during load never tested; orphaned entries not validated

**Datetime Handling - DEF-013 Fix:**
- Files: `custom_components/autosnooze/models.py` lines 44-70
- Why fragile: User timezones + Local/UTC conversions are subtle; fix assumes `dt_util.get_default_time_zone()` always returns valid tz
- Safe modification: Add explicit test for each timezone scenario (UTC, UTC+8, UTC-5, DST transitions); validate round-trip datetime conversions
- Test coverage: Function is 100% covered but real-world timezone mixing scenarios not tested

**Concurrency Lock Strategy:**
- Files: `custom_components/autosnooze/coordinator.py` throughout
- Why fragile: Asyncio lock ordering and deadlock potential; operations that sleep while holding lock could cause timeouts
- Safe modification: Audit all `async with data.lock:` blocks; ensure no async waits inside lock; use lock-free queue if possible for inter-task communication
- Risk: Scheduled disable callback (`on_timer`) creates task but doesn't acquire lock - potential race

**Registry Fetch Failures:**
- Files: `src/components/autosnooze-card.ts` lines 183-191
- Why fragile: Registry fetch failures are silent; no retry, no fallback rendering
- Safe modification: Add error state tracking; render UI with fallback names if registry unavailable; retry failed fetches on connection restore
- Test coverage: No tests for registry fetch failures

## Scaling Limits

**Maximum Paused Automations:**
- Current capacity: ~1000 automations can pause without noticeable slowdown (estimate)
- Limit: At 2000+ automations, disk I/O during batch operations becomes bottleneck; frontend `shouldUpdate()` iteration becomes slow
- Scaling path: Implement delta persistence; switch to indexed storage (SQLite); use WebSocket subscriptions instead of polling; paginate automation list in UI

**Memory Growth with Long Uptime:**
- Current risk: Frontend timers and intervals accumulate if card is recreated without cleanup
- Limit: Memory leaks in `connectedCallback`/`disconnectedCallback` lifecycle not validated
- Scaling path: Add explicit cleanup in `disconnectedCallback()`; verify all intervals and listeners are unsubscribed; use WeakMap for caches

**State Change Event Throughput:**
- Current capacity: Handles ~10 state updates/sec without lag
- Limit: 50+ state updates/sec causes `shouldUpdate()` to fire constantly, blocking other cards
- Scaling path: Batch state updates; implement debounce in `shouldUpdate()`; use virtual scrolling for large lists

## Dependencies at Risk

**Lit Version 3.x Stability:**
- Risk: Lit 3.3.2 is relatively recent; breaking changes possible in 3.4+
- Impact: Component re-renders may change behavior; property decorator semantics could shift
- Migration plan: Pin to 3.3.2 in package-lock.json; test 3.4+ compatibility before upgrading; monitor Lit changelog

**Home Assistant Store API Reliability:**
- Risk: Store API retry logic relies on exponential backoff; 3 retries may not be sufficient for flaky storage
- Impact: Failed saves silently skip without alerting user; data loss on permanent storage failure
- Migration plan: Add notification to user when save fails; implement queue-and-retry for offline support; monitor HA storage issues

**Playwright 1.40 Test Stability:**
- Risk: Recent E2E test reliability issues suggest Playwright timing is fragile
- Impact: CI pipeline can fail intermittently despite valid code
- Migration plan: Evaluate Playwright 1.50+ for better wait condition support; consider moving to Cypress for Home Assistant testing; add test environment monitoring

## Missing Critical Features

**No Offline Support:**
- Problem: Card requires WebSocket connection; no fallback if Home Assistant is unreachable
- Blocks: Remote automation pausing without internet connectivity (if using reverse proxy with connectivity issues)

**No Scheduled Batch Operations:**
- Problem: Can only schedule one future disable per automation; no way to schedule multiple snoozes
- Blocks: Complex automation workflows requiring time-based orchestration

**No Audit Trail:**
- Problem: No log of who paused which automation and when (security/compliance requirement)
- Blocks: Regulatory compliance for controlled environments

## Test Coverage Gaps

**Untested Timer Execution Paths:**
- What's not tested: Timer callbacks executing when scheduled time arrives
- Files: `custom_components/autosnooze/coordinator.py` lines 82-84 (`schedule_resume.on_timer`), 137-139 (`schedule_disable.on_disable_timer`)
- Risk: Timer edge cases (missed timeout, callback errors) won't be caught
- Priority: High

**Untested Scheduled Snooze Service:**
- What's not tested: Complete flow of `autosnooze.pause_by_area` with scheduled snooze
- Files: `custom_components/autosnooze/services.py` lines 260-268 (`handle_cancel_scheduled`)
- Risk: Scheduled cancellation is completely untested; could fail silently
- Priority: High

**Registry Fetch Error Handling:**
- What's not tested: Label/Category/Entity registry fetch failures
- Files: `src/components/autosnooze-card.ts` (registry fetch methods)
- Risk: If registry unavailable, card displays broken UI with no fallback
- Priority: Medium

**Timezone Conversion Edge Cases:**
- What's not tested: DST transitions, negative UTC offsets, user timezone changes during pause
- Files: `custom_components/autosnooze/models.py` lines 44-70
- Risk: Snooze durations off by hours in certain timezones
- Priority: Medium

**Automation Deletion During Pause:**
- What's not tested: Automation deleted while snoozed; restoration fails gracefully
- Files: `custom_components/autosnooze/coordinator.py` line 409 (TOCTOU race, DEF-015)
- Risk: Orphaned storage entries, confusing error states
- Priority: Low

**E2E Test Coverage Gaps:**
- What's not tested: WebSocket disconnection and reconnection; rapid pause/wake cycles; iOS-specific behaviors
- Files: `e2e/tests/`
- Risk: Real-world reliability issues only discovered after release
- Priority: Medium

---

*Concerns audit: 2026-01-31*
