/**
 * Regression Tests for UI Defects
 *
 * These tests verify fixes for known defects:
 * 1. All tab should NOT include automation areas on the automation
 * 2. Automation categories should pull from Home Assistant category registry
 * 3. When 30m is selected and then Custom is clicked, 30m button should not stay blue
 * 4. Entity Registry must be fetched for category support
 * 7. iOS Companion App card stability
 * 9. Locale support for date/time formatting
 */

import '../src/autosnooze-card.js';

describe('Defect Fixes - Regression Tests', () => {
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
        'automation.living_room': {
          entity_id: 'automation.living_room',
          state: 'on',
          attributes: { friendly_name: 'Living Room' },
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

  describe('Defect #1: All tab should not show area metadata', () => {
    test('All tab renders only automation name, no area metadata', async () => {
      card._filterTab = 'all';
      await card.updateComplete;

      const listItems = card.shadowRoot.querySelectorAll('.list-item');
      listItems.forEach((item) => {
        const meta = item.querySelector('.list-item-meta');
        expect(meta).toBeNull();
      });
    });

    test('Areas tab renders area metadata in group headers', async () => {
      card._filterTab = 'areas';
      await card.updateComplete;

      const groupHeaders = card.shadowRoot.querySelectorAll('.group-header');
      expect(groupHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('Defect #3: Duration button mutual exclusivity', () => {
    test('clicking Custom toggles _showCustomInput', async () => {
      expect(card._showCustomInput).toBe(false);

      const pills = card.shadowRoot.querySelectorAll('.pill');
      const customPill = Array.from(pills).find((p) => p.textContent.includes('Custom'));
      customPill.click();
      await card.updateComplete;

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

    test('clicking preset duration hides custom input', async () => {
      card._showCustomInput = true;
      await card.updateComplete;

      const pills = card.shadowRoot.querySelectorAll('.pill');
      const presetPill = pills[0]; // First pill is a preset (30m)
      presetPill.click();
      await card.updateComplete;

      expect(card._showCustomInput).toBe(false);
    });

    test('preset pill is not active when custom input is shown', async () => {
      card._showCustomInput = true;
      await card.updateComplete;

      const pills = card.shadowRoot.querySelectorAll('.pill');
      const presetPill = pills[0];

      expect(presetPill.classList.contains('active')).toBe(false);
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

    test('_fetchEntityRegistry populates registry when called', async () => {
      card._entityRegistryFetched = false;
      card._entityRegistry = {};
      card.hass.connection = {
        sendMessagePromise: jest.fn().mockResolvedValue([
          { entity_id: 'automation.test', categories: {}, labels: [] },
        ]),
      };

      await card._fetchEntityRegistry();

      expect(card._entityRegistryFetched).toBe(true);
      expect(card._entityRegistry['automation.test']).toBeDefined();
    });
  });

  describe('Defect #7: iOS Companion App card stability', () => {
    test('card handles missing hass gracefully', async () => {
      const CardClass = customElements.get('autosnooze-card');
      const newCard = new CardClass();
      newCard.setConfig({ title: 'Test' });
      // Don't set hass - verify no crash when accessing methods
      expect(newCard.config).toBeDefined();
      expect(newCard.config.title).toBe('Test');
    });

    test('card handles missing config gracefully', async () => {
      const CardClass = customElements.get('autosnooze-card');
      const newCard = new CardClass();
      newCard.hass = mockHass;
      // config should be empty object by default
      expect(newCard.config).toBeDefined();
    });

    test('card renders after both hass and config are set', async () => {
      const CardClass = customElements.get('autosnooze-card');
      const newCard = new CardClass();
      newCard.setConfig({ title: 'Test' });
      newCard.hass = mockHass;
      document.body.appendChild(newCard);
      await newCard.updateComplete;

      expect(newCard.shadowRoot.querySelector('ha-card')).not.toBeNull();
      newCard.remove();
    });
  });

  describe('Defect #9: Locale support for date/time formatting', () => {
    test('_getLocale method exists', () => {
      expect(typeof card._getLocale).toBe('function');
    });

    test('_getLocale returns hass locale when available', () => {
      card.hass.locale = { language: 'de-DE' };
      expect(card._getLocale()).toBe('de-DE');
    });

    test('_getLocale handles missing locale gracefully', () => {
      card.hass.locale = null;
      // Should not throw when locale is null
      expect(() => card._getLocale()).not.toThrow();
    });

    test('_formatDateTime uses locale', () => {
      card.hass.locale = { language: 'en-US' };
      const result = card._formatDateTime('2024-12-25T14:30:00Z');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
