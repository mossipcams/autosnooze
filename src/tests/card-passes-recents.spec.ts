import { beforeEach, describe, expect, test, vi } from 'vitest';

const { loadRecentSnoozes, runPauseFeature } = vi.hoisted(() => ({
  loadRecentSnoozes: vi.fn().mockReturnValue(['automation.x']),
  runPauseFeature: vi.fn().mockResolvedValue({
    status: 'submitted',
    toastMessage: 'Snoozed',
  }),
}));

vi.mock('../services/storage.js', () => ({
  saveLastDuration: vi.fn(),
  loadLastDuration: vi.fn().mockReturnValue(null),
  clearLastDuration: vi.fn(),
  saveRecentSnoozes: vi.fn(),
  loadRecentSnoozes,
}));

vi.mock('../services/registry.js', () => ({
  fetchLabelRegistry: vi.fn().mockResolvedValue({}),
  fetchCategoryRegistry: vi.fn().mockResolvedValue({}),
  fetchEntityRegistry: vi.fn().mockResolvedValue([]),
}));

vi.mock('../features/pause/index.js', () => ({
  runPauseFeature,
}));

import { AutomationPauseCard } from '../components/autosnooze-card.js';
import type { HomeAssistant } from '../types/hass.js';

const TEST_TAG = 'test-card-passes-recents';

if (!customElements.get(TEST_TAG)) {
  customElements.define(TEST_TAG, AutomationPauseCard);
}

type CardSnoozeHarness = {
  hass: HomeAssistant;
  shadowRoot: ShadowRoot | null;
  updateComplete: Promise<unknown>;
  _selected: string[];
  _snooze: () => Promise<void>;
};

describe('Card passes recentSnoozeIds to automation list', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadRecentSnoozes.mockReset();
    loadRecentSnoozes.mockReturnValue(['automation.x']);
    runPauseFeature.mockReset();
    runPauseFeature.mockResolvedValue({
      status: 'submitted',
      toastMessage: 'Snoozed',
    });
  });

  test('automation-list element receives recentSnoozeIds prop', async () => {
    const el = document.createElement(TEST_TAG) as AutomationPauseCard;
    el.hass = {
      states: {},
      entities: {},
      areas: {},
      connection: { sendMessagePromise: async () => [] },
      callService: async () => undefined,
    } as unknown as HomeAssistant;
    document.body.appendChild(el);
    try {
      await el.updateComplete;

      const list = el.shadowRoot?.querySelector('autosnooze-automation-list') as unknown as { recentSnoozeIds: string[] };
      expect(list?.recentSnoozeIds).toEqual(['automation.x']);
    } finally {
      document.body.removeChild(el);
    }
  });

  test('successful snooze refreshes recentSnoozeIds from storage', async () => {
    loadRecentSnoozes
      .mockReturnValueOnce(['automation.x'])
      .mockReturnValueOnce(['automation.z']);

    const rawEl = document.createElement(TEST_TAG);
    const el = rawEl as unknown as CardSnoozeHarness;
    el.hass = {
      states: {},
      entities: {},
      areas: {},
      locale: { language: 'en' },
      connection: { sendMessagePromise: async () => [] },
      callService: async () => undefined,
    } as unknown as HomeAssistant;

    document.body.appendChild(rawEl);
    try {
      await el.updateComplete;

      el._selected = ['automation.z'];
      await el._snooze();
      await el.updateComplete;

      const list = el.shadowRoot?.querySelector('autosnooze-automation-list') as unknown as { recentSnoozeIds: string[] };
      expect(list?.recentSnoozeIds).toEqual(['automation.z']);
      expect(loadRecentSnoozes).toHaveBeenCalledTimes(2);
    } finally {
      document.body.removeChild(rawEl);
    }
  });
});
