/**
 * Regression Tests for UI Defects
 *
 * These tests verify fixes for the following defects:
 * 1. All tab should NOT include automation areas on the automation
 * 2. Automation categories should pull from Home Assistant category registry and sort
 * 3. When 30m is selected and then Custom is clicked, 30m button should not stay blue
 */

const fs = require('fs');
const path = require('path');

// Read the actual source file
const SOURCE_FILE = path.join(__dirname, '../src/autosnooze-card.js');
const sourceCode = fs.readFileSync(SOURCE_FILE, 'utf8');

// ============================================================================
// DEFECT 1: All tab should NOT include automation areas
// ============================================================================
describe('Defect #1: All Tab Should NOT Show Area Metadata', () => {

  describe('All tab area display', () => {
    test('All tab should NOT compute areaName for display', () => {
      // Extract the All tab rendering section
      const allTabMatch = sourceCode.match(/if \(this\._filterTab === "all"\)[\s\S]*?return filtered\.map\(\(a\) => \{([\s\S]*?)\}\);/);
      const allTabSection = allTabMatch ? allTabMatch[1] : '';

      // Should NOT have areaName variable computed
      const computesAreaName = allTabSection.includes('const areaName') ||
                                allTabSection.includes('_getAreaName');

      expect(computesAreaName).toBe(false);
    });

    test('All tab should NOT render list-item-meta with area', () => {
      // Extract the All tab rendering section
      const allTabMatch = sourceCode.match(/if \(this\._filterTab === "all"\)[\s\S]*?return filtered\.map\(\(a\) => \{([\s\S]*?)\}\);/);
      const allTabSection = allTabMatch ? allTabMatch[1] : '';

      // Should NOT have list-item-meta rendering
      const rendersAreaMeta = allTabSection.includes('list-item-meta') ||
                               allTabSection.includes('mdi:home-outline');

      expect(rendersAreaMeta).toBe(false);
    });

    test('All tab should only render automation name, no complementary metadata', () => {
      // Extract the All tab rendering section (handles arrow function syntax)
      const allTabMatch = sourceCode.match(/if \(this\._filterTab === "all"\)[\s\S]*?return filtered\.map\(\(a\) => html`([\s\S]*?)`\);/);
      const allTabSection = allTabMatch ? allTabMatch[1] : '';

      // Should ONLY have list-item-name, not list-item-meta
      const hasName = allTabSection.includes('list-item-name');
      const hasMeta = allTabSection.includes('list-item-meta');

      expect(hasName).toBe(true);
      expect(hasMeta).toBe(false);
    });
  });
});

// ============================================================================
// DEFECT 2: Categories should pull from Home Assistant category registry
// ============================================================================
describe('Defect #2: Categories Should Pull from HA Entity Registry', () => {

  describe('Category data source', () => {
    test('_getGroupedByCategory should get category from entity registry, not state attributes', () => {
      // Extract the _getGroupedByCategory method
      const methodMatch = sourceCode.match(/_getGroupedByCategory\(\)\s*\{([\s\S]*?)\n  \}/);
      const methodBody = methodMatch ? methodMatch[1] : '';

      // Should use auto.category_id (from entity registry, set in _getAutomations)
      // not state?.attributes?.category
      const usesAutoCategoryId = methodBody.includes('auto.category_id') ||
                                  methodBody.includes('_getCategoryName(auto.category_id)');

      // Should NOT use state?.attributes?.category
      const usesStateAttributes = methodBody.includes('state?.attributes?.category') ||
                                   methodBody.includes("state.attributes.category");

      expect(usesAutoCategoryId).toBe(true);
      expect(usesStateAttributes).toBe(false);
    });

    test('_getAutomations should fetch category from entity registry', () => {
      // Category should be fetched from entity registry (via _entityRegistry)
      const methodMatch = sourceCode.match(/_getAutomations\(\)\s*\{([\s\S]*?)\n  \}/);
      const methodBody = methodMatch ? methodMatch[1] : '';

      // Should include category_id from registry entry (fetched via WebSocket)
      const hasCategoryFromRegistry = methodBody.includes('category') &&
                                       (methodBody.includes('registryEntry') ||
                                        methodBody.includes('_entityRegistry'));

      expect(hasCategoryFromRegistry).toBe(true);
    });

    test('Category should be stored in automation objects like area_id', () => {
      // In _getAutomations return object, should have category_id similar to area_id
      const returnMatch = sourceCode.match(/_getAutomations[\s\S]*?return \{[\s\S]*?(id,[\s\S]*?labels:[^}]+)/);
      const returnSection = returnMatch ? returnMatch[1] : '';

      // Should have category_id property
      const hasCategoryId = returnSection.includes('category_id') ||
                            returnSection.includes('category:');

      expect(hasCategoryId).toBe(true);
    });
  });

  describe('Category registry lookup', () => {
    test('Should fetch category registry via websocket like labels', () => {
      // There should be a method to fetch automation categories from HA
      // Similar to _fetchLabelRegistry
      const hasCategoryRegistryFetch = sourceCode.includes('config/category_registry') ||
                                        sourceCode.includes('category_registry/list') ||
                                        sourceCode.includes('_categoryRegistry');

      expect(hasCategoryRegistryFetch).toBe(true);
    });

    test('_getCategoryName should look up from registry, not just transform ID', () => {
      // Extract _getCategoryName method
      const methodMatch = sourceCode.match(/_getCategoryName\(categoryId\)\s*\{([\s\S]*?)\n  \}/);
      const methodBody = methodMatch ? methodMatch[1] : '';

      // Should reference a registry lookup (like _labelRegistry)
      const usesRegistry = methodBody.includes('_categoryRegistry') ||
                           methodBody.includes('categoryRegistry');

      expect(usesRegistry).toBe(true);
    });
  });

  describe('Category sorting', () => {
    test('Categories should be sorted alphabetically with Uncategorized last', () => {
      // This already works correctly in _getGroupedByCategory
      const hasCorrectSort = sourceCode.includes('a[0] === "Uncategorized" ? 1 : b[0] === "Uncategorized" ? -1 : a[0].localeCompare(b[0])');

      expect(hasCorrectSort).toBe(true);
    });
  });
});

