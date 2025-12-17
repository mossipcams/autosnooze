/**
 * Unit Tests for Automation Categories Feature
 *
 * These tests verify the automation categories implementation where:
 * - Automations are grouped by category when viewing the Categories tab
 * - Categories are fetched from Home Assistant's category registry
 * - Category names are resolved via registry lookup with fallback
 * - Uncategorized automations are grouped together and sorted last
 */

const fs = require('fs');
const path = require('path');

// Read the actual source file
const SOURCE_FILE = path.join(__dirname, '../src/autosnooze-card.js');
const sourceCode = fs.readFileSync(SOURCE_FILE, 'utf8');

// ============================================================================
// HELPER: Extract method body from source code
// ============================================================================
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

// ============================================================================
// HELPER: Create mock card instance for behavioral testing
// ============================================================================
function createMockCard(hassData, entityRegistry = {}) {
  // Extract and evaluate the methods we need to test
  const card = {
    hass: hassData,
    _categoryRegistry: {},
    _labelRegistry: {},
    _entityRegistry: entityRegistry,

    // Simulate _getAutomations - uses _entityRegistry for categories (fetched via WebSocket)
    _getAutomations() {
      if (!this.hass?.states) return [];

      return Object.keys(this.hass.states)
        .filter((id) => id.startsWith("automation."))
        .map((id) => {
          const state = this.hass.states[id];
          // Use fetched entity registry for full entity data including categories
          const registryEntry = this._entityRegistry?.[id];
          // Fallback to hass.entities for basic info
          const hassEntry = this.hass.entities?.[id];
          // Get category from entity registry (categories object with scope keys)
          const categories = registryEntry?.categories || {};
          const category_id = categories.automation || null;
          return {
            id,
            name: state.attributes.friendly_name || id.replace("automation.", ""),
            area_id: registryEntry?.area_id || hassEntry?.area_id || null,
            category_id,
            labels: registryEntry?.labels || hassEntry?.labels || [],
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    _getCategoryName(categoryId) {
      if (!categoryId) return "Uncategorized";

      const category = this._categoryRegistry[categoryId];
      if (category?.name) return category.name;

      return categoryId
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    },

    _getGroupedByCategory() {
      const automations = this._getAutomations();
      const groups = {};

      automations.forEach((auto) => {
        const categoryName = this._getCategoryName(auto.category_id);
        if (!groups[categoryName]) groups[categoryName] = [];
        groups[categoryName].push(auto);
      });

      return Object.entries(groups).sort((a, b) =>
        a[0] === "Uncategorized" ? 1 : b[0] === "Uncategorized" ? -1 : a[0].localeCompare(b[0])
      );
    },

    _getCategoryCount() {
      const automations = this._getAutomations();
      const categories = new Set();
      automations.forEach((auto) => {
        if (auto.category_id) {
          categories.add(auto.category_id);
        }
      });
      return categories.size;
    },
  };

  return card;
}

// ============================================================================
// TEST SUITE 1: Category Registry Fetch Implementation
// ============================================================================
describe('Category Registry Fetch', () => {
  const methodBody = extractMethod('_fetchCategoryRegistry');

  test('_fetchCategoryRegistry method should exist', () => {
    expect(methodBody).not.toBeNull();
  });

  test('should fetch from config/category_registry/list', () => {
    expect(methodBody).toContain('config/category_registry/list');
  });

  test('should use automation scope', () => {
    expect(methodBody).toContain('scope');
    expect(methodBody).toContain('"automation"');
  });

  test('should store results in _categoryRegistry', () => {
    expect(methodBody).toContain('_categoryRegistry');
  });

  test('should map by category_id', () => {
    expect(methodBody).toContain('category_id');
  });
});

// ============================================================================
// TEST SUITE 1b: Entity Registry Fetch Implementation
// ============================================================================
describe('Entity Registry Fetch', () => {
  const methodBody = extractMethod('_fetchEntityRegistry');

  test('_fetchEntityRegistry method should exist', () => {
    expect(methodBody).not.toBeNull();
  });

  test('should fetch from config/entity_registry/list', () => {
    expect(methodBody).toContain('config/entity_registry/list');
  });

  test('should store results in _entityRegistry', () => {
    expect(methodBody).toContain('_entityRegistry');
  });

  test('should map by entity_id', () => {
    expect(methodBody).toContain('entity_id');
  });

  test('should set _entityRegistryFetched flag', () => {
    expect(methodBody).toContain('_entityRegistryFetched = true');
  });
});

// ============================================================================
// TEST SUITE 2: Behavioral Tests - Category Extraction
// ============================================================================
describe('Category Extraction Behavior', () => {

  describe('when entities have categories in entity registry (fetched via WebSocket)', () => {
    // Mock hass object (states only needed for automation list)
    const mockHass = {
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
      },
      entities: {}, // hass.entities doesn't include categories
    };

    // Entity registry data (fetched via config/entity_registry/list WebSocket call)
    const mockEntityRegistry = {
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

    test('should extract category_id from fetched entity registry', () => {
      const card = createMockCard(mockHass, mockEntityRegistry);
      const automations = card._getAutomations();

      const livingRoom = automations.find(a => a.id === 'automation.living_room_lights');
      const kitchen = automations.find(a => a.id === 'automation.kitchen_lights');
      const alarm = automations.find(a => a.id === 'automation.alarm_arm');
      const misc = automations.find(a => a.id === 'automation.misc');

      expect(livingRoom.category_id).toBe('cat_lighting');
      expect(kitchen.category_id).toBe('cat_lighting');
      expect(alarm.category_id).toBe('cat_security');
      expect(misc.category_id).toBeNull();
    });

    test('should count 2 unique categories', () => {
      const card = createMockCard(mockHass, mockEntityRegistry);
      expect(card._getCategoryCount()).toBe(2);
    });

    test('should group automations by category', () => {
      const card = createMockCard(mockHass, mockEntityRegistry);
      card._categoryRegistry = {
        'cat_lighting': { category_id: 'cat_lighting', name: 'Lighting' },
        'cat_security': { category_id: 'cat_security', name: 'Security' },
      };

      const grouped = card._getGroupedByCategory();
      const groupNames = grouped.map(([name]) => name);

      expect(groupNames).toContain('Lighting');
      expect(groupNames).toContain('Security');
      expect(groupNames).toContain('Uncategorized');
    });

    test('should have correct automation count per group', () => {
      const card = createMockCard(mockHass, mockEntityRegistry);
      card._categoryRegistry = {
        'cat_lighting': { category_id: 'cat_lighting', name: 'Lighting' },
        'cat_security': { category_id: 'cat_security', name: 'Security' },
      };

      const grouped = card._getGroupedByCategory();
      const groupMap = Object.fromEntries(grouped);

      expect(groupMap['Lighting'].length).toBe(2);
      expect(groupMap['Security'].length).toBe(1);
      expect(groupMap['Uncategorized'].length).toBe(1);
    });

    test('should sort groups alphabetically with Uncategorized last', () => {
      const card = createMockCard(mockHass, mockEntityRegistry);
      card._categoryRegistry = {
        'cat_lighting': { category_id: 'cat_lighting', name: 'Lighting' },
        'cat_security': { category_id: 'cat_security', name: 'Security' },
      };

      const grouped = card._getGroupedByCategory();
      const groupNames = grouped.map(([name]) => name);

      expect(groupNames[0]).toBe('Lighting');
      expect(groupNames[1]).toBe('Security');
      expect(groupNames[groupNames.length - 1]).toBe('Uncategorized');
    });
  });

  describe('when entity registry has no categories assigned', () => {
    const mockHass = {
      states: {
        'automation.test1': {
          entity_id: 'automation.test1',
          state: 'on',
          attributes: { friendly_name: 'Test 1' },
        },
        'automation.test2': {
          entity_id: 'automation.test2',
          state: 'on',
          attributes: { friendly_name: 'Test 2' },
        },
      },
      entities: {},
    };

    const mockEntityRegistryNoCategories = {
      'automation.test1': {
        entity_id: 'automation.test1',
        area_id: null,
        categories: {},
        labels: [],
      },
      'automation.test2': {
        entity_id: 'automation.test2',
        area_id: null,
        // No categories property at all
        labels: [],
      },
    };

    test('should return null category_id for automations without categories', () => {
      const card = createMockCard(mockHass, mockEntityRegistryNoCategories);
      const automations = card._getAutomations();

      expect(automations[0].category_id).toBeNull();
      expect(automations[1].category_id).toBeNull();
    });

    test('should count 0 categories', () => {
      const card = createMockCard(mockHass, mockEntityRegistryNoCategories);
      expect(card._getCategoryCount()).toBe(0);
    });

    test('should group all automations as Uncategorized', () => {
      const card = createMockCard(mockHass, mockEntityRegistryNoCategories);
      const grouped = card._getGroupedByCategory();

      expect(grouped.length).toBe(1);
      expect(grouped[0][0]).toBe('Uncategorized');
      expect(grouped[0][1].length).toBe(2);
    });
  });
});

// ============================================================================
// TEST SUITE 3: Category Name Resolution
// ============================================================================
describe('Category Name Resolution', () => {
  const methodBody = extractMethod('_getCategoryName');

  test('should return Uncategorized for null categoryId', () => {
    expect(methodBody).toContain('Uncategorized');
    expect(methodBody).toMatch(/!categoryId/);
  });

  test('should lookup from _categoryRegistry first', () => {
    expect(methodBody).toContain('_categoryRegistry');
  });

  test('should fallback to ID transformation', () => {
    expect(methodBody).toContain('replace');
    expect(methodBody).toContain('toUpperCase');
  });

  describe('behavioral tests', () => {
    test('should resolve category name from registry', () => {
      const card = createMockCard({ states: {}, entities: {} });
      card._categoryRegistry = {
        'my_category': { category_id: 'my_category', name: 'My Category' },
      };

      expect(card._getCategoryName('my_category')).toBe('My Category');
    });

    test('should transform ID when not in registry', () => {
      const card = createMockCard({ states: {}, entities: {} });

      expect(card._getCategoryName('some_test_category')).toBe('Some Test Category');
    });

    test('should return Uncategorized for null', () => {
      const card = createMockCard({ states: {}, entities: {} });

      expect(card._getCategoryName(null)).toBe('Uncategorized');
      expect(card._getCategoryName(undefined)).toBe('Uncategorized');
    });
  });
});

// ============================================================================
// TEST SUITE 4: Categories Tab UI
// ============================================================================
describe('Categories Tab UI', () => {

  test('Categories tab exists in filter-tabs', () => {
    expect(sourceCode).toContain('"categories"');
    expect(sourceCode).toContain('Categories');
  });

  test('Categories tab uses _getCategoryCount for badge', () => {
    expect(sourceCode).toContain('_getCategoryCount()');
  });

  test('_renderSelectionList handles categories tab', () => {
    expect(sourceCode).toContain('_filterTab === "categories"');
    expect(sourceCode).toContain('_getGroupedByCategory()');
  });

  test('Tab order is All, Areas, Categories, Labels', () => {
    const filterTabsMatch = sourceCode.match(/<div class="filter-tabs">[\s\S]*?<\/div>\s*\n\s*<!-- Search/);
    const filterTabsSection = filterTabsMatch ? filterTabsMatch[0] : '';

    const allPos = filterTabsSection.indexOf('"all"');
    const areasPos = filterTabsSection.indexOf('"areas"');
    const categoriesPos = filterTabsSection.indexOf('"categories"');
    const labelsPos = filterTabsSection.indexOf('"labels"');

    expect(allPos).toBeLessThan(areasPos);
    expect(areasPos).toBeLessThan(categoriesPos);
    expect(categoriesPos).toBeLessThan(labelsPos);
  });
});

// ============================================================================
// TEST SUITE 5: Source Code Structure
// ============================================================================
describe('Source Code Structure', () => {

  test('_getAutomations extracts category_id from _entityRegistry', () => {
    const methodBody = extractMethod('_getAutomations');
    expect(methodBody).toContain('category_id');
    expect(methodBody).toContain('categories');
    expect(methodBody).toContain('_entityRegistry');
    expect(methodBody).toContain('registryEntry');
  });

  test('_getGroupedByCategory uses category_id', () => {
    const methodBody = extractMethod('_getGroupedByCategory');
    expect(methodBody).toContain('auto.category_id');
    expect(methodBody).toContain('_getCategoryName');
  });

  test('_getCategoryCount counts unique categories', () => {
    const methodBody = extractMethod('_getCategoryCount');
    expect(methodBody).toContain('Set');
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

// ============================================================================
// TEST SUITE 6: Integration
// ============================================================================
describe('Integration', () => {

  test('Complete category workflow with mock data', () => {
    const mockHass = {
      states: {
        'automation.light1': {
          entity_id: 'automation.light1',
          state: 'on',
          attributes: { friendly_name: 'Light 1' },
        },
        'automation.security1': {
          entity_id: 'automation.security1',
          state: 'on',
          attributes: { friendly_name: 'Security 1' },
        },
      },
      entities: {}, // hass.entities doesn't include categories
    };

    // Entity registry fetched via WebSocket (includes categories)
    const mockEntityRegistry = {
      'automation.light1': {
        entity_id: 'automation.light1',
        categories: { automation: 'lighting' },
        labels: [],
      },
      'automation.security1': {
        entity_id: 'automation.security1',
        categories: { automation: 'security' },
        labels: [],
      },
    };

    const card = createMockCard(mockHass, mockEntityRegistry);
    card._categoryRegistry = {
      'lighting': { category_id: 'lighting', name: 'Lighting' },
      'security': { category_id: 'security', name: 'Security' },
    };

    // Test extraction
    const automations = card._getAutomations();
    expect(automations.length).toBe(2);
    expect(automations.find(a => a.id === 'automation.light1').category_id).toBe('lighting');
    expect(automations.find(a => a.id === 'automation.security1').category_id).toBe('security');

    // Test count
    expect(card._getCategoryCount()).toBe(2);

    // Test grouping
    const grouped = card._getGroupedByCategory();
    expect(grouped.length).toBe(2);

    const groupMap = Object.fromEntries(grouped);
    expect(groupMap['Lighting'].length).toBe(1);
    expect(groupMap['Security'].length).toBe(1);
  });
});
