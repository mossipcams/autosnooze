import { beforeEach, describe, expect, test, vi } from 'vitest';

const { runPauseFeature } = vi.hoisted(() => ({
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
  loadRecentSnoozes: vi.fn().mockReturnValue([]),
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

const TEST_TAG = 'test-card-notify-on-resume';

if (!customElements.get(TEST_TAG)) {
  customElements.define(TEST_TAG, AutomationPauseCard);
}

type CardHarness = {
  hass: HomeAssistant;
  shadowRoot: ShadowRoot | null;
  updateComplete: Promise<unknown>;
  _selected: string[];
  _customDuration: { days: number; hours: number; minutes: number };
  _notifyOnResume: boolean;
  _snooze: () => Promise<void>;
};

function makeCard(): { raw: HTMLElement; card: CardHarness } {
  const raw = document.createElement(TEST_TAG);
  const card = raw as unknown as CardHarness;
  card.hass = {
    states: {},
    entities: {},
    areas: {},
    locale: { language: 'en' },
    connection: { sendMessagePromise: async () => [] },
    callService: async () => undefined,
  } as unknown as HomeAssistant;
  return { raw, card };
}

describe('Card notify-on-resume toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runPauseFeature.mockResolvedValue({
      status: 'submitted',
      toastMessage: 'Snoozed',
    });
  });

  test('defaults the toggle off and omits notifyOnResume from the request', async () => {
    const { raw, card } = makeCard();
    document.body.appendChild(raw);
    try {
      await card.updateComplete;
      expect(card._notifyOnResume).toBe(false);

      card._selected = ['automation.a'];
      card._customDuration = { days: 0, hours: 0, minutes: 30 };
      await card._snooze();

      expect(runPauseFeature).toHaveBeenCalledOnce();
      const pauseInput = runPauseFeature.mock.calls[0][0];
      expect(Object.hasOwn(pauseInput, 'notifyOnResume')).toBe(false);
      expect(pauseInput).toMatchObject({
        selected: ['automation.a'],
        customDuration: { days: 0, hours: 0, minutes: 30 },
      });
    } finally {
      document.body.removeChild(raw);
    }
  });

  test('flows enabled toggle state into the _snooze() request payload', async () => {
    const { raw, card } = makeCard();
    document.body.appendChild(raw);
    try {
      await card.updateComplete;

      card._selected = ['automation.a'];
      card._customDuration = { days: 0, hours: 0, minutes: 30 };
      card._notifyOnResume = true;
      await card._snooze();

      expect(runPauseFeature).toHaveBeenCalledOnce();
      const pauseInput = runPauseFeature.mock.calls[0][0];
      expect(pauseInput.notifyOnResume).toBe(true);
      expect(pauseInput).toMatchObject({
        selected: ['automation.a'],
        customDuration: { days: 0, hours: 0, minutes: 30 },
      });
    } finally {
      document.body.removeChild(raw);
    }
  });

  test('resets the toggle to off after a successful snooze (per-snooze)', async () => {
    const { raw, card } = makeCard();
    document.body.appendChild(raw);
    try {
      await card.updateComplete;

      card._selected = ['automation.a'];
      card._customDuration = { days: 0, hours: 0, minutes: 30 };
      card._notifyOnResume = true;
      await card._snooze();

      expect(card._notifyOnResume).toBe(false);
    } finally {
      document.body.removeChild(raw);
    }
  });

  test('checkbox change updates the toggle state', async () => {
    const { raw, card } = makeCard();
    document.body.appendChild(raw);
    try {
      await card.updateComplete;

      const checkbox = card.shadowRoot?.querySelector(
        '.notify-toggle input[type="checkbox"]',
      ) as HTMLInputElement | null;
      expect(checkbox).toBeTruthy();
      expect(checkbox?.checked).toBe(false);

      checkbox!.checked = true;
      checkbox!.dispatchEvent(new Event('change'));

      expect(card._notifyOnResume).toBe(true);
    } finally {
      document.body.removeChild(raw);
    }
  });
});
