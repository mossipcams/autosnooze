/**
 * Console Error Monitoring Tests
 *
 * Tests that card operations produce no console errors or warnings.
 */

import { vi } from 'vitest';
import '../custom_components/autosnooze/www/autosnooze-card.js';

// =============================================================================
// HELPER: Shadow DOM helpers for child component access
// =============================================================================
function _computeAutomations(card) {
  const states = card.hass?.states || {};
  const entityReg = card._entityRegistry || {};
  const hassEntities = card.hass?.entities || {};
  return Object.entries(states)
    .filter(([id, state]) => id.startsWith('automation.') && state)
    .map(([id, state]) => {
      const reg = entityReg[id] || {};
      const hassEntry = hassEntities[id] || {};
      const categories = reg.categories || {};
      return {
        id,
        name: state.attributes?.friendly_name || id,
        area_id: reg.area_id ?? hassEntry.area_id ?? null,
        labels: reg.labels ?? hassEntry.labels ?? [],
        category_id: categories.automation ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function queryAutomationList(card) {
  // If card has rendered, find child in shadow DOM
  const sr = card.shadowRoot;
  if (sr) {
    const child = sr.querySelector('autosnooze-automation-list');
    if (child) {
      // Sync all properties from card to child (may not have re-rendered yet)
      if (card.hass) child.hass = card.hass;
      if (card._selected !== undefined) child.selected = card._selected;
      if (card._labelRegistry) child.labelRegistry = card._labelRegistry;
      if (card._categoryRegistry) child.categoryRegistry = card._categoryRegistry;
      // Recompute automations from card's current state (entity registry may have changed)
      child.automations = _computeAutomations(card);
      return child;
    }
  }
  // For tests that access child methods without rendering:
  // Create a standalone automation list with synced data
  if (!card.__automationList) {
    const list = document.createElement('autosnooze-automation-list');
    // Listen for selection-change events on the element itself
    list.addEventListener('selection-change', (e) => {
      list.selected = e.detail.selected;
      card._selected = e.detail.selected;
    });
    card.__automationList = list;
  }
  const list = card.__automationList;
  // Sync state from card to child
  if (card.hass) list.hass = card.hass;
  list.automations = _computeAutomations(card);
  list.selected = card._selected || [];
  list.labelRegistry = card._labelRegistry || {};
  list.categoryRegistry = card._categoryRegistry || {};
  return list;
}

describe('Console Error Monitoring', () => {
  let card;
  let mockHass;
  let consoleErrorSpy;
  let consoleWarnSpy;
  let originalConsoleError;
  let originalConsoleWarn;

  beforeEach(async () => {
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;

    consoleErrorSpy = vi.fn();
    consoleWarnSpy = vi.fn();
    console.error = consoleErrorSpy;
    console.warn = consoleWarnSpy;

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
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;

    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('Render cycle error monitoring', () => {
    test('initial render produces no console errors', () => {
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(card.shadowRoot.querySelector('ha-card')).toBeTruthy();
    });

    test('initial render produces no console warnings', () => {
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    test('tab switching produces no console errors', async () => {
      consoleErrorSpy.mockClear();

      for (const tab of ['all', 'areas', 'categories', 'labels']) {
        queryAutomationList(card)._filterTab = tab;
        await card.updateComplete;
        expect(queryAutomationList(card)._filterTab).toBe(tab);
        expect(card.shadowRoot.querySelector('ha-card')).toBeTruthy();
      }

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('search input produces no console errors', async () => {
      consoleErrorSpy.mockClear();

      queryAutomationList(card)._search = 'test';
      await card.updateComplete;
      expect(queryAutomationList(card)._search).toBe('test');

      queryAutomationList(card)._search = '';
      await card.updateComplete;

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('selection changes produce no console errors', async () => {
      consoleErrorSpy.mockClear();

      card._selected = ['automation.test'];
      await card.updateComplete;
      expect(card._selected).toContain('automation.test');

      card._selected = [];
      await card.updateComplete;

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('duration changes produce no console errors', async () => {
      consoleErrorSpy.mockClear();

      card._duration = 3600000;
      await card.updateComplete;
      expect(card._duration).toBe(3600000);

      card._showCustomInput = true;
      await card.updateComplete;

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error state handling', () => {
    test('missing hass state does not throw errors', async () => {
      consoleErrorSpy.mockClear();

      card.hass = { ...mockHass, states: {} };
      await card.updateComplete;

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(card.shadowRoot.querySelector('ha-card')).toBeTruthy();
    });

    test('null automation state produces no errors', async () => {
      consoleErrorSpy.mockClear();

      card.hass = createMockHass({
        states: {
          'automation.test': null,
          'sensor.autosnooze_status': mockHass.states['sensor.autosnooze_status'],
          'sensor.autosnooze_snoozed_automations': mockHass.states['sensor.autosnooze_snoozed_automations'],
        },
      });
      await card.updateComplete;

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('undefined attributes produce no errors', async () => {
      consoleErrorSpy.mockClear();

      card.hass = createMockHass({
        states: {
          'automation.test': {
            entity_id: 'automation.test',
            state: 'on',
            attributes: undefined,
          },
          'sensor.autosnooze_status': mockHass.states['sensor.autosnooze_status'],
          'sensor.autosnooze_snoozed_automations': mockHass.states['sensor.autosnooze_snoozed_automations'],
        },
      });
      await card.updateComplete;

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('malformed paused_automations data produces no errors', async () => {
      consoleErrorSpy.mockClear();

      card.hass = createMockHass({
        states: {
          ...mockHass.states,
          'sensor.autosnooze_snoozed_automations': {
            state: '1',
            attributes: {
              paused_automations: 'invalid_string_instead_of_object',
              scheduled_snoozes: {},
            },
          },
        },
      });
      await card.updateComplete;

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Service call error handling', () => {
    test('failed service call handles error gracefully', async () => {
      card.hass.callService = vi.fn().mockRejectedValue(new Error('Service failed'));
      consoleErrorSpy.mockClear();

      card._selected = ['automation.test'];
      await card.updateComplete;

      try {
        await card._snooze();
      } catch {
        // Expected to fail
      }
      await card.updateComplete;

      expect(card._loading).toBe(false);
    });
  });
});
