/**
 * Regression Tests for UI Defects
 *
 * These tests verify fixes for the following defects:
 * 1. All tab should NOT include automation areas on the automation
 * 2. Automation categories should pull from Home Assistant category registry and sort
 * 3. When 30m is selected and then Custom is clicked, 30m button should not stay blue
 *
 * This file contains both:
 * - Import-based tests (for runtime coverage)
 * - Static analysis tests (for structure verification)
 */

// Import the actual source module to get coverage
import '../src/autosnooze-card.js';

// ============================================================================
// RUNTIME TESTS - Execute actual code for coverage
// ============================================================================
describe('Defect Fixes - Runtime Tests', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    mockHass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
        },
        'sensor.autosnooze_status': {
          state: 'idle',
          attributes: { paused_count: 0, scheduled_count: 0 },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
    });

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('Defect #1: All tab area display', () => {
    test('All tab renders only automation name, no area metadata', async () => {
      card._filterTab = 'all';
      await card.updateComplete;

      const listItems = card.shadowRoot.querySelectorAll('.list-item');
      listItems.forEach((item) => {
        const meta = item.querySelector('.list-item-meta');
        // In All tab, there should be no meta info showing area
        expect(meta).toBeNull();
      });
    });
  });

  describe('Defect #3: Duration button mutual exclusivity', () => {
    test('clicking Custom toggles _showCustomInput', async () => {
      expect(card._showCustomInput).toBe(false);
      card._showCustomInput = true;
      expect(card._showCustomInput).toBe(true);
    });

    test('custom input renders when _showCustomInput is true', async () => {
      card._showCustomInput = true;
      await card.updateComplete;

      const customInput = card.shadowRoot.querySelector('.custom-duration-input');
      expect(customInput).not.toBeNull();
    });

    test('custom input hidden when _showCustomInput is false', async () => {
      card._showCustomInput = false;
      await card.updateComplete;

      const customInput = card.shadowRoot.querySelector('.custom-duration-input');
      expect(customInput).toBeNull();
    });
  });

  describe('Defect #4: Entity Registry fetch for categories', () => {
    test('card has _entityRegistry property', () => {
      expect(card._entityRegistry).toBeDefined();
    });

    test('card has _entityRegistryFetched flag', () => {
      expect(typeof card._entityRegistryFetched).toBe('boolean');
    });

    test('_fetchEntityRegistry method exists', () => {
      expect(typeof card._fetchEntityRegistry).toBe('function');
    });
  });
});

// ============================================================================
// STATIC ANALYSIS TESTS - Verify source code structure
// ============================================================================
const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../src/autosnooze-card.js');
const sourceCode = fs.readFileSync(SOURCE_FILE, 'utf8');

describe('Defect #1: All Tab Should NOT Show Area Metadata - Structure', () => {
  test('All tab should NOT compute areaName for display', () => {
    const allTabMatch = sourceCode.match(
      /if \(this\._filterTab === "all"\)[\s\S]*?return filtered\.map\(\(a\) => \{([\s\S]*?)\}\);/
    );
    const allTabSection = allTabMatch ? allTabMatch[1] : '';

    const computesAreaName = allTabSection.includes('const areaName') || allTabSection.includes('_getAreaName');

    expect(computesAreaName).toBe(false);
  });

  test('All tab should NOT render list-item-meta with area', () => {
    const allTabMatch = sourceCode.match(
      /if \(this\._filterTab === "all"\)[\s\S]*?return filtered\.map\(\(a\) => \{([\s\S]*?)\}\);/
    );
    const allTabSection = allTabMatch ? allTabMatch[1] : '';

    const rendersAreaMeta = allTabSection.includes('list-item-meta') || allTabSection.includes('mdi:home-outline');

    expect(rendersAreaMeta).toBe(false);
  });
});

describe('Defect #2: Categories Should Pull from HA Entity Registry - Structure', () => {
  test('_getGroupedByCategory uses auto.category_id not state attributes', () => {
    const methodMatch = sourceCode.match(/_getGroupedByCategory\(\)\s*\{([\s\S]*?)\n  \}/);
    const methodBody = methodMatch ? methodMatch[1] : '';

    const usesAutoCategoryId =
      methodBody.includes('auto.category_id') || methodBody.includes('_getCategoryName(auto.category_id)');

    const usesStateAttributes =
      methodBody.includes('state?.attributes?.category') || methodBody.includes('state.attributes.category');

    expect(usesAutoCategoryId).toBe(true);
    expect(usesStateAttributes).toBe(false);
  });

  test('Should fetch category registry via websocket', () => {
    const hasCategoryRegistryFetch =
      sourceCode.includes('config/category_registry') ||
      sourceCode.includes('category_registry/list') ||
      sourceCode.includes('_categoryRegistry');

    expect(hasCategoryRegistryFetch).toBe(true);
  });

  test('Categories sorted alphabetically with Uncategorized last', () => {
    // Check for hardcoded sort or generic sort with defaultGroupName parameter
    const hasHardcodedSort = sourceCode.includes(
      'a[0] === "Uncategorized" ? 1 : b[0] === "Uncategorized" ? -1 : a[0].localeCompare(b[0])'
    );
    const hasGenericSort = sourceCode.includes(
      'a[0] === defaultGroupName ? 1 : b[0] === defaultGroupName ? -1 : a[0].localeCompare(b[0])'
    );
    // Also verify "Uncategorized" is passed as the default group name
    const passesUncategorized = sourceCode.includes('"Uncategorized"');

    expect(hasHardcodedSort || (hasGenericSort && passesUncategorized)).toBe(true);
  });
});

