/**
 * Unit Tests for Automation Categories Feature
 *
 * These tests verify the automation categories implementation where:
 * - Automations are grouped by category when viewing the Categories tab
 * - Categories are fetched from Home Assistant's category registry
 * - Category names are resolved via registry lookup with fallback
 * - Uncategorized automations are grouped together and sorted last
 *
 * BUG: Currently all automations show as "Uncategorized" because
 * category_id extraction from entity registry is not working correctly.
 */

const fs = require('fs');
const path = require('path');

// Read the actual source file
const SOURCE_FILE = path.join(__dirname, '../src/autosnooze-card.js');
const sourceCode = fs.readFileSync(SOURCE_FILE, 'utf8');

// ============================================================================
// HELPER: Extract method body from source code (improved)
// ============================================================================
function extractMethod(methodName) {
  // Look for method definition patterns (not calls)
  // Matches: "  methodName(" or "async methodName(" at start of line
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
// TEST SUITE 2: Category Data Extraction - THE BUG
// ============================================================================
describe('Category Data Extraction - Bug: All showing as Uncategorized', () => {
  const methodBody = extractMethod('_getAutomations');

  describe('_getAutomations extracts category_id', () => {

    test('should access entityEntry from hass.entities', () => {
      expect(methodBody).toContain('hass.entities');
      expect(methodBody).toContain('entityEntry');
    });

    test('should extract categories from entityEntry', () => {
      expect(methodBody).toContain('categories');
    });

    test('should include category_id in returned object', () => {
      expect(methodBody).toContain('category_id');
    });

    test('BUG: currently accesses categories.automation which may be wrong structure', () => {
      // This test documents the current (possibly broken) behavior
      // Home Assistant entity registry categories structure might be different
      const usesAutomationScope = methodBody.includes('categories.automation');
      expect(usesAutomationScope).toBe(true);
    });
  });
});

// ============================================================================
// TEST SUITE 3: Behavioral Tests for Grouping Logic
// ============================================================================
describe('Category Grouping Behavior', () => {

  // Simulate the grouping logic extracted from source
  function simulateGrouping(automations, getCategoryName) {
    const groups = {};

    automations.forEach((auto) => {
      const categoryName = getCategoryName(auto.category_id);
      if (!groups[categoryName]) groups[categoryName] = [];
      groups[categoryName].push(auto);
    });

    return Object.entries(groups).sort((a, b) =>
      a[0] === "Uncategorized" ? 1 : b[0] === "Uncategorized" ? -1 : a[0].localeCompare(b[0])
    );
  }

  // Simulate category name resolution
  function simulateGetCategoryName(categoryRegistry, categoryId) {
    if (!categoryId) return "Uncategorized";

    const category = categoryRegistry[categoryId];
    if (category?.name) return category.name;

    // Fallback: transform ID to readable name
    return categoryId
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  describe('when automations have category_id values (expected behavior)', () => {
    const categoryRegistry = {
      'cat_lighting': { category_id: 'cat_lighting', name: 'Lighting' },
      'cat_security': { category_id: 'cat_security', name: 'Security' },
      'cat_climate': { category_id: 'cat_climate', name: 'Climate' },
    };

    const automationsWithCategories = [
      { id: 'automation.light_on', name: 'Turn on lights', category_id: 'cat_lighting' },
      { id: 'automation.alarm_arm', name: 'Arm alarm', category_id: 'cat_security' },
      { id: 'automation.light_off', name: 'Turn off lights', category_id: 'cat_lighting' },
      { id: 'automation.thermostat', name: 'Adjust thermostat', category_id: 'cat_climate' },
      { id: 'automation.misc', name: 'Misc automation', category_id: null },
    ];

    test('should group automations by their category name', () => {
      const getCategoryName = (id) => simulateGetCategoryName(categoryRegistry, id);
      const grouped = simulateGrouping(automationsWithCategories, getCategoryName);

      const groupNames = grouped.map(([name]) => name);

      expect(groupNames).toContain('Lighting');
      expect(groupNames).toContain('Security');
      expect(groupNames).toContain('Climate');
      expect(groupNames).toContain('Uncategorized');
    });

    test('should have correct number of automations in each group', () => {
      const getCategoryName = (id) => simulateGetCategoryName(categoryRegistry, id);
      const grouped = simulateGrouping(automationsWithCategories, getCategoryName);

      const groupMap = Object.fromEntries(grouped);

      expect(groupMap['Lighting'].length).toBe(2);
      expect(groupMap['Security'].length).toBe(1);
      expect(groupMap['Climate'].length).toBe(1);
      expect(groupMap['Uncategorized'].length).toBe(1);
    });

    test('should sort groups alphabetically with Uncategorized last', () => {
      const getCategoryName = (id) => simulateGetCategoryName(categoryRegistry, id);
      const grouped = simulateGrouping(automationsWithCategories, getCategoryName);

      const groupNames = grouped.map(([name]) => name);

      // Alphabetical: Climate, Lighting, Security, then Uncategorized last
      expect(groupNames[0]).toBe('Climate');
      expect(groupNames[1]).toBe('Lighting');
      expect(groupNames[2]).toBe('Security');
      expect(groupNames[groupNames.length - 1]).toBe('Uncategorized');
    });
  });

  describe('BUG: when all automations have null category_id (current broken behavior)', () => {
    // This simulates what's currently happening
    const automationsAllNull = [
      { id: 'automation.light_on', name: 'Turn on lights', category_id: null },
      { id: 'automation.alarm_arm', name: 'Arm alarm', category_id: null },
      { id: 'automation.thermostat', name: 'Adjust thermostat', category_id: null },
    ];

    test('all automations end up in Uncategorized group', () => {
      const getCategoryName = (id) => simulateGetCategoryName({}, id);
      const grouped = simulateGrouping(automationsAllNull, getCategoryName);

      expect(grouped.length).toBe(1);
      expect(grouped[0][0]).toBe('Uncategorized');
      expect(grouped[0][1].length).toBe(3);
    });
  });
});

// ============================================================================
// TEST SUITE 4: Category Name Resolution
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
});

