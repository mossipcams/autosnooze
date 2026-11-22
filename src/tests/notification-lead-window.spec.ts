import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { pauseAutomations } = vi.hoisted(() => ({ pauseAutomations: vi.fn() }));

vi.mock('../services/registry.js', () => ({
  fetchLabelRegistry: vi.fn().mockResolvedValue({}),
  fetchCategoryRegistry: vi.fn().mockResolvedValue({}),
  fetchEntityRegistry: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/snooze.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/snooze.js')>();
  return { ...actual, pauseAutomations };
});

import { AutomationPauseCard } from '../components/autosnooze-card.js';
import { runPauseFeature } from '../features/pause/index.js';
import { saveNotificationPreference } from '../services/preferences.js';
import type { HomeAssistant } from '../types/hass.js';

const CARD_TAG = 'test-card-notification-lead-window';
if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, AutomationPauseCard);

const LEAD_TOO_LONG = 'The "How long before?" time is longer than the snooze';

const hass = {
  states: {},
  entities: {},
  areas: {},
  locale: { language: 'en' },
  connection: { sendMessagePromise: async () => [] },
  callService: async () => undefined,
} as unknown as HomeAssistant;

const base = {
  hass,
  selected: ['automation.a'],
  scheduleMode: false,
  customDuration: { days: 0, hours: 0, minutes: 30 },
  disableAtDate: '',
  disableAtTime: '',
  resumeAtDate: '',
  resumeAtTime: '',
};

describe('about-to-end lead must fit within the snooze', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 3, 29, 5, 0, 0));
    pauseAutomations.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    localStorage.clear();
  });

  test('a duration shorter than the lead is refused without calling the backend', async () => {
    const result = await runPauseFeature({
      ...base,
      notificationTrigger: 'about_to_end',
      notificationLeadMinutes: 60,
      nowMs: Date.now(),
    });

    expect(result).toEqual({ status: 'validation_error', toastMessage: LEAD_TOO_LONG });
    expect(pauseAutomations).not.toHaveBeenCalled();
  });

  test('a duration equal to the lead is allowed, matching the backend', async () => {
    const result = await runPauseFeature({
      ...base,
      customDuration: { days: 0, hours: 1, minutes: 0 },
      notificationTrigger: 'about_to_end',
      notificationLeadMinutes: 60,
      nowMs: Date.now(),
    });

    expect(result.status).toBe('submitted');
    expect(pauseAutomations).toHaveBeenCalledTimes(1);
  });

  test('other triggers ignore the lead', async () => {
    const result = await runPauseFeature({
      ...base,
      notificationTrigger: 'end',
      notificationLeadMinutes: 240,
      nowMs: Date.now(),
    });

    expect(result.status).toBe('submitted');
  });

  test('Tomorrow is measured from now until the morning resume', async () => {
    const early = await runPauseFeature({
      ...base,
      untilTomorrow: true,
      notificationTrigger: 'about_to_end',
      notificationLeadMinutes: 240,
      nowMs: new Date(2026, 3, 30, 5, 0, 0).getTime(),
    });
    expect(early).toEqual({ status: 'validation_error', toastMessage: LEAD_TOO_LONG });

    const withRoom = await runPauseFeature({
      ...base,
      untilTomorrow: true,
      notificationTrigger: 'about_to_end',
      notificationLeadMinutes: 240,
      nowMs: Date.now(),
    });
    expect(withRoom.status).toBe('submitted');
  });

  test('a scheduled snooze is measured from its start time', async () => {
    const result = await runPauseFeature({
      ...base,
      scheduleMode: true,
      disableAtDate: '2026-04-29',
      disableAtTime: '06:30',
      resumeAtDate: '2026-04-29',
      resumeAtTime: '07:00',
      notificationTrigger: 'about_to_end',
      notificationLeadMinutes: 60,
      nowMs: Date.now(),
    });

    expect(result).toEqual({ status: 'validation_error', toastMessage: LEAD_TOO_LONG });
  });

  test('a remembered lead longer than the chosen pill shows the toast instead of failing in the backend', async () => {
    saveNotificationPreference({ trigger: 'about_to_end', leadMinutes: 60 });
    const card = document.createElement(CARD_TAG) as HTMLElement & {
      hass: HomeAssistant;
      updateComplete: Promise<unknown>;
      _selected: string[];
      _snooze: () => Promise<void>;
      _showToast: (message: string) => void;
    };
    card.hass = hass;
    document.body.appendChild(card);
    await card.updateComplete;
    const toasts: string[] = [];
    card._showToast = (message: string) => { toasts.push(message); };
    card._selected = ['automation.a'];

    await card._snooze();

    expect(pauseAutomations).not.toHaveBeenCalled();
    expect(toasts).toEqual([LEAD_TOO_LONG]);
  });
});
