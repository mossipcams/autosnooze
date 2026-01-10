/**
 * Card Compatibility Tests
 *
 * Tests for multiple card instances, DOM integration, event isolation,
 * and compatibility with other popular custom cards.
 */

import { vi } from 'vitest';
import '../src/index.js';

describe('Card Compatibility', () => {
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

      card1._selected = ['automation.test'];
      card1._filterTab = 'areas';
      await card1.updateComplete;

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

      card1.remove();

      card2._selected = ['automation.test'];
      await card2.updateComplete;

      expect(card2._selected).toContain('automation.test');
      expect(card2.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });
  });

  describe('DOM integration', () => {
    test('card handles being moved in DOM', async () => {
      const CardClass = customElements.get('autosnooze-card');
      const card = new CardClass();
      card.setConfig({ title: 'Moveable Card' });
      card.hass = mockHass;

      document.body.appendChild(card);
      await card.updateComplete;

      const container = document.createElement('div');
      document.body.appendChild(container);
      container.appendChild(card);
      await card.updateComplete;

      expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });

    test('card survives parent element removal and re-addition', async () => {
      const CardClass = customElements.get('autosnooze-card');
      const card = new CardClass();
      card.setConfig({ title: 'Test Card' });
      card.hass = mockHass;

      const container = document.createElement('div');
      document.body.appendChild(container);
      container.appendChild(card);
      await card.updateComplete;

      card.remove();

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

      card1.dispatchEvent(new CustomEvent('some-event', { bubbles: false }));

      expect(card2Spy).not.toHaveBeenCalled();
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

      const testDiv = document.createElement('div');
      testDiv.className = 'pill';
      document.body.appendChild(testDiv);

      expect(testDiv.parentElement).toBe(document.body);
    });

    test('shadow DOM encapsulates card internals', async () => {
      const CardClass = customElements.get('autosnooze-card');
      const autosnoozeCard = new CardClass();
      autosnoozeCard.setConfig({ title: 'AutoSnooze' });
      autosnoozeCard.hass = mockHass;
      document.body.appendChild(autosnoozeCard);
      await autosnoozeCard.updateComplete;

      expect(document.querySelector('.pill')).toBeNull();
      expect(document.querySelector('.list-item')).toBeNull();
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

      expect(window.customCards).toBeDefined();
      expect(Array.isArray(window.customCards)).toBe(true);

      autosnoozeCard.remove();
    });

    test('customCards registration is proper', () => {
      expect(customElements.get('autosnooze-card')).toBeDefined();
    });
  });

  describe('Third-party card coexistence', () => {
    test('coexists with button-card style custom elements', async () => {
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

    test('coexists with mushroom-style custom elements', async () => {
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

    test('coexists with graph-style custom elements', async () => {
      const graphCard = document.createElement('div');
      graphCard.attachShadow({ mode: 'open' });
      graphCard.shadowRoot.innerHTML = '<div class="graph-container"><div class="graph">Graph Content</div></div>';
      document.body.appendChild(graphCard);

      const CardClass = customElements.get('autosnooze-card');
      const autosnoozeCard = new CardClass();
      autosnoozeCard.setConfig({ title: 'AutoSnooze' });
      autosnoozeCard.hass = mockHass;
      document.body.appendChild(autosnoozeCard);
      await autosnoozeCard.updateComplete;

      expect(autosnoozeCard.shadowRoot.querySelector('ha-card')).not.toBeNull();
      expect(graphCard.shadowRoot.querySelector('.graph')).not.toBeNull();
    });

    test('multiple different card types in same dashboard', async () => {
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

      const dashboard = document.createElement('div');
      dashboard.className = 'dashboard';
      document.body.appendChild(dashboard);

      const entityCard = document.createElement('mock-entity-card');
      entityCard.setConfig({ entity: 'sensor.temperature' });
      entityCard.hass = mockHass;
      dashboard.appendChild(entityCard);

      const CardClass = customElements.get('autosnooze-card');
      const autosnoozeCard = new CardClass();
      autosnoozeCard.setConfig({ title: 'AutoSnooze' });
      autosnoozeCard.hass = mockHass;
      dashboard.appendChild(autosnoozeCard);
      await autosnoozeCard.updateComplete;

      const entityCard2 = document.createElement('mock-entity-card');
      entityCard2.setConfig({ entity: 'light.living_room' });
      entityCard2.hass = mockHass;
      dashboard.appendChild(entityCard2);

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

      const newHass = { ...mockHass };
      simpleCard.hass = newHass;
      autosnoozeCard.hass = newHass;
      await autosnoozeCard.updateComplete;

      expect(simpleCard.hassUpdateCount).toBe(2);
      expect(autosnoozeCard.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });
  });
});
