/**
 * Unit Tests for Automation Categories Feature
 *
 * These tests verify the automation categories implementation where:
 * - Automations are grouped by category when viewing the Categories tab
 * - Categories are fetched from Home Assistant's category registry
 * - Category names are resolved via registry lookup with fallback
 * - Uncategorized automations are grouped together and sorted last
 *
 * This file contains both:
 * - Import-based tests (for runtime coverage)
 * - Static analysis tests (for structure verification)
 */

// Import the actual source module to get coverage
import '../src/autosnooze-card.js';

// ============================================================================
// RUNTIME TESTS - Import and execute actual code
// ============================================================================
describe('Categories Feature - Runtime Tests', () => {
  let card;
  let mockHass;

  beforeEach(async () => {
    mockHass = createMockHass({
      states: {
        'automation.living_room_lights': {
          entity_id: 'automation.living_room_lights',
          state: 'on',
          attributes: { friendly_name: 'Living Room Lights' },
        },
        'automation.kitchen_lights': {
          entity_id: 'automation.kitchen_lights',
          state: 'on',
          attributes: { friendly_name: 'Kitchen Lights' },
        },
        'automation.alarm_arm': {
          entity_id: 'automation.alarm_arm',
          state: 'on',
          attributes: { friendly_name: 'Arm Alarm' },
        },
        'automation.misc': {
          entity_id: 'automation.misc',
          state: 'on',
          attributes: { friendly_name: 'Misc Automation' },
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

    // Set up entity registry with categories
    card._entityRegistry = {
      'automation.living_room_lights': {
        entity_id: 'automation.living_room_lights',
        area_id: 'living_room',
        categories: { automation: 'cat_lighting' },
        labels: [],
      },
      'automation.kitchen_lights': {
        entity_id: 'automation.kitchen_lights',
        area_id: 'kitchen',
        categories: { automation: 'cat_lighting' },
        labels: [],
      },
      'automation.alarm_arm': {
        entity_id: 'automation.alarm_arm',
        area_id: null,
        categories: { automation: 'cat_security' },
        labels: [],
      },
      'automation.misc': {
        entity_id: 'automation.misc',
        area_id: null,
        categories: {},
        labels: [],
      },
    };
    card._entityRegistryFetched = true;

    // Set up category registry
    card._categoryRegistry = {
      cat_lighting: { category_id: 'cat_lighting', name: 'Lighting' },
      cat_security: { category_id: 'cat_security', name: 'Security' },
    };
    card._categoriesFetched = true;

    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('Category extraction from entity registry', () => {
    test('extracts category_id from entity registry', () => {
      const automations = card._getAutomations();
      const livingRoom = automations.find((a) => a.id === 'automation.living_room_lights');
      expect(livingRoom.category_id).toBe('cat_lighting');
    });

    test('returns null category_id when no category assigned', () => {
      const automations = card._getAutomations();
      const misc = automations.find((a) => a.id === 'automation.misc');
      expect(misc.category_id).toBeNull();
    });
  });

  describe('Category counting', () => {
    test('_getCategoryCount returns correct unique count', () => {
      expect(card._getCategoryCount()).toBe(2);
    });

    test('_getCategoryCount returns 0 when no categories assigned', () => {
      // Clear all categories
      card._entityRegistry = {
        'automation.test': {
          entity_id: 'automation.test',
          categories: {},
          labels: [],
        },
      };
      card.hass.states = {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test' },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      };
      card._automationsCache = null;
      expect(card._getCategoryCount()).toBe(0);
    });
  });

  describe('Category name resolution', () => {
    test('_getCategoryName returns name from registry', () => {
      expect(card._getCategoryName('cat_lighting')).toBe('Lighting');
    });

    test('_getCategoryName returns "Uncategorized" for null', () => {
      expect(card._getCategoryName(null)).toBe('Uncategorized');
    });

    test('_getCategoryName transforms ID if not in registry', () => {
      expect(card._getCategoryName('some_test_category')).toBe('Some Test Category');
    });
  });

  describe('Category grouping', () => {
    test('_getGroupedByCategory groups automations correctly', () => {
      const grouped = card._getGroupedByCategory();
      const groupNames = grouped.map(([name]) => name);

      expect(groupNames).toContain('Lighting');
      expect(groupNames).toContain('Security');
      expect(groupNames).toContain('Uncategorized');
    });

    test('groups have correct automation count', () => {
      const grouped = card._getGroupedByCategory();
      const groupMap = Object.fromEntries(grouped);

      expect(groupMap['Lighting'].length).toBe(2);
      expect(groupMap['Security'].length).toBe(1);
      expect(groupMap['Uncategorized'].length).toBe(1);
    });

    test('groups are sorted alphabetically with Uncategorized last', () => {
      const grouped = card._getGroupedByCategory();
      const groupNames = grouped.map(([name]) => name);

      expect(groupNames[0]).toBe('Lighting');
      expect(groupNames[1]).toBe('Security');
      expect(groupNames[groupNames.length - 1]).toBe('Uncategorized');
    });
  });

  describe('Categories tab UI', () => {
    test('switching to categories tab changes filterTab', async () => {
      card._filterTab = 'categories';
      await card.updateComplete;
      expect(card._filterTab).toBe('categories');
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

function extractMethod(methodName) {
  const patterns = [
    new RegExp(`^\\s+async\\s+${methodName}\\s*\\(`, 'm'),
    new RegExp(`^\\s+${methodName}\\s*\\(`, 'm'),
  ];

  let methodStart = -1;
  for (const pattern of patterns) {
    const match = sourceCode.match(pattern);
    if (match) {
      methodStart = match.index;
      break;
    }
  }

  if (methodStart === -1) return null;

  const braceStart = sourceCode.indexOf('{', methodStart);
  if (braceStart === -1) return null;

  let braceCount = 1;
  let i = braceStart + 1;
  while (braceCount > 0 && i < sourceCode.length) {
    if (sourceCode[i] === '{') braceCount++;
    if (sourceCode[i] === '}') braceCount--;
    i++;
  }

  return sourceCode.substring(methodStart, i);
}

describe('Category Registry Fetch - Structure', () => {
  const methodBody = extractMethod('_fetchCategoryRegistry');

  test('_fetchCategoryRegistry method exists', () => {
    expect(methodBody).not.toBeNull();
  });

  test('fetches from config/category_registry/list', () => {
    expect(methodBody).toContain('config/category_registry/list');
  });

  test('uses automation scope', () => {
    expect(methodBody).toContain('scope');
    expect(methodBody).toContain('"automation"');
  });
});

describe('Entity Registry Fetch - Structure', () => {
  const methodBody = extractMethod('_fetchEntityRegistry');

  test('_fetchEntityRegistry method exists', () => {
    expect(methodBody).not.toBeNull();
  });

  test('fetches from config/entity_registry/list', () => {
    expect(methodBody).toContain('config/entity_registry/list');
  });

  test('sets _entityRegistryFetched flag', () => {
    expect(methodBody).toContain('_entityRegistryFetched = true');
  });
});

describe('Source Structure Verification', () => {
  test('_getAutomations extracts category_id from _entityRegistry', () => {
    const methodBody = extractMethod('_getAutomations');
    expect(methodBody).toContain('category_id');
    expect(methodBody).toContain('categories');
    expect(methodBody).toContain('_entityRegistry');
  });

  test('_getGroupedByCategory uses category_id', () => {
    const methodBody = extractMethod('_getGroupedByCategory');
    expect(methodBody).toContain('auto.category_id');
    expect(methodBody).toContain('_getCategoryName');
  });

  test('_getCategoryCount counts unique categories', () => {
    const methodBody = extractMethod('_getCategoryCount');
    // Method may use Set directly or delegate to _getUniqueCount helper
    const usesSetDirectly = methodBody.includes('Set');
    const usesUniqueCountHelper = methodBody.includes('_getUniqueCount');
    expect(usesSetDirectly || usesUniqueCountHelper).toBe(true);
    expect(methodBody).toContain('category_id');
  });

  test('All required methods exist', () => {
    expect(extractMethod('_fetchCategoryRegistry')).not.toBeNull();
    expect(extractMethod('_fetchEntityRegistry')).not.toBeNull();
    expect(extractMethod('_getCategoryName')).not.toBeNull();
    expect(extractMethod('_getGroupedByCategory')).not.toBeNull();
    expect(extractMethod('_getCategoryCount')).not.toBeNull();
  });

  test('All required state properties exist', () => {
    expect(sourceCode).toContain('_categoryRegistry');
    expect(sourceCode).toContain('_entityRegistry');
    expect(sourceCode).toContain('_categoriesFetched');
    expect(sourceCode).toContain('_entityRegistryFetched');
  });
});
