/**
 * Cleanup Verification Tests
 *
 * Tests for proper cleanup of intervals, timeouts, and memory leak prevention.
 */

import { vi } from 'vitest';
import '../src/index.js';

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

      expect(card._interval).toBeDefined();

      card.remove();

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
    test('search timeout is cleared on disconnect (no pending updates)', async () => {
      vi.useFakeTimers();

      const CardClass = customElements.get('autosnooze-card');
      const card = new CardClass();
      card.setConfig({ title: 'Test' });
      card.hass = mockHass;
      document.body.appendChild(card);
      await card.updateComplete;

      const searchInput = card.shadowRoot.querySelector('input[type="text"]');
      if (searchInput) {
        searchInput.value = 'test';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Search should be empty before debounce completes
      expect(card._search).toBe('');

      card.remove();

      // After disconnect, timeout should be cleared - search should stay empty
      vi.advanceTimersByTime(1000);
      expect(card._searchTimeout).toBeNull();

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

      card.remove();
      document.body.appendChild(card);
      await card.updateComplete;

      expect(card._selected).toContain('automation.test');

      card._selected = [];
      await card.updateComplete;
      expect(card._selected).toEqual([]);
    });
  });

  describe('Memory leak prevention', () => {
    test('creating and destroying many cards clears all timeouts', async () => {
      vi.useFakeTimers();
      const CardClass = customElements.get('autosnooze-card');
      const cards = [];

      for (let i = 0; i < 5; i++) {
        const card = new CardClass();
        card.setConfig({ title: 'Temp Card ' + i });
        card.hass = mockHass;
        document.body.appendChild(card);
        await card.updateComplete;
        cards.push(card);
      }

      // All cards should have sync timeouts scheduled
      cards.forEach((card) => {
        expect(card._syncTimeout).not.toBeNull();
      });

      // Remove all cards
      cards.forEach((card) => card.remove());

      // All timeouts should be cleared
      cards.forEach((card) => {
        expect(card._syncTimeout).toBeNull();
      });

      vi.useRealTimers();
    });
  });
});