// ============================================================================
// DEFECT 3: Preset button should deactivate when Custom is selected
// ============================================================================
describe('Defect #3: Duration Buttons Mutual Exclusivity with Custom', () => {

  describe('Preset button active state', () => {
    test('Preset buttons should NOT be active when _showCustomInput is true', () => {
      // Extract the pill button class logic
      // The active class condition should check _showCustomInput
      // Pattern should be: !this._showCustomInput && selectedDuration === d
      const pillClassMatch = sourceCode.match(/class="pill \$\{([\s\S]*?)\}"/);
      const classLogic = pillClassMatch ? pillClassMatch[1] : '';

      // For preset buttons (d.minutes !== null), should check !_showCustomInput
      // Current buggy pattern: selectedDuration === d ? "active" : ""
      // Fixed pattern: !this._showCustomInput && selectedDuration === d ? "active" : ""
      const checksShowCustomInput = classLogic.includes('!this._showCustomInput') ||
                                     classLogic.includes('_showCustomInput === false') ||
                                     classLogic.includes('!_showCustomInput');

      expect(checksShowCustomInput).toBe(true);
    });

    test('Only one button should be active at a time - Custom OR a preset', () => {
      // The class logic should ensure mutual exclusivity
      // When d.minutes === null (Custom button):
      //   - active if _showCustomInput is true
      // When d.minutes !== null (preset buttons):
      //   - active ONLY if _showCustomInput is false AND duration matches

      // Look for the pattern that deactivates presets when custom is shown
      // Pattern: !this._showCustomInput && selectedDuration === d
      const hasMutualExclusivity = sourceCode.includes('!this._showCustomInput && selectedDuration');

      expect(hasMutualExclusivity).toBe(true);
    });
  });

  describe('Click behavior', () => {
    test('Clicking preset button should set _showCustomInput to false', () => {
      // When a preset duration is clicked, it should hide the custom input
      const hasHideCustomOnPreset = sourceCode.includes('_showCustomInput = false') &&
                                     sourceCode.includes('_setDuration(d.minutes)');

      expect(hasHideCustomOnPreset).toBe(true);
    });

    test('Clicking Custom button should toggle _showCustomInput', () => {
      // Custom button should toggle the custom input visibility
      const hasToggle = sourceCode.includes('_showCustomInput = !this._showCustomInput');

      expect(hasToggle).toBe(true);
    });
  });
});

// ============================================================================
// Summary Test - All Three Defects Fixed
// ============================================================================
describe('All Defects Fixed - Summary', () => {

  test('Defect #1: All tab displays only automation name (no area)', () => {
    const allTabMatch = sourceCode.match(/if \(this\._filterTab === "all"\)[\s\S]*?return filtered\.map\(\(a\) => \{([\s\S]*?)\}\);/);
    const allTabSection = allTabMatch ? allTabMatch[1] : '';

    // Should NOT have any area-related rendering
    const hasAreaStuff = allTabSection.includes('areaName') ||
                          allTabSection.includes('_getAreaName') ||
                          allTabSection.includes('mdi:home-outline');

    expect(hasAreaStuff).toBe(false);
  });

  test('Defect #2: Categories come from entity registry', () => {
    const methodMatch = sourceCode.match(/_getGroupedByCategory\(\)\s*\{([\s\S]*?)\n  \}/);
    const methodBody = methodMatch ? methodMatch[1] : '';

    // Should NOT use state attributes for category
    const usesStateAttributes = methodBody.includes('state?.attributes?.category');

    expect(usesStateAttributes).toBe(false);
  });

  test('Defect #3: Preset buttons deactivate when Custom is active', () => {
    const pillClassMatch = sourceCode.match(/d\.minutes !== null[\s\S]*?selectedDuration/);
    const presetLogic = pillClassMatch ? pillClassMatch[0] : '';

    // If this pattern exists, the button checks _showCustomInput before activating
    const checksCustomState = sourceCode.includes('!this._showCustomInput') ||
                               presetLogic.includes('_showCustomInput');

    expect(checksCustomState).toBe(true);
  });
});
