import { describe, expect, test, vi } from 'vitest';

vi.mock('../services/storage.js', () => ({
  saveLastDuration: vi.fn(),
  loadLastDuration: vi.fn().mockReturnValue(null),
  saveRecentSnoozes: vi.fn(),
  loadRecentSnoozes: vi.fn().mockReturnValue([]),
  loadHideSnoozedPreference: vi.fn().mockReturnValue(false),
  saveHideSnoozedPreference: vi.fn(),
}));

vi.mock('../services/registry.js', () => ({
  fetchLabelRegistry: vi.fn().mockResolvedValue({}),
  fetchCategoryRegistry: vi.fn().mockResolvedValue({}),
  fetchEntityRegistry: vi.fn().mockResolvedValue([]),
}));

import { AutomationPauseCard } from '../components/autosnooze-card.js';
import type { HomeAssistant } from '../types/hass.js';

const TEST_TAG = 'test-card-paused-ids';

if (!customElements.get(TEST_TAG)) {
  customElements.define(TEST_TAG, AutomationPauseCard);
}

describe('Card passes paused entity ids to automation list', () => {
  test('automation-list receives pausedEntityIds from the snooze sensor snapshot', async () => {
    const el = document.createElement(TEST_TAG) as AutomationPauseCard;
    el.hass = {
      states: {
        'sensor.autosnooze_snoozed_automations': {
          state: '1',
          attributes: {
            schema_version: 1,
            paused: {
              'automation.kitchen_lights': {
                friendly_name: 'Kitchen Lights',
                resume_at: '2026-04-29T18:00:00',
                paused_at: '2026-04-29T12:00:00',
                days: 0,
                hours: 6,
                minutes: 0,
              },
            },
            scheduled: {},
          },
        },
      },
      entities: {},
      areas: {},
      connection: { sendMessagePromise: async () => [] },
      callService: async () => undefined,
    } as unknown as HomeAssistant;

    document.body.appendChild(el);
    try {
      await el.updateComplete;
      const list = el.shadowRoot?.querySelector('autosnooze-automation-list') as unknown as {
        pausedEntityIds: string[];
      };
      expect(list?.pausedEntityIds).toEqual(['automation.kitchen_lights']);
    } finally {
      document.body.removeChild(el);
    }
  });
});
