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

import { vi } from 'vitest';
import '../src/index.js';

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

  // Defect #3 tests moved to test_card_ui.spec.js - Custom Duration Input section

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
        sendMessagePromise: vi.fn().mockResolvedValue([
          { entity_id: 'automation.test', categories: {}, labels: [] },
        ]),
      };

      await card._fetchEntityRegistry();

      expect(card._entityRegistryFetched).toBe(true);
      expect(card._entityRegistry['automation.test']).toBeDefined();
    });
  });

  describe('Defect #7: iOS Companion App card stability', () => {
    test('card has default empty config before setConfig is called', () => {
      const CardClass = customElements.get('autosnooze-card');
      const newCard = new CardClass();
      expect(newCard.config).toEqual({});
    });

    test('card setConfig updates config property', () => {
      const CardClass = customElements.get('autosnooze-card');
      const newCard = new CardClass();
      newCard.setConfig({ title: 'Test' });
      expect(newCard.config.title).toBe('Test');
    });

    test('_getAutomations returns empty array when hass not set', () => {
      const CardClass = customElements.get('autosnooze-card');
      const newCard = new CardClass();
      newCard.setConfig({ title: 'Test' });
      expect(newCard._getAutomations()).toEqual([]);
    });
  });

  // Defect #9 locale tests consolidated in test_mutation_coverage.spec.js
});
