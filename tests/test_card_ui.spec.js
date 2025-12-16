/**
 * TDD Unit Tests for AutoSnooze Card UI Changes
 *
 * All tests verify the actual source code implementation.
 * Tests should FAIL before implementation and PASS after.
 *
 * Changes to implement:
 * 1. Add "Custom" pill button next to "1 day" that opens duration input
 * 2. Add Categories tab - Tab order: All, Areas, Categories, Labels
 * 3. Hide labels in "All" and "Areas" tabs
 */

const fs = require('fs');
const path = require('path');

// Read the actual source file
const SOURCE_FILE = path.join(__dirname, '../src/autosnooze-card.js');
const sourceCode = fs.readFileSync(SOURCE_FILE, 'utf8');

// ============================================================================
// TEST SUITE 1: Custom Duration Pill Button
// ============================================================================
describe('Custom Duration Pill Button', () => {

  describe('Duration Options Array', () => {
    test('durations array should include Custom as 5th option', () => {
      // Source should have: { label: "Custom", minutes: null }
      const hasCustomPill = sourceCode.includes('label: "Custom"') ||
                            sourceCode.includes("label: 'Custom'");

      expect(hasCustomPill).toBe(true);
    });

    test('Custom duration should have null minutes value', () => {
      // Custom pill should have minutes: null to indicate it triggers input
      const hasNullMinutes = sourceCode.match(/label:\s*["']Custom["'][\s\S]*?minutes:\s*null/);

      expect(hasNullMinutes).toBeTruthy();
    });
  });

  describe('_showCustomInput State Property', () => {
    test('_showCustomInput should be defined in static properties', () => {
      const hasProperty = sourceCode.includes('_showCustomInput:') ||
                          sourceCode.includes('_showCustomInput =');

      expect(hasProperty).toBe(true);
    });

    test('_showCustomInput should be initialized to false in constructor', () => {
      const hasInit = sourceCode.includes('_showCustomInput = false') ||
                      sourceCode.includes('this._showCustomInput = false');

      expect(hasInit).toBe(true);
    });
  });

  describe('Custom Pill Click Handler', () => {
    test('clicking Custom pill should toggle _showCustomInput', () => {
      // Should have logic to toggle _showCustomInput when Custom is clicked
      const hasToggleLogic = sourceCode.includes('_showCustomInput = !') ||
                              sourceCode.includes('_showCustomInput = true') ||
                              sourceCode.includes('_toggleCustomInput');

      expect(hasToggleLogic).toBe(true);
    });
  });

  describe('Custom Input Conditional Rendering', () => {
    test('duration input should render conditionally based on _showCustomInput', () => {
      // Pattern: ${this._showCustomInput ? html`<input...` : ''}
      const hasConditionalRender = sourceCode.includes('_showCustomInput ?') ||
                                    sourceCode.includes('_showCustomInput &&');

      expect(hasConditionalRender).toBe(true);
    });

    test('duration-input-container class should NOT exist', () => {
      const hasOldContainer = sourceCode.includes('class="duration-input-container"');

      expect(hasOldContainer).toBe(false);
    });
  });

  describe('Custom Pill Active State', () => {
    test('Custom pill should have active class when _showCustomInput is true', () => {
      // Pattern: class="pill ${this._showCustomInput ? 'active' : ''}"
      const hasActiveState = sourceCode.match(/_showCustomInput[\s\S]*?active/);

      expect(hasActiveState).toBeTruthy();
    });
  });
});

// ============================================================================
// TEST SUITE 2: Categories Tab - Tab Order: All, Areas, Categories, Labels
// ============================================================================
describe('Categories Tab Implementation', () => {

  describe('Categories Tab Exists', () => {
    test('Categories tab button should exist in render', () => {
      const hasCategoriesTab = sourceCode.includes('"categories"') &&
                                sourceCode.includes('Categories');

      expect(hasCategoriesTab).toBe(true);
    });
  });

  describe('Tab Order: All, Areas, Categories, Labels', () => {
    test('Categories tab should appear after Areas in filter-tabs section', () => {
      // Extract the filter-tabs render section
      const filterTabsMatch = sourceCode.match(/<div class="filter-tabs">[\s\S]*?<\/div>\s*\n\s*<!-- Search/);
      const filterTabsSection = filterTabsMatch ? filterTabsMatch[0] : '';

      const areasPos = filterTabsSection.indexOf('"areas"');
      const categoriesPos = filterTabsSection.indexOf('"categories"');

      // Both should exist and areas should come before categories
      expect(areasPos).toBeGreaterThan(-1);
      expect(categoriesPos).toBeGreaterThan(-1);
      expect(areasPos).toBeLessThan(categoriesPos);
    });
  });

  describe('_filterTab Handles Categories', () => {
    test('_renderSelectionList should handle categories tab', () => {
      const handlesCategories = sourceCode.includes('_filterTab === "categories"');

      expect(handlesCategories).toBe(true);
    });
  });

  describe('_getGroupedByCategory Method', () => {
    test('method should be defined', () => {
      const hasMethod = sourceCode.includes('_getGroupedByCategory(') ||
                        sourceCode.includes('_getGroupedByCategory =');

      expect(hasMethod).toBe(true);
    });

    test('method should group by category attribute', () => {
      // Should reference category in grouping logic
      const usesCategory = sourceCode.match(/_getGroupedByCategory[\s\S]*?category/);

      expect(usesCategory).toBeTruthy();
    });

    test('method should handle Uncategorized items', () => {
      const hasUncategorized = sourceCode.includes('Uncategorized');

      expect(hasUncategorized).toBe(true);
    });
  });

  describe('_getCategoryCount Method', () => {
    test('method should be defined', () => {
      const hasMethod = sourceCode.includes('_getCategoryCount(') ||
                        sourceCode.includes('_getCategoryCount =');

      expect(hasMethod).toBe(true);
    });

    test('method should count distinct categories', () => {
      // Should use Set or similar to count unique categories
      const countsCategories = sourceCode.match(/_getCategoryCount[\s\S]*?category/);

      expect(countsCategories).toBeTruthy();
    });
  });

  describe('Categories Tab Badge', () => {
    test('Categories tab should display count from _getCategoryCount()', () => {
      const usesCategoryCount = sourceCode.includes('_getCategoryCount()');

      expect(usesCategoryCount).toBe(true);
    });
  });

  describe('Grouped View for Categories', () => {
    test('grouped rendering should call _getGroupedByCategory for categories tab', () => {
      const usesMethod = sourceCode.includes('_getGroupedByCategory()');

      expect(usesMethod).toBe(true);
    });
  });
});

// ============================================================================
// TEST SUITE 3: Label Visibility Rules
// ============================================================================
describe('Label Visibility in All and Areas Tabs', () => {

  describe('All Tab - No Labels Displayed', () => {
    test('All tab should NOT combine areaName and labelNames in metaInfo', () => {
      // OLD: [areaName, labelNames].filter(Boolean).join(" • ")
      // NEW: should only use areaName
      const hasOldPattern = sourceCode.includes('[areaName, labelNames].filter(Boolean)');

      expect(hasOldPattern).toBe(false);
    });

    test('All tab should NOT define labelNames variable', () => {
      // In the All tab section, labelNames should not be computed
      const allTabSection = sourceCode.match(/if \(this\._filterTab === "all"\)[\s\S]*?return filtered\.map[\s\S]*?\}\);/)?.[0] || '';

      const hasLabelNames = allTabSection.includes('labelNames');

      expect(hasLabelNames).toBe(false);
    });

    test('All tab should NOT render mdi:label-outline icon', () => {
      const allTabSection = sourceCode.match(/if \(this\._filterTab === "all"\)[\s\S]*?return filtered\.map[\s\S]*?\}\);/)?.[0] || '';

      const hasLabelIcon = allTabSection.includes('mdi:label-outline');

      expect(hasLabelIcon).toBe(false);
    });
  });

  describe('Areas Tab - No Labels Displayed', () => {
    test('Areas tab should NOT set showLabels to true', () => {
      // OLD: const showLabels = this._filterTab === "areas" && a.labels...
      // NEW: should not have this pattern
      const areasShowsLabels = sourceCode.includes('_filterTab === "areas" && a.labels');

      expect(areasShowsLabels).toBe(false);
    });

    test('Areas tab items should have no complementary metadata', () => {
      // In grouped view, areas items should not show any metadata
      // (area is redundant as it's the group header, labels not allowed)
      const groupedSection = sourceCode.match(/const showLabels = this\._filterTab === "areas"/);

      expect(groupedSection).toBeNull();
    });
  });

  describe('Labels Tab - Still Shows Area', () => {
    test('Labels tab should show area as complementary info', () => {
      const labelsShowsArea = sourceCode.includes('_filterTab === "labels"') &&
                              sourceCode.includes('a.area_id');

      expect(labelsShowsArea).toBe(true);
    });
  });

  describe('Categories Tab - Shows Area Only', () => {
    test('Categories tab should show area as complementary info', () => {
      const categoriesShowsArea = sourceCode.includes('_filterTab === "categories"') &&
                                   sourceCode.includes('a.area_id');

      expect(categoriesShowsArea).toBe(true);
    });

    test('Categories tab should NOT show labels', () => {
      // Should not have showLabels for categories
      const categoriesShowsLabels = sourceCode.includes('_filterTab === "categories" && a.labels');

      expect(categoriesShowsLabels).toBe(false);
    });
  });
});

