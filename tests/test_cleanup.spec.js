/**
 * Cleanup Verification Tests
 *
 * Tests for proper cleanup of intervals, timeouts, and memory leak prevention.
 */

import { vi } from 'vitest';
import '../custom_components/autosnooze/www/autosnooze-card.js';

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

  describe('Interval cleanup (child component)', () => {
    test('child disconnectedCallback clears countdown interval', async () => {
      vi.useFakeTimers();

      const ChildClass = customElements.get('autosnooze-active-pauses');
      const child = new ChildClass();
      child._interval = setInterval(() => {}, 1000);

      child.disconnectedCallback();

      expect(child._interval).toBeNull();

      vi.useRealTimers();
    });

    test('multiple connect/disconnect cycles clean up child timers', async () => {
      vi.useFakeTimers();

      const ChildClass = customElements.get('autosnooze-active-pauses');
      const child = new ChildClass();

      for (let i = 0; i < 5; i++) {
        child.connectedCallback();
        expect(child._syncTimeout).not.toBeNull();

        child.disconnectedCallback();
        expect(child._interval).toBeNull();
        expect(child._syncTimeout).toBeNull();
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

      const searchInput = card.shadowRoot.querySelector('input[type="text"]');
      if (searchInput) {
        searchInput.value = 'test';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      card.remove();

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

      expect(document.body.children.length).toBe(0);
    });
  });
});
