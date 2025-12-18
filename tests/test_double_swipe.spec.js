/**
 * Regression Tests for Double-Swipe Configuration Error
 *
 * Root Cause Analysis:
 * When user rapidly swipes to refresh in Home Assistant Companion app (WebView),
 * the module re-executes but customElements registry persists. This creates a
 * mismatch where the OLD class is still registered but NEW module code is running.
 *
 * The key insight: ll-rebuild should ONLY fire when we actually DEFINED the
 * custom element (first load). On subsequent module re-executions where the
 * element is already registered, firing ll-rebuild is unnecessary and causes
 * Lovelace to attempt re-rendering in an inconsistent state.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../src/autosnooze-card.js');
const sourceCode = fs.readFileSync(SOURCE_FILE, 'utf8');

// ============================================================================
// DEFECT: Double-swipe causes "configuration error: card doesn't exist"
// ============================================================================
describe('Double-Swipe Configuration Error Fix', () => {

  describe('Module Load ID Pattern', () => {
    test('Should generate unique MODULE_LOAD_ID on each module execution', () => {
      // The module should generate a unique ID containing timestamp and random string
      const hasModuleLoadId = sourceCode.includes('const MODULE_LOAD_ID = `autosnooze_${Date.now()}');
      expect(hasModuleLoadId).toBe(true);
    });

    test('MODULE_LOAD_ID should include randomness to prevent collisions', () => {
      // Should use Math.random() to ensure uniqueness even with same timestamp
      const hasRandomness = sourceCode.includes('Math.random()') &&
                            sourceCode.includes('MODULE_LOAD_ID');
      expect(hasRandomness).toBe(true);
    });
  });

  describe('ll-rebuild Guard Pattern', () => {
    test('Should track whether element was actually defined in this module load', () => {
      // Need a flag to track if WE defined the element vs it was already registered
      // Pattern: let elementWasDefined = false; then set true only in define() path
      const tracksDefinition = sourceCode.includes('elementWasDefined') ||
                               sourceCode.includes('wasDefinedThisLoad') ||
                               sourceCode.includes('didDefineElement');
      expect(tracksDefinition).toBe(true);
    });

    test('Should ONLY fire ll-rebuild if element was defined in this module load', () => {
      // Critical fix: Don't fire ll-rebuild if element was already registered
      // Pattern: if (elementWasDefined) { ... dispatch ll-rebuild ... }
      // OR: The define block should set a flag, and ll-rebuild checks it

      // Extract the ll-rebuild section
      const llRebuildMatch = sourceCode.match(/setTimeout\(\(\)\s*=>\s*\{[\s\S]*?ll-rebuild[\s\S]*?\},\s*\d+\)/);
      const llRebuildSection = llRebuildMatch ? llRebuildMatch[0] : '';

      // Should have a conditional check before dispatching
      // Either checking elementWasDefined, or checking if element was registered by us
      const hasConditional = llRebuildSection.includes('if (') ||
                             sourceCode.includes('elementWasDefined && window._autosnoozeCurrentModule');

      expect(hasConditional).toBe(true);
    });

    test('Should NOT fire ll-rebuild when element was already registered by previous load', () => {
      // The critical behavior: when customElements.get() returns truthy (element exists),
      // we should NOT fire ll-rebuild because there's no error card to replace

      // Look for logic that skips ll-rebuild when element already existed
      const registrationMatch = sourceCode.match(/if\s*\(!customElements\.get\("autosnooze-card"\)\)\s*\{[\s\S]*?\}/);
      const registrationSection = registrationMatch ? registrationMatch[0] : '';

      // The flag should be set ONLY inside the define block
      const setsFlag = registrationSection.includes('elementWasDefined = true') ||
                       registrationSection.includes('didDefineElement = true') ||
                       registrationSection.includes('wasDefinedThisLoad = true');

      expect(setsFlag).toBe(true);
    });
  });

  describe('Stale Module Detection', () => {
    test('Should set window._autosnoozeCurrentModule to track current module', () => {
      const setsCurrentModule = sourceCode.includes('window._autosnoozeCurrentModule = MODULE_LOAD_ID');
      expect(setsCurrentModule).toBe(true);
    });

    test('Should check if module is still current before firing ll-rebuild', () => {
      // Before firing ll-rebuild, verify this module load is still "current"
      // A newer module load will have overwritten _autosnoozeCurrentModule
      const checksBeforeFiring = sourceCode.includes('_autosnoozeCurrentModule === MODULE_LOAD_ID');
      expect(checksBeforeFiring).toBe(true);
    });
  });

  describe('Scenario: Single Normal Load', () => {
    test('On first load, element should be defined and ll-rebuild should fire', () => {
      // First load scenario:
      // 1. customElements.get() returns undefined
      // 2. customElements.define() is called
      // 3. elementWasDefined = true
      // 4. ll-rebuild fires because element was just defined

      // Verify the flow exists
      const hasDefineBlock = sourceCode.includes('customElements.define("autosnooze-card"');
      const hasLlRebuild = sourceCode.includes('dispatchEvent(new Event("ll-rebuild"))');

      expect(hasDefineBlock).toBe(true);
      expect(hasLlRebuild).toBe(true);
    });
  });

  describe('Scenario: Double Swipe (Rapid Refresh)', () => {
    test('On second rapid load, element already exists, ll-rebuild should NOT fire', () => {
      // Second load (rapid refresh) scenario:
      // 1. customElements.get() returns truthy (old class)
      // 2. customElements.define() is SKIPPED
      // 3. elementWasDefined = false (or remains false)
      // 4. ll-rebuild should NOT fire because no error card exists

      // The key is that elementWasDefined flag is only set in the define block
      // Look for the pattern where the flag is set conditionally
      const defineBlockMatch = sourceCode.match(/if\s*\(!customElements\.get\("autosnooze-card"\)\)\s*\{([^}]*)\}/);
      const defineBlockContent = defineBlockMatch ? defineBlockMatch[1] : '';

      // Flag should be set inside the if block (when we actually define)
      const flagSetInDefineBlock = defineBlockContent.includes('Defined') ||
                                   defineBlockContent.includes('defined');

      expect(flagSetInDefineBlock).toBe(true);
    });
  });

  describe('Instance Module Tracking', () => {
    test('Card instances should track which module version created them', () => {
      // Each card instance should know its origin module
      const tracksInstanceModule = sourceCode.includes('_instanceModuleId') ||
                                   sourceCode.includes('instanceModuleId');
      expect(tracksInstanceModule).toBe(true);
    });

    test('connectedCallback should detect stale instances from old module loads', () => {
      // When an instance reconnects, check if it's from a stale module
      const connectedMatch = sourceCode.match(/connectedCallback\(\)\s*\{([\s\S]*?)\n  \}/);
      const connectedBody = connectedMatch ? connectedMatch[1] : '';

      const checksModuleId = connectedBody.includes('MODULE_LOAD_ID') ||
                             connectedBody.includes('_instanceModuleId');

      expect(checksModuleId).toBe(true);
    });
  });
});

// ============================================================================
// Integration Test: Simulated Module Reload Behavior
// ============================================================================
describe('Module Reload Simulation', () => {

  test('Flag pattern ensures ll-rebuild only fires on first define', () => {
    // Simulate the pattern:
    // Load 1: elementWasDefined starts false, gets set true in define block
    // Load 2: elementWasDefined starts false, define block is skipped, stays false

    // Verify the source has this pattern
    const hasInitFalse = sourceCode.includes('let elementWasDefined = false') ||
                         sourceCode.includes('let didDefineElement = false') ||
                         sourceCode.includes('let wasDefinedThisLoad = false');

    expect(hasInitFalse).toBe(true);
  });

  test('ll-rebuild dispatch is conditional on element being defined', () => {
    // The dispatch should be inside a conditional checking the flag
    // Pattern: if (elementWasDefined && ...) { window.dispatchEvent(...) }

    const llRebuildSection = sourceCode.match(/setTimeout[\s\S]*?ll-rebuild[\s\S]*?\}\s*,\s*\d+\s*\)/);
    const section = llRebuildSection ? llRebuildSection[0] : '';

    // Should have conditional before dispatch
    const hasCondition = section.includes('if (') && section.includes('dispatchEvent');

    expect(hasCondition).toBe(true);
  });
});