// ============================================================================
// TEST SUITE 4: Integration
// ============================================================================
describe('Integration', () => {

  describe('All Four Tabs Defined', () => {
    test('all tab should be defined', () => {
      expect(sourceCode.includes('_filterTab === "all"')).toBe(true);
    });

    test('areas tab should be defined', () => {
      expect(sourceCode.includes('_filterTab === "areas"')).toBe(true);
    });

    test('categories tab should be defined', () => {
      expect(sourceCode.includes('_filterTab === "categories"')).toBe(true);
    });

    test('labels tab should be defined', () => {
      expect(sourceCode.includes('_filterTab === "labels"')).toBe(true);
    });
  });

  describe('Grouped View Methods', () => {
    test('_getGroupedByArea should be used', () => {
      expect(sourceCode.includes('_getGroupedByArea()')).toBe(true);
    });

    test('_getGroupedByCategory should be used', () => {
      expect(sourceCode.includes('_getGroupedByCategory()')).toBe(true);
    });

    test('_getGroupedByLabel should be used', () => {
      expect(sourceCode.includes('_getGroupedByLabel()')).toBe(true);
    });
  });

  describe('State Properties Complete', () => {
    test('_showCustomInput property should exist', () => {
      expect(sourceCode.includes('_showCustomInput')).toBe(true);
    });
  });
});