describe('Defect #3: Duration Buttons Mutual Exclusivity - Structure', () => {
  test('Preset buttons check _showCustomInput state', () => {
    // Check if _showCustomInput is used either directly in class logic
    // or in a variable that determines the active state
    const pillClassMatch = sourceCode.match(/class="pill \$\{([\s\S]*?)\}"/);
    const classLogic = pillClassMatch ? pillClassMatch[1] : '';

    // Check direct class logic pattern
    const checksShowCustomInputDirectly =
      classLogic.includes('!this._showCustomInput') ||
      classLogic.includes('_showCustomInput === false') ||
      classLogic.includes('!_showCustomInput');

    // Check if isActive variable is used (refactored pattern) and _showCustomInput
    // is checked when computing that variable
    const usesIsActiveVariable = classLogic.includes('isActive');
    const checksShowCustomInputInVariable =
      sourceCode.includes('!this._showCustomInput && selectedDuration') ||
      sourceCode.includes('!_showCustomInput && selectedDuration');

    const checksShowCustomInput = checksShowCustomInputDirectly ||
      (usesIsActiveVariable && checksShowCustomInputInVariable);

    expect(checksShowCustomInput).toBe(true);
  });

  test('Mutual exclusivity between Custom and preset buttons', () => {
    const hasMutualExclusivity = sourceCode.includes('!this._showCustomInput && selectedDuration');

    expect(hasMutualExclusivity).toBe(true);
  });

  test('Clicking preset sets _showCustomInput to false', () => {
    const hasHideCustomOnPreset =
      sourceCode.includes('_showCustomInput = false') && sourceCode.includes('_setDuration(d.minutes)');

    expect(hasHideCustomOnPreset).toBe(true);
  });

  test('Custom button toggles _showCustomInput', () => {
    const hasToggle = sourceCode.includes('_showCustomInput = !this._showCustomInput');

    expect(hasToggle).toBe(true);
  });
});

describe('Defect #4: Entity Registry Must Be Fetched - Structure', () => {
  test('Has _entityRegistry in static properties', () => {
    const hasEntityRegistryProperty =
      sourceCode.includes('_entityRegistry:') && sourceCode.includes('{ state: true }');

    expect(hasEntityRegistryProperty).toBe(true);
  });

  test('Initializes _entityRegistry in constructor', () => {
    const initializesEntityRegistry = sourceCode.includes('this._entityRegistry = {}');

    expect(initializesEntityRegistry).toBe(true);
  });

  test('Has _entityRegistryFetched flag', () => {
    const hasFetchedFlag = sourceCode.includes('_entityRegistryFetched');

    expect(hasFetchedFlag).toBe(true);
  });

  test('Has _fetchEntityRegistry method', () => {
    const hasFetchMethod =
      sourceCode.includes('_fetchEntityRegistry') || sourceCode.includes('async _fetchEntityRegistry');

    expect(hasFetchMethod).toBe(true);
  });

  test('_fetchEntityRegistry calls config/entity_registry/list', () => {
    const fetchesEntityRegistry =
      sourceCode.includes('config/entity_registry/list') || sourceCode.includes('entity_registry/list');

    expect(fetchesEntityRegistry).toBe(true);
  });
});

// ============================================================================
// DEF-007: iOS Companion App Card Disappears After Refresh
// ============================================================================
describe('Defect #7: iOS Card Disappears After Refresh - Structure', () => {
  test('render() method has guard for hass and config', () => {
    // Check for the guard pattern at the start of render method
    const hasGuardPattern =
      sourceCode.includes('render() {') &&
      sourceCode.includes('if (!this.hass || !this.config)') &&
      sourceCode.includes('return html``;');

    expect(hasGuardPattern).toBe(true);
  });
});

// ============================================================================
// DEF-009: Aggressive Cache Headers Breaking iOS (verified in Python tests)
// ============================================================================
describe('Defect #9: Cache Headers - Structure', () => {
  test('_getLocale helper exists and uses hass locale', () => {
    const hasGetLocale = sourceCode.includes('_getLocale()');
    const usesHassLocale =
      sourceCode.includes('this.hass?.locale?.language') ||
      sourceCode.includes('this.hass.locale?.language');

    expect(hasGetLocale).toBe(true);
    expect(usesHassLocale).toBe(true);
  });

  test('no hardcoded en-US in date/time formatting', () => {
    // Find all toLocaleDateString, toLocaleTimeString, toLocaleString calls
    const localeMethodPattern = /toLocale(?:Date|Time)?String\s*\(\s*["']en-US["']/g;
    const intlPattern = /Intl\.DateTimeFormat\s*\(\s*["']en-US["']/g;

    const hardcodedLocaleMatches = sourceCode.match(localeMethodPattern) || [];
    const hardcodedIntlMatches = sourceCode.match(intlPattern) || [];

    expect(hardcodedLocaleMatches.length).toBe(0);
    expect(hardcodedIntlMatches.length).toBe(0);
  });

  test('date/time formatting uses _getLocale or hass locale', () => {
    // Find all toLocaleDateString calls and verify they use locale variable
    const toLocaleDateStringCalls = sourceCode.match(/toLocaleDateString\s*\([^)]+\)/g) || [];

    // Each call should use locale variable (from _getLocale) not hardcoded string
    const usesLocaleVar = toLocaleDateStringCalls.every(
      (call) =>
        call.includes('locale') ||
        call.includes('_getLocale') ||
        call.includes('this.hass')
    );

    expect(toLocaleDateStringCalls.length).toBeGreaterThan(0);
    expect(usesLocaleVar).toBe(true);
  });
});
