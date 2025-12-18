# Known Defects Log

This document tracks known defects, their status, and resolution details for the AutoSnooze project.

**Last Updated:** 2025-12-18
**Current Version:** 2.9.23

---

## Status Legend

| Status | Description |
|--------|-------------|
| **FIXED** | Defect has been resolved and verified |
| **OPEN** | Defect is confirmed and pending fix |
| **IN PROGRESS** | Fix is being developed |
| **WONTFIX** | Defect will not be addressed (by design or out of scope) |
| **CANNOT REPRODUCE** | Unable to reproduce the reported issue |

---

## Defects Summary

| ID | Title | Severity | Status | Fixed In |
|----|-------|----------|--------|----------|
| DEF-001 | All tab displays area metadata incorrectly | Low | FIXED | v2.9.0 |
| DEF-002 | Categories not pulling from HA registry | Medium | FIXED | v2.9.0 |
| DEF-003 | Preset buttons stay active when Custom selected | Low | FIXED | v2.9.0 |
| DEF-004 | Categories show 0 count (entity registry not fetched) | Medium | FIXED | v2.9.0 |
| DEF-005 | iOS Safari configuration error on card load | Critical | FIXED | v2.7.0 |
| DEF-006 | External CDN dependency causing card failures | Critical | FIXED | v2.7.0 |
| DEF-007 | iOS Companion app card disappears after refresh | High | FIXED | v2.9.18 |
| DEF-008 | add_extra_js_url causing iOS refresh issues | High | FIXED | v2.9.20 |
| DEF-009 | Aggressive cache headers breaking iOS | Medium | FIXED | v2.9.21 |

---

## Detailed Defect Reports

### DEF-001: All Tab Displays Area Metadata Incorrectly

**Severity:** Low
**Status:** FIXED
**Fixed In:** v2.9.0
**Regression Tests:** `tests/test_defects.spec.js` - Defect #1

**Description:**
The "All" tab was incorrectly displaying area metadata (location information) alongside automation names. This cluttered the UI and was inconsistent with the expected behavior where the All tab should only show automation names.

**Root Cause:**
The All tab rendering logic was computing and displaying `areaName` using `_getAreaName()` and rendering it in `list-item-meta` with an `mdi:home-outline` icon.

**Resolution:**
Removed area-related rendering from the All tab. The All tab now displays only the automation name without any complementary metadata.

**Verification:**
- All tab should NOT compute `areaName` for display
- All tab should NOT render `list-item-meta` with area
- All tab should only render `list-item-name`

---

### DEF-002: Categories Not Pulling from HA Registry

**Severity:** Medium
**Status:** FIXED
**Fixed In:** v2.9.0
**Regression Tests:** `tests/test_defects.spec.js` - Defect #2

**Description:**
Automation categories were not being retrieved from the Home Assistant entity registry. Instead, the code attempted to get categories from state attributes, which don't contain category data.

**Root Cause:**
`_getGroupedByCategory()` was using `state?.attributes?.category` instead of fetching from the entity registry via WebSocket.

**Resolution:**
- Added `_categoryRegistry` property to store category data
- Implemented category registry fetch via `config/category_registry/list` WebSocket call
- Updated `_getAutomations()` to include `category_id` from entity registry
- Updated `_getCategoryName()` to look up from registry

**Verification:**
- `_getGroupedByCategory()` uses `auto.category_id` from entity registry
- Categories are fetched via WebSocket like labels
- `_getCategoryName()` references `_categoryRegistry` for lookup

---

### DEF-003: Preset Buttons Stay Active When Custom Selected

**Severity:** Low
**Status:** FIXED
**Fixed In:** v2.9.0
**Regression Tests:** `tests/test_defects.spec.js` - Defect #3

**Description:**
When selecting a preset duration (e.g., 30m) and then clicking the "Custom" button, the preset button remained visually active (blue) instead of deactivating.

**Root Cause:**
The preset button's `active` class logic only checked if `selectedDuration === d`, without considering whether the Custom input was currently active.

**Resolution:**
- Updated preset button class logic to check `!this._showCustomInput && selectedDuration === d`
- Clicking a preset button now sets `_showCustomInput = false`
- Clicking Custom button toggles `_showCustomInput`

**Verification:**
- Preset buttons are NOT active when `_showCustomInput` is true
- Only one button (Custom OR a preset) is active at a time
- Clicking preset hides custom input

---

### DEF-004: Categories Show 0 Count

**Severity:** Medium
**Status:** FIXED
**Fixed In:** v2.9.0
**Regression Tests:** `tests/test_defects.spec.js` - Defect #4

**Description:**
The category tabs showed "0" count for all categories because the entity registry was not being fetched. `this.hass.entities` is a lightweight cache that does NOT include category data.

**Root Cause:**
The code relied on `this.hass.entities` for category information, but this lightweight cache only includes: `entity_id`, `area_id`, `device_id`, `labels`, and `platform`. It does NOT include the `categories` object.

