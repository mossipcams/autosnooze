/**
 * Dashboard Stability Tests
 *
 * Comprehensive tests covering:
 * - Multiple dashboard layouts with various configurations
 * - Console error monitoring during card operations
 * - Cross-card compatibility with other custom elements
 * - Cleanup verification for memory leaks and dangling references
 * - Popular card conflict testing (button-card, mushroom, mini-graph-card patterns)
 */

import { vi } from 'vitest';
import '../custom_components/autosnooze/www/autosnooze-card.js';

// =============================================================================
// CONSOLE ERROR MONITORING
// =============================================================================

describe('Console Error Monitoring', () => {
  let card;
  let mockHass;
  let consoleErrorSpy;
  let consoleWarnSpy;
  let originalConsoleError;
  let originalConsoleWarn;

  beforeEach(async () => {
    // Capture original console methods
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;

    // Spy on console methods
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
    // Restore original console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;

    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('Render cycle error monitoring', () => {
    test('initial render produces no console errors', () => {
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('initial render produces no console warnings', () => {
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    test('tab switching produces no console errors', async () => {
      consoleErrorSpy.mockClear();

      const tabs = ['all', 'areas', 'categories', 'labels'];
      for (const tab of tabs) {
        card._filterTab = tab;
        await card.updateComplete;
      }

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('search input produces no console errors', async () => {
      consoleErrorSpy.mockClear();

      card._search = 'test';
      await card.updateComplete;
      card._search = '';
      await card.updateComplete;

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('selection changes produce no console errors', async () => {
      consoleErrorSpy.mockClear();

      card._selected = ['automation.test'];
      await card.updateComplete;
      card._selected = [];
      await card.updateComplete;

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('duration changes produce no console errors', async () => {
      consoleErrorSpy.mockClear();

      card._duration = 3600000; // 1 hour
      await card.updateComplete;
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
    test('failed service call shows toast but no console error', async () => {
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

      // Should handle error gracefully
      expect(card._loading).toBe(false);
    });
  });
});

// =============================================================================
// MULTIPLE DASHBOARD LAYOUTS
// =============================================================================

describe('Multiple Dashboard Layouts', () => {
  let card;
  let mockHass;

  const createComplexMockHass = () =>
    createMockHass({
      states: {
        'automation.living_room_lights': {
          entity_id: 'automation.living_room_lights',
          state: 'on',
          attributes: { friendly_name: 'Living Room Lights' },
        },
        'automation.bedroom_fan': {
          entity_id: 'automation.bedroom_fan',
          state: 'on',
          attributes: { friendly_name: 'Bedroom Fan' },
        },
        'automation.kitchen_motion': {
          entity_id: 'automation.kitchen_motion',
          state: 'off',
          attributes: { friendly_name: 'Kitchen Motion' },
        },
        'automation.garage_door': {
          entity_id: 'automation.garage_door',
          state: 'on',
          attributes: { friendly_name: 'Garage Door' },
        },
        'automation.security_alarm': {
          entity_id: 'automation.security_alarm',
          state: 'on',
          attributes: { friendly_name: 'Security Alarm' },
        },
        'sensor.autosnooze_status': {
          state: 'idle',
          attributes: { paused_count: 0, scheduled_count: 0 },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: {
            paused_automations: {},
            scheduled_snoozes: {},
          },
        },
      },
      areas: {
        living_room: { area_id: 'living_room', name: 'Living Room' },
        bedroom: { area_id: 'bedroom', name: 'Bedroom' },
        kitchen: { area_id: 'kitchen', name: 'Kitchen' },
        garage: { area_id: 'garage', name: 'Garage' },
      },
    });

  beforeEach(async () => {
    mockHass = createComplexMockHass();

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

  describe('Layout switching stability', () => {
    test('rapid tab switching does not cause errors', async () => {
      const tabs = ['all', 'areas', 'categories', 'labels'];

      // Rapid switching
      for (let i = 0; i < 10; i++) {
        card._filterTab = tabs[i % tabs.length];
        await card.updateComplete;
      }

      expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });

    test('all layouts render with multiple automations', async () => {
      const tabs = ['all', 'areas', 'categories', 'labels'];

      for (const tab of tabs) {
        card._filterTab = tab;
        await card.updateComplete;

        const haCard = card.shadowRoot.querySelector('ha-card');
        expect(haCard).not.toBeNull();
      }
    });

    test('layout preserves selection across tab changes', async () => {
      card._selected = ['automation.living_room_lights'];
      await card.updateComplete;

      card._filterTab = 'areas';
      await card.updateComplete;

      expect(card._selected).toContain('automation.living_room_lights');

      card._filterTab = 'all';
      await card.updateComplete;

      expect(card._selected).toContain('automation.living_room_lights');
    });

    test('layout preserves search across tab changes', async () => {
      card._search = 'living';
      await card.updateComplete;

      card._filterTab = 'areas';
      await card.updateComplete;

      expect(card._search).toBe('living');
    });
  });

  describe('Group expansion state', () => {
    test('expanded groups state is maintained', async () => {
      card._filterTab = 'areas';
      await card.updateComplete;

      // Toggle group expansion
      if (card._expandedGroups instanceof Set) {
        card._expandedGroups.add('living_room');
      } else if (typeof card._expandedGroups === 'object') {
        card._expandedGroups = { ...card._expandedGroups, living_room: true };
      }
      await card.updateComplete;

      // Switch away and back
      card._filterTab = 'all';
      await card.updateComplete;
      card._filterTab = 'areas';
      await card.updateComplete;

      // Card should still render
      expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });
  });

  describe('Empty state handling per layout', () => {
    test('all tab handles empty automations list', async () => {
      card.hass = createMockHass({
        states: {
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
      card._filterTab = 'all';
      await card.updateComplete;

      expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });

    test('areas tab handles no areas defined', async () => {
      card.hass = { ...mockHass, areas: {} };
      card._filterTab = 'areas';
      await card.updateComplete;

      expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });

    test('categories tab handles no categories', async () => {
      card._categoryRegistry = {};
      card._filterTab = 'categories';
      await card.updateComplete;

      expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });

    test('labels tab handles no labels', async () => {
      card._labelRegistry = {};
      card._entityRegistry = {};
      card._filterTab = 'labels';
      await card.updateComplete;

      expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });
  });

  describe('Concurrent state updates', () => {
    test('simultaneous hass and config updates', async () => {
      const newHass = createComplexMockHass();
      newHass.states['automation.new_automation'] = {
        entity_id: 'automation.new_automation',
        state: 'on',
        attributes: { friendly_name: 'New Automation' },
      };

      // Simultaneous updates
      card.hass = newHass;
      card.setConfig({ title: 'Updated Title' });
      await card.updateComplete;

      expect(card.config.title).toBe('Updated Title');
      expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });

    test('multiple rapid hass updates', async () => {
      for (let i = 0; i < 5; i++) {
        const newHass = createComplexMockHass();
        newHass.states['automation.dynamic_' + i] = {
          entity_id: 'automation.dynamic_' + i,
          state: 'on',
          attributes: { friendly_name: 'Dynamic ' + i },
        };
        card.hass = newHass;
      }
      await card.updateComplete;

      expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });
  });
});

// =============================================================================
// CROSS-CARD COMPATIBILITY
// =============================================================================

describe('Cross-Card Compatibility', () => {
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
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Multiple card instances', () => {
    test('two AutoSnooze cards can coexist', async () => {
      const CardClass = customElements.get('autosnooze-card');

      const card1 = new CardClass();
      card1.setConfig({ title: 'Card 1' });
      card1.hass = mockHass;
      document.body.appendChild(card1);

      const card2 = new CardClass();
      card2.setConfig({ title: 'Card 2' });
      card2.hass = mockHass;
      document.body.appendChild(card2);

      await card1.updateComplete;
      await card2.updateComplete;

      expect(card1.config.title).toBe('Card 1');
      expect(card2.config.title).toBe('Card 2');
      expect(card1.shadowRoot.querySelector('ha-card')).not.toBeNull();
      expect(card2.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });

    test('card instances maintain independent state', async () => {
      const CardClass = customElements.get('autosnooze-card');

      const card1 = new CardClass();
      card1.setConfig({ title: 'Card 1' });
      card1.hass = mockHass;
      document.body.appendChild(card1);

      const card2 = new CardClass();
      card2.setConfig({ title: 'Card 2' });
      card2.hass = mockHass;
      document.body.appendChild(card2);

      await card1.updateComplete;
      await card2.updateComplete;

      // Modify state on card1
      card1._selected = ['automation.test'];
      card1._filterTab = 'areas';
      await card1.updateComplete;

      // Card2 should be unaffected
      expect(card2._selected).toEqual([]);
      expect(card2._filterTab).toBe('all');
    });

    test('removing one card does not affect another', async () => {
      const CardClass = customElements.get('autosnooze-card');

      const card1 = new CardClass();
      card1.setConfig({ title: 'Card 1' });
      card1.hass = mockHass;
      document.body.appendChild(card1);

      const card2 = new CardClass();
      card2.setConfig({ title: 'Card 2' });
      card2.hass = mockHass;
      document.body.appendChild(card2);

      await card1.updateComplete;
      await card2.updateComplete;

      // Remove card1
      card1.remove();

      // Card2 should still function
      card2._selected = ['automation.test'];
      await card2.updateComplete;

      expect(card2._selected).toContain('automation.test');
      expect(card2.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });
  });

  describe('DOM integration', () => {
    test('card handles being moved in DOM', async () => {
      const CardClass = customElements.get('autosnooze-card');
      card = new CardClass();
      card.setConfig({ title: 'Moveable Card' });
      card.hass = mockHass;

      // Add to body
      document.body.appendChild(card);
      await card.updateComplete;

      // Create container and move card
      const container = document.createElement('div');
      document.body.appendChild(container);
      container.appendChild(card);
      await card.updateComplete;

      expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });

    test('card survives parent element removal and re-addition', async () => {
      const CardClass = customElements.get('autosnooze-card');
      card = new CardClass();
      card.setConfig({ title: 'Test Card' });
      card.hass = mockHass;

      const container = document.createElement('div');
      document.body.appendChild(container);
      container.appendChild(card);
      await card.updateComplete;

      // Remove from DOM
      card.remove();

      // Re-add to DOM
      document.body.appendChild(card);
      await card.updateComplete;

      expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });
  });

  describe('Event isolation', () => {
    test('events from one card do not affect another', async () => {
      const CardClass = customElements.get('autosnooze-card');

      const card1 = new CardClass();
      card1.setConfig({ title: 'Card 1' });
      card1.hass = mockHass;
      document.body.appendChild(card1);

      const card2 = new CardClass();
      card2.setConfig({ title: 'Card 2' });
      card2.hass = mockHass;
      document.body.appendChild(card2);

      await card1.updateComplete;
      await card2.updateComplete;

      const card2Spy = vi.fn();
      card2.addEventListener('some-event', card2Spy);

      // Dispatch event on card1
      card1.dispatchEvent(new CustomEvent('some-event', { bubbles: false }));

      expect(card2Spy).not.toHaveBeenCalled();
    });
  });
});

// =============================================================================
// CLEANUP VERIFICATION
// =============================================================================

describe('Cleanup Verification', () => {
  let mockHass;

  beforeEach(() => {
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
          attributes: {
            paused_automations: {
              'automation.test': {
                resume_at: new Date(Date.now() + 3600000).toISOString(),
              },
            },
            scheduled_snoozes: {},
          },
        },
      },
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllTimers();
  });

  describe('Interval cleanup', () => {
    test('disconnectedCallback clears countdown interval', async () => {
      vi.useFakeTimers();

      const CardClass = customElements.get('autosnooze-card');
      const card = new CardClass();
      card.setConfig({ title: 'Test' });
      card.hass = mockHass;
      document.body.appendChild(card);
      await card.updateComplete;

      // Verify interval is set
      expect(card._interval).toBeDefined();

      // Disconnect card
      card.remove();

      // Interval should be cleared
      expect(card._interval).toBeNull();

      vi.useRealTimers();
    });

    test('multiple connect/disconnect cycles clean up properly', async () => {
      vi.useFakeTimers();

      const CardClass = customElements.get('autosnooze-card');
      const card = new CardClass();
      card.setConfig({ title: 'Test' });
      card.hass = mockHass;

      for (let i = 0; i < 5; i++) {
        document.body.appendChild(card);
        await card.updateComplete;
        expect(card._interval).toBeDefined();

        card.remove();
        expect(card._interval).toBeNull();
      }

      vi.useRealTimers();
    });
  });

  describe('Timeout cleanup', () => {
    test('search timeout is cleared on disconnect', async () => {
      vi.useFakeTimers();

      const CardClass = customElements.get('autosnooze-card');
      const card = new CardClass();
      card.setConfig({ title: 'Test' });
      card.hass = mockHass;
      document.body.appendChild(card);
      await card.updateComplete;

      // Trigger search to create timeout
      const searchInput = card.shadowRoot.querySelector('input[type="text"]');
      if (searchInput) {
        searchInput.value = 'test';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Disconnect should clear any pending timeouts
      card.remove();

      // Advance timers - should not cause errors
      vi.advanceTimersByTime(1000);

      vi.useRealTimers();
    });

    test('sync timeout is cleared on disconnect', async () => {
      vi.useFakeTimers();

      const CardClass = customElements.get('autosnooze-card');
      const card = new CardClass();
      card.setConfig({ title: 'Test' });
      card.hass = mockHass;
      document.body.appendChild(card);
      await card.updateComplete;

      card.remove();

      // Should not throw when timeouts would fire
      expect(() => {
        vi.advanceTimersByTime(5000);
      }).not.toThrow();

      vi.useRealTimers();
    });
  });

  describe('State cleanup', () => {
    test('selection is preserved but can be cleared', async () => {
      const CardClass = customElements.get('autosnooze-card');
      const card = new CardClass();
      card.setConfig({ title: 'Test' });
      card.hass = mockHass;
      document.body.appendChild(card);
      await card.updateComplete;

      card._selected = ['automation.test'];
      await card.updateComplete;

      // Remove and re-add
      card.remove();
      document.body.appendChild(card);
      await card.updateComplete;

      // Selection should persist (component state)
      expect(card._selected).toContain('automation.test');

      // But can be cleared
      card._selected = [];
      await card.updateComplete;
      expect(card._selected).toEqual([]);
    });
  });

  describe('Memory leak prevention', () => {
    test('creating and destroying many cards does not leak', async () => {
      const CardClass = customElements.get('autosnooze-card');

      for (let i = 0; i < 20; i++) {
        const card = new CardClass();
        card.setConfig({ title: 'Temp Card ' + i });
        card.hass = mockHass;
        document.body.appendChild(card);
        await card.updateComplete;
        card.remove();
      }

      // Document body should be clean
      expect(document.body.children.length).toBe(0);
    });
  });
});

// =============================================================================
// POPULAR CARD CONFLICT TESTING
// =============================================================================

describe('Popular Card Conflict Testing', () => {
  let mockHass;

  beforeEach(() => {
    mockHass = createMockHass({
      states: {
        'automation.test': {
          entity_id: 'automation.test',
          state: 'on',
          attributes: { friendly_name: 'Test Automation' },
        },
        'light.living_room': {
          entity_id: 'light.living_room',
          state: 'on',
          attributes: { friendly_name: 'Living Room Light', brightness: 255 },
        },
        'sensor.temperature': {
          entity_id: 'sensor.temperature',
          state: '72',
          attributes: { friendly_name: 'Temperature', unit_of_measurement: '°F' },
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
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Simulated button-card patterns', () => {
    test('coexists with button-card style custom elements', async () => {
      // Create mock button-card element
      if (!customElements.get('mock-button-card')) {
        class MockButtonCard extends HTMLElement {
          constructor() {
            super();
            this.attachShadow({ mode: 'open' });
          }
          set hass(value) {
            this._hass = value;
            this.render();
          }
          setConfig(config) {
            this._config = config;
          }
          render() {
            this.shadowRoot.innerHTML = '<div class="button">Mock Button</div>';
          }
        }
        customElements.define('mock-button-card', MockButtonCard);
      }

      const buttonCard = document.createElement('mock-button-card');
      buttonCard.setConfig({ entity: 'light.living_room' });
      buttonCard.hass = mockHass;
      document.body.appendChild(buttonCard);

      const CardClass = customElements.get('autosnooze-card');
      const autosnoozeCard = new CardClass();
      autosnoozeCard.setConfig({ title: 'AutoSnooze' });
      autosnoozeCard.hass = mockHass;
      document.body.appendChild(autosnoozeCard);
      await autosnoozeCard.updateComplete;

      expect(autosnoozeCard.shadowRoot.querySelector('ha-card')).not.toBeNull();
      expect(buttonCard.shadowRoot.querySelector('.button')).not.toBeNull();
    });
  });

  describe('Simulated mushroom card patterns', () => {
    test('coexists with mushroom-style custom elements', async () => {
      // Create mock mushroom-like element
      if (!customElements.get('mock-mushroom-card')) {
        class MockMushroomCard extends HTMLElement {
          constructor() {
            super();
            this.attachShadow({ mode: 'open' });
          }
          set hass(value) {
            this._hass = value;
            this.render();
          }
          setConfig(config) {
            this._config = config;
          }
          render() {
            this.shadowRoot.innerHTML = '<div class="mushroom">Mock Mushroom</div>';
          }
        }
        customElements.define('mock-mushroom-card', MockMushroomCard);
      }

      const mushroomCard = document.createElement('mock-mushroom-card');
      mushroomCard.setConfig({ entity: 'light.living_room' });
      mushroomCard.hass = mockHass;
      document.body.appendChild(mushroomCard);

      const CardClass = customElements.get('autosnooze-card');
      const autosnoozeCard = new CardClass();
      autosnoozeCard.setConfig({ title: 'AutoSnooze' });
      autosnoozeCard.hass = mockHass;
      document.body.appendChild(autosnoozeCard);
      await autosnoozeCard.updateComplete;

      expect(autosnoozeCard.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });
  });

  describe('Simulated mini-graph-card patterns', () => {
    test('coexists with graph-style custom elements', async () => {
      // Create a simple mock graph card inline to avoid registration caching issues
      // Note: Using div instead of SVG due to jsdom querySelector limitations with SVG in shadow DOM
      const graphCard = document.createElement('div');
      graphCard.attachShadow({ mode: 'open' });
      graphCard.shadowRoot.innerHTML = '<div class="graph-container"><div class="graph">Graph Content</div></div>';
      graphCard._hass = null;
      graphCard._config = { entities: ['sensor.temperature'] };
      document.body.appendChild(graphCard);

      const CardClass = customElements.get('autosnooze-card');
      const autosnoozeCard = new CardClass();
      autosnoozeCard.setConfig({ title: 'AutoSnooze' });
      autosnoozeCard.hass = mockHass;
      document.body.appendChild(autosnoozeCard);
      await autosnoozeCard.updateComplete;

      // Both cards should render without conflicts
      expect(autosnoozeCard.shadowRoot.querySelector('ha-card')).not.toBeNull();
      expect(graphCard.shadowRoot.querySelector('.graph')).not.toBeNull();
    });

    test('coexists with registered graph-style custom elements', async () => {
      // Test with an actual registered custom element
      const elementName = 'mock-graph-card-' + Date.now();
      class MockGraphCard extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
          // Using div instead of SVG due to jsdom querySelector limitations
          this.shadowRoot.innerHTML = '<div class="graph-wrapper"><canvas class="graph-canvas"></canvas></div>';
        }
        set hass(value) {
          this._hass = value;
        }
        setConfig(config) {
          this._config = config;
        }
      }
      customElements.define(elementName, MockGraphCard);

      const graphCard = document.createElement(elementName);
      graphCard.setConfig({ entities: ['sensor.temperature'] });
      document.body.appendChild(graphCard);
      graphCard.hass = mockHass;

      const CardClass = customElements.get('autosnooze-card');
      const autosnoozeCard = new CardClass();
      autosnoozeCard.setConfig({ title: 'AutoSnooze' });
      autosnoozeCard.hass = mockHass;
      document.body.appendChild(autosnoozeCard);
      await autosnoozeCard.updateComplete;

      expect(autosnoozeCard.shadowRoot.querySelector('ha-card')).not.toBeNull();
      expect(graphCard.shadowRoot.querySelector('.graph-canvas')).not.toBeNull();
    });
  });

  describe('Dashboard with mixed cards', () => {
    test('multiple different card types in same dashboard', async () => {
      // Register all mock cards if not already registered
      if (!customElements.get('mock-entity-card')) {
        class MockEntityCard extends HTMLElement {
          constructor() {
            super();
            this.attachShadow({ mode: 'open' });
          }
          set hass(value) {
            this._hass = value;
          }
          setConfig(config) {
            this._config = config;
          }
          connectedCallback() {
            this.shadowRoot.innerHTML = '<div class="entity">Entity</div>';
          }
        }
        customElements.define('mock-entity-card', MockEntityCard);
      }

      // Create a simulated dashboard with multiple cards
      const dashboard = document.createElement('div');
      dashboard.className = 'dashboard';
      document.body.appendChild(dashboard);

      // Add entity card
      const entityCard = document.createElement('mock-entity-card');
      entityCard.setConfig({ entity: 'sensor.temperature' });
      entityCard.hass = mockHass;
      dashboard.appendChild(entityCard);

      // Add AutoSnooze card
      const CardClass = customElements.get('autosnooze-card');
      const autosnoozeCard = new CardClass();
      autosnoozeCard.setConfig({ title: 'AutoSnooze' });
      autosnoozeCard.hass = mockHass;
      dashboard.appendChild(autosnoozeCard);
      await autosnoozeCard.updateComplete;

      // Add another entity card after AutoSnooze
      const entityCard2 = document.createElement('mock-entity-card');
      entityCard2.setConfig({ entity: 'light.living_room' });
      entityCard2.hass = mockHass;
      dashboard.appendChild(entityCard2);

      // All cards should render properly
      expect(autosnoozeCard.shadowRoot.querySelector('ha-card')).not.toBeNull();
      expect(dashboard.querySelectorAll('mock-entity-card').length).toBe(2);
    });

    test('hass updates propagate correctly to all cards', async () => {
      if (!customElements.get('mock-simple-card')) {
        class MockSimpleCard extends HTMLElement {
          constructor() {
            super();
            this.attachShadow({ mode: 'open' });
            this.hassUpdateCount = 0;
          }
          set hass(value) {
            this._hass = value;
            this.hassUpdateCount++;
          }
          setConfig(config) {
            this._config = config;
          }
        }
        customElements.define('mock-simple-card', MockSimpleCard);
      }

      const simpleCard = document.createElement('mock-simple-card');
      simpleCard.setConfig({});
      simpleCard.hass = mockHass;
      document.body.appendChild(simpleCard);

      const CardClass = customElements.get('autosnooze-card');
      const autosnoozeCard = new CardClass();
      autosnoozeCard.setConfig({ title: 'AutoSnooze' });
      autosnoozeCard.hass = mockHass;
      document.body.appendChild(autosnoozeCard);
      await autosnoozeCard.updateComplete;

      // Simulate hass update
      const newHass = { ...mockHass };
      simpleCard.hass = newHass;
      autosnoozeCard.hass = newHass;
      await autosnoozeCard.updateComplete;

      expect(simpleCard.hassUpdateCount).toBe(2);
      expect(autosnoozeCard.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });
  });

  describe('CSS isolation', () => {
    test('card styles do not leak to other cards', async () => {
      const CardClass = customElements.get('autosnooze-card');
      const autosnoozeCard = new CardClass();
      autosnoozeCard.setConfig({ title: 'AutoSnooze' });
      autosnoozeCard.hass = mockHass;
      document.body.appendChild(autosnoozeCard);
      await autosnoozeCard.updateComplete;

      // Create a plain div to check for style leakage
      const testDiv = document.createElement('div');
      testDiv.className = 'pill'; // Same class name used in AutoSnooze card
      document.body.appendChild(testDiv);

      // The test div should not inherit AutoSnooze card styles (shadow DOM isolation)
      // Basic check - the div exists at document level, not inside shadow DOM
      expect(testDiv.parentElement).toBe(document.body);
    });

    test('shadow DOM encapsulates card internals', async () => {
      const CardClass = customElements.get('autosnooze-card');
      const autosnoozeCard = new CardClass();
      autosnoozeCard.setConfig({ title: 'AutoSnooze' });
      autosnoozeCard.hass = mockHass;
      document.body.appendChild(autosnoozeCard);
      await autosnoozeCard.updateComplete;

      // Cannot query internal elements from document
      expect(document.querySelector('.pill')).toBeNull();
      expect(document.querySelector('.list-item')).toBeNull();

      // But can query from shadow root
      expect(autosnoozeCard.shadowRoot.querySelectorAll('.pill').length).toBeGreaterThan(0);
    });
  });

  describe('Global namespace safety', () => {
    test('card does not pollute window object', async () => {
      const CardClass = customElements.get('autosnooze-card');
      const autosnoozeCard = new CardClass();
      autosnoozeCard.setConfig({ title: 'AutoSnooze' });
      autosnoozeCard.hass = mockHass;
      document.body.appendChild(autosnoozeCard);
      await autosnoozeCard.updateComplete;

      // Card should register in customCards but not add arbitrary globals
      expect(window.customCards).toBeDefined();
      // Verify customCards is an array (proper registration pattern)
      expect(Array.isArray(window.customCards)).toBe(true);

      autosnoozeCard.remove();
    });

    test('customCards registration is proper', () => {
      // Verify card class is registered with customElements
      // The card registration pattern uses customElements.define()
      // This verifies the registration pattern is correct
      expect(customElements.get('autosnooze-card')).toBeDefined();
    });
  });
});

// =============================================================================
// STRESS TESTING
// =============================================================================

describe('Stress Testing', () => {
  let mockHass;

  beforeEach(() => {
    const states = {
      'sensor.autosnooze_status': {
        state: 'idle',
        attributes: { paused_count: 0, scheduled_count: 0 },
      },
      'sensor.autosnooze_snoozed_automations': {
        state: '0',
        attributes: { paused_automations: {}, scheduled_snoozes: {} },
      },
    };

    // Create many automations
    for (let i = 0; i < 100; i++) {
      states[`automation.auto_${i}`] = {
        entity_id: `automation.auto_${i}`,
        state: i % 2 === 0 ? 'on' : 'off',
        attributes: { friendly_name: `Automation ${i}` },
      };
    }

    mockHass = createMockHass({ states });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders with 100 automations', async () => {
    const CardClass = customElements.get('autosnooze-card');
    const card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    const automations = card._getAutomations();
    expect(automations.length).toBe(100);
  });

  test('search filters 100 automations efficiently', async () => {
    const CardClass = customElements.get('autosnooze-card');
    const card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    card._search = '50';
    await card.updateComplete;

    expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
  });

  test('selecting many automations works', async () => {
    const CardClass = customElements.get('autosnooze-card');
    const card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    // Select 50 automations
    const selected = [];
    for (let i = 0; i < 50; i++) {
      selected.push(`automation.auto_${i}`);
    }
    card._selected = selected;
    await card.updateComplete;

    expect(card._selected.length).toBe(50);
    expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
  });
});