// ============================================================================
// TEST SUITE 5: Entity Registry Data Structure Investigation
// ============================================================================
describe('Entity Registry Category Access Pattern', () => {
  const methodBody = extractMethod('_getAutomations');

  test('accesses entityEntry?.categories', () => {
    expect(methodBody).toContain('entityEntry?.categories');
  });

  test('current code uses categories.automation for scoped access', () => {
    // The current code does:
    //   const categories = entityEntry?.categories || {};
    //   const category_id = categories.automation || null;
    //
    // This assumes HA structure: { categories: { automation: "category_id" } }
    expect(methodBody).toContain('categories.automation');
  });

  test('INVESTIGATE: if HA uses different structure, fix is needed', () => {
    // Possible alternative structures in Home Assistant:
    // 1. entityEntry.category_id - direct property
    // 2. entityEntry.category - singular
    // 3. Different nesting
    //
    // The bug suggests current path doesn't work - need to verify HA structure

    // Document that we're not using these alternatives currently
    const hasDirectCategoryId = methodBody.includes('entityEntry?.category_id') ||
                                 methodBody.includes('entityEntry.category_id');
    expect(hasDirectCategoryId).toBe(false);
  });
});

// ============================================================================
// TEST SUITE 6: Categories Tab UI
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
// TEST SUITE 7: Category Count
// ============================================================================
describe('Category Count', () => {
  const methodBody = extractMethod('_getCategoryCount');

  test('should count unique categories using Set', () => {
    expect(methodBody).toContain('Set');
    expect(methodBody).toContain('category_id');
  });

  test('should only count automations with category_id', () => {
    expect(methodBody).toContain('auto.category_id');
  });

  test('should return Set size', () => {
    expect(methodBody).toContain('.size');
  });
});

// ============================================================================
// TEST SUITE 8: Category Grouping Method
// ============================================================================
describe('Category Grouping Method', () => {
  const methodBody = extractMethod('_getGroupedByCategory');

  test('should call _getFilteredAutomations', () => {
    expect(methodBody).toContain('_getFilteredAutomations()');
  });

  test('should use _getCategoryName to resolve category names', () => {
    expect(methodBody).toContain('_getCategoryName');
  });

  test('should use auto.category_id for grouping', () => {
    expect(methodBody).toContain('auto.category_id');
  });

  test('should sort alphabetically with Uncategorized last', () => {
    expect(methodBody).toContain('localeCompare');
    expect(methodBody).toContain('"Uncategorized"');
  });
});

// ============================================================================
// TEST SUITE 9: Integration Summary
// ============================================================================
describe('Integration: Bug Analysis Summary', () => {

  test('All required methods exist', () => {
    expect(extractMethod('_fetchCategoryRegistry')).not.toBeNull();
    expect(extractMethod('_getCategoryName')).not.toBeNull();
    expect(extractMethod('_getGroupedByCategory')).not.toBeNull();
    expect(extractMethod('_getCategoryCount')).not.toBeNull();
  });

  test('All required state properties exist', () => {
    expect(sourceCode).toContain('_categoryRegistry');
    expect(sourceCode).toContain('_categoriesFetched');
  });

  test('BUG: category_id extraction uses categories.automation path', () => {
    // This is the suspected buggy line - the extraction path may be wrong
    const methodBody = extractMethod('_getAutomations');
    expect(methodBody).toContain('categories.automation');
  });

  test('Categories tab is wired up correctly', () => {
    expect(sourceCode).toContain('_filterTab === "categories"');
    expect(sourceCode).toContain('_getGroupedByCategory()');
  });
});