**Resolution:**
- Added `_entityRegistry` property and `_entityRegistryFetched` flag
- Implemented `_fetchEntityRegistry()` method calling `config/entity_registry/list`
- Entity registry is fetched in `connectedCallback()` or `updated()`
- `_getAutomations()` now uses `this._entityRegistry` for category lookup

**Verification:**
- `_entityRegistry` exists in static properties with `{ state: true }`
- `_entityRegistry` initialized in constructor
- `_fetchEntityRegistry()` calls `config/entity_registry/list`
- Category data extracted from entity registry's `categories` object

---

### DEF-005: iOS Safari Configuration Error

**Severity:** Critical
**Status:** FIXED
**Fixed In:** v2.7.0
**Documentation:** `IOS_FIX.md`, `COMPLETE_FIX_STEPS.md`

**Description:**
After updating AutoSnooze, iOS Safari displayed "Configuration error" on multiple cards (not just AutoSnooze, but also Mushroom cards and others). This caused widespread dashboard failures.

**Root Cause:**
The AutoSnooze card attempted to load the Lit library from external CDNs (unpkg.com). When CDN requests failed:
1. The ES module import failed
2. This broke Lovelace's entire resource loading system
3. iOS/Safari aggressively cached the broken state
4. ALL custom cards failed to load

**Resolution:**
Bundled the Lit library (45KB) directly into the card JavaScript file using Rollup.js. The card is now completely self-contained with zero external dependencies.

**Workaround (for users on older versions):**
See `IOS_FIX.md` for cache clearing instructions.

---

### DEF-006: External CDN Dependency Failures

**Severity:** Critical
**Status:** FIXED
**Fixed In:** v2.7.0
**Regression Tests:** `tests/test_card_bundle.py`

**Description:**
The card used bare ES module imports that relied on external CDN availability. When CDNs were slow or unavailable, the card failed to load and could break other cards.

**Root Cause:**
```javascript
// Old problematic pattern
import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/...";
```

**Resolution:**
- Implemented Rollup.js build system (`rollup.config.mjs`)
- Bundle includes all dependencies (Lit library)
- Added CI check for bare imports in `build.yml`
- No external network requests required

**Verification:**
- `tests/test_card_bundle.py` verifies no bare imports exist
- Bundle integrity check runs in CI pipeline

---

### DEF-007: iOS Companion App Card Disappears After Refresh

**Severity:** High
**Status:** FIXED
**Fixed In:** v2.9.18
**Related Commits:** `caedfcb`, `b0d813e`

**Description:**
The AutoSnooze card would disappear after page refresh in the iOS Companion app. The custom element would become undefined after navigation or refresh.

**Root Cause:**
The `add_extra_js_url()` function used for resource registration caused issues specific to the iOS Companion app's WebView handling.

**Resolution:**
- Implemented guard in render to wait until `hass` and `config` are ready
- Added detection for stale ES module cache with recovery mechanism
- Improved frontend registration to use static path only

---

### DEF-008: add_extra_js_url Causing iOS Refresh Issues

**Severity:** High
**Status:** FIXED
**Fixed In:** v2.9.20
**Regression Tests:** `tests/test_frontend_registration.py`

**Description:**
Using Home Assistant's `add_extra_js_url()` function for resource registration caused the custom element to become undefined on iOS Companion app refreshes.

**Root Cause:**
Other HACS cards don't have this issue because they don't use `add_extra_js_url()`. This function has compatibility issues with iOS WebView resource caching.

**Resolution:**
- Removed usage of `add_extra_js_url()` entirely
- Implemented Lovelace Resources registration instead
- Static path registered with `cache_headers=False`

**Verification:**
- `test_frontend_registration.py` ensures `add_extra_js_url` is NOT imported or called
- Static path uses `cache_headers=False` to prevent iOS caching issues

---

### DEF-009: Aggressive Cache Headers Breaking iOS

**Severity:** Medium
**Status:** FIXED
**Fixed In:** v2.9.21
**Related Commits:** `eb55d13`

**Description:**
Default cache headers caused iOS WebKit to cache the card JavaScript for up to 31 days, preventing updates from being applied.

**Root Cause:**
Static file serving used default cache headers which iOS Safari/WebKit interpreted as long-term caching directives.

**Resolution:**
- Set `cache_headers=False` on static path registration
- Added version query parameter to URL: `/autosnooze-card.js?v=2.9.23`
- Version changes force cache invalidation

---

## Reporting New Defects

To report a new defect:

1. **GitHub Issues:** [Report a Bug](https://github.com/mossipcams/autosnooze/issues/new?template=bug_report.md)

2. **Include the following information:**
   - AutoSnooze version
   - Home Assistant version
   - Browser/App (Desktop Chrome, iOS Safari, Companion App, etc.)
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser console errors (F12 → Console)
   - Screenshots if applicable

3. **For iOS-specific issues:**
   - iOS version
   - Home Assistant Companion App version
   - Whether issue occurs in Safari, Companion App, or both
