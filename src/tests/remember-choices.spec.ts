import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { runPauseFeature } = vi.hoisted(() => ({ runPauseFeature: vi.fn() }));

vi.mock('../services/registry.js', () => ({
  fetchLabelRegistry: vi.fn().mockResolvedValue({}),
  fetchCategoryRegistry: vi.fn().mockResolvedValue({}),
  fetchEntityRegistry: vi.fn().mockResolvedValue([]),
}));

vi.mock('../features/pause/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/pause/index.js')>();
  return { ...actual, runPauseFeature };
});

import { AutomationPauseCard } from '../components/autosnooze-card.js';
import { saveLastDuration } from '../services/storage.js';
import {
  loadNotificationPreference,
  saveNotificationPreference,
} from '../services/preferences.js';
import type { HomeAssistant } from '../types/hass.js';

const TAG = 'test-card-remember-choices';
if (!customElements.get(TAG)) customElements.define(TAG, AutomationPauseCard);

type Card = HTMLElement & {
  hass: HomeAssistant;
  updateComplete: Promise<unknown>;
  shadowRoot: ShadowRoot;
  _selected: string[];
  _customDuration: { days: number; hours: number; minutes: number };
  _customDurationInput: string;
  _duration: number;
  _notificationsEnabled: boolean;
  _notificationTrigger: string;
  _notificationLeadMinutes: number;
  _snooze: () => Promise<void>;
};

async function mountCard(): Promise<Card> {
  const card = document.createElement(TAG) as Card;
  card.hass = {
    states: {},
    entities: {},
    areas: {},
    locale: { language: 'en' },
    connection: { sendMessagePromise: async () => [] },
    callService: async () => undefined,
  } as unknown as HomeAssistant;
  document.body.appendChild(card);
  await card.updateComplete;
  return card;
}

async function change(card: Card, selector: string, apply: (el: HTMLInputElement & HTMLSelectElement) => void) {
  const el = card.shadowRoot.querySelector(selector) as HTMLInputElement & HTMLSelectElement;
  apply(el);
  el.dispatchEvent(new Event('change'));
  await card.updateComplete;
}

describe('remembering frequent choices', () => {
  beforeEach(() => {
    localStorage.clear();
    runPauseFeature.mockReset().mockResolvedValue({ status: 'submitted', toastMessage: 'Snoozed' });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('restores a reasonable last duration as the initial selection', async () => {
    saveLastDuration({ days: 0, hours: 1, minutes: 0 }, 60);
    const card = await mountCard();
    expect(card._customDuration).toEqual({ days: 0, hours: 1, minutes: 0 });
    expect(card._customDurationInput).toBe('1h');
    expect(card._duration).toBe(60 * 60_000);
  });

  test('restores a 24h last duration but not anything longer', async () => {
    saveLastDuration({ days: 1, hours: 0, minutes: 0 }, 1440);
    expect((await mountCard())._customDuration).toEqual({ days: 1, hours: 0, minutes: 0 });
    document.body.innerHTML = '';

    saveLastDuration({ days: 3, hours: 0, minutes: 0 }, 4320);
    const card = await mountCard();
    expect(card._customDuration).toEqual({ days: 0, hours: 0, minutes: 30 });
    expect(card.shadowRoot.querySelector('autosnooze-duration-selector')).not.toBeNull();
  });

  test('does not overwrite a choice made before the card reconnects', async () => {
    saveLastDuration({ days: 0, hours: 1, minutes: 0 }, 60);
    const card = await mountCard();
    card._customDuration = { days: 0, hours: 2, minutes: 0 };
    card.remove();
    document.body.appendChild(card);
    await card.updateComplete;
    expect(card._customDuration).toEqual({ days: 0, hours: 2, minutes: 0 });
  });

  test('notification preference round-trips, validates, and clears', () => {
    expect(loadNotificationPreference()).toBeNull();
    saveNotificationPreference({ trigger: 'about_to_end', leadMinutes: 120 });
    expect(loadNotificationPreference()).toEqual({ trigger: 'about_to_end', leadMinutes: 120 });
    saveNotificationPreference(null);
    expect(loadNotificationPreference()).toBeNull();

    localStorage.setItem('autosnooze_notification_preference', '{"trigger":"none","leadMinutes":60}');
    expect(loadNotificationPreference()).toBeNull();
    localStorage.setItem('autosnooze_notification_preference', '{"trigger":"end","leadMinutes":7}');
    expect(loadNotificationPreference()).toBeNull();
    localStorage.setItem('autosnooze_notification_preference', 'not json');
    expect(loadNotificationPreference()).toBeNull();
  });

  test('explicitly enabled notifications persist across snoozes and remounts', async () => {
    const card = await mountCard();
    await change(card, '.notify-toggle input', (el) => { el.checked = true; });
    await change(card, '.notify-detail select', (el) => { el.value = 'about_to_end'; });
    await change(card, '.notify-detail .notify-field:nth-of-type(2) select', (el) => { el.value = '120'; });

    card._selected = ['automation.a'];
    await card._snooze();
    expect(card._notificationsEnabled).toBe(true);
    expect(card._notificationTrigger).toBe('about_to_end');
    expect(card._notificationLeadMinutes).toBe(120);

    document.body.innerHTML = '';
    const remounted = await mountCard();
    expect(remounted._notificationsEnabled).toBe(true);
    expect(remounted._notificationTrigger).toBe('about_to_end');
    expect(remounted._notificationLeadMinutes).toBe(120);
  });

  test('turning notifications off forgets the preference', async () => {
    saveNotificationPreference({ trigger: 'start', leadMinutes: 60 });
    const card = await mountCard();
    expect(card._notificationsEnabled).toBe(true);
    await change(card, '.notify-toggle input', (el) => { el.checked = false; });
    expect(loadNotificationPreference()).toBeNull();

    document.body.innerHTML = '';
    expect((await mountCard())._notificationsEnabled).toBe(false);
  });
});
