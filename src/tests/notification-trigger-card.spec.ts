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

vi.mock('../features/pause/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/pause/index.js')>();
  return {
    ...actual,
    runPauseFeature,
  };
});

import { AutomationPauseCard } from '../components/autosnooze-card.js';
import type { HomeAssistant } from '../types/hass.js';

const TEST_TAG = 'test-card-notification-trigger';

if (!customElements.get(TEST_TAG)) {
  customElements.define(TEST_TAG, AutomationPauseCard);
}

type CardHarness = {
  hass: HomeAssistant;
  shadowRoot: ShadowRoot | null;
  updateComplete: Promise<unknown>;
  _selected: string[];
  _customDuration: { days: number; hours: number; minutes: number };
  _notificationsEnabled: boolean;
  _notificationTrigger: 'start' | 'about_to_end' | 'end';
  _notificationLeadMinutes: number;
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

function lastPauseInput(): Record<string, unknown> {
  return runPauseFeature.mock.calls[runPauseFeature.mock.calls.length - 1][0];
}

describe('Card notification trigger control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runPauseFeature.mockResolvedValue({
      status: 'submitted',
      toastMessage: 'Snoozed',
    });
  });

  test('defaults to off and sends no notification fields', async () => {
    const { raw, card } = makeCard();
    document.body.appendChild(raw);
    try {
      await card.updateComplete;
      expect(card._notificationsEnabled).toBe(false);

      // Detail dropdowns are not rendered while off.
      expect(card.shadowRoot?.querySelector('.notify-detail')).toBeFalsy();

      card._selected = ['automation.a'];
      card._customDuration = { days: 0, hours: 0, minutes: 30 };
      await card._snooze();

      const input = lastPauseInput();
      expect(Object.prototype.hasOwnProperty.call(input, 'notificationTrigger')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(input, 'notificationLeadMinutes')).toBe(false);
    } finally {
      document.body.removeChild(raw);
    }
  });

  test('toggling on reveals the when dropdown defaulting to end', async () => {
    const { raw, card } = makeCard();
    document.body.appendChild(raw);
    try {
      await card.updateComplete;

      const toggle = card.shadowRoot?.querySelector(
        '.notify-toggle input[type="checkbox"]',
      ) as HTMLInputElement;
      toggle.checked = true;
      toggle.dispatchEvent(new Event('change'));
      await card.updateComplete;

      expect(card._notificationsEnabled).toBe(true);
      expect(card._notificationTrigger).toBe('end');
      expect(card.shadowRoot?.querySelector('.notify-detail')).toBeTruthy();

      card._selected = ['automation.a'];
      card._customDuration = { days: 0, hours: 0, minutes: 30 };
      await card._snooze();

      const input = lastPauseInput();
      expect(input.notificationTrigger).toBe('end');
      expect(Object.prototype.hasOwnProperty.call(input, 'notificationLeadMinutes')).toBe(false);
    } finally {
      document.body.removeChild(raw);
    }
  });

  test('about_to_end flows trigger and lead minutes', async () => {
    const { raw, card } = makeCard();
    document.body.appendChild(raw);
    try {
      await card.updateComplete;

      card._notificationsEnabled = true;
      card._notificationTrigger = 'about_to_end';
      card._notificationLeadMinutes = 120;
      card._selected = ['automation.a'];
      card._customDuration = { days: 0, hours: 0, minutes: 30 };
      await card._snooze();

      const input = lastPauseInput();
      expect(input.notificationTrigger).toBe('about_to_end');
      expect(input.notificationLeadMinutes).toBe(120);
    } finally {
      document.body.removeChild(raw);
    }
  });

  test('start flows trigger without lead minutes', async () => {
    const { raw, card } = makeCard();
    document.body.appendChild(raw);
    try {
      await card.updateComplete;

      card._notificationsEnabled = true;
      card._notificationTrigger = 'start';
      card._notificationLeadMinutes = 240;
      card._selected = ['automation.a'];
      card._customDuration = { days: 0, hours: 0, minutes: 30 };
      await card._snooze();

      const input = lastPauseInput();
      expect(input.notificationTrigger).toBe('start');
      expect(Object.prototype.hasOwnProperty.call(input, 'notificationLeadMinutes')).toBe(false);
    } finally {
      document.body.removeChild(raw);
    }
  });

  test('lead dropdown only renders for about_to_end', async () => {
    const { raw, card } = makeCard();
    document.body.appendChild(raw);
    try {
      await card.updateComplete;
      card._notificationsEnabled = true;
      card._notificationTrigger = 'end';
      (card as unknown as { requestUpdate: () => void }).requestUpdate();
      await card.updateComplete;

      // Only the "when" select is present for end.
      expect(card.shadowRoot?.querySelectorAll('.notify-field select').length).toBe(1);

      card._notificationTrigger = 'about_to_end';
      (card as unknown as { requestUpdate: () => void }).requestUpdate();
      await card.updateComplete;

      // when + lead selects.
      expect(card.shadowRoot?.querySelectorAll('.notify-field select').length).toBe(2);
    } finally {
      document.body.removeChild(raw);
    }
  });

  test('resets to off / end / default lead after a successful snooze', async () => {
    const { raw, card } = makeCard();
    document.body.appendChild(raw);
    try {
      await card.updateComplete;

      card._notificationsEnabled = true;
      card._notificationTrigger = 'about_to_end';
      card._notificationLeadMinutes = 240;
      card._selected = ['automation.a'];
      card._customDuration = { days: 0, hours: 0, minutes: 30 };
      await card._snooze();

      expect(card._notificationsEnabled).toBe(false);
      expect(card._notificationTrigger).toBe('end');
      expect(card._notificationLeadMinutes).toBe(60);
    } finally {
      document.body.removeChild(raw);
    }
  });
});
