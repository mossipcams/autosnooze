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
import { AutoSnoozeDurationSelector } from '../components/autosnooze-duration-selector.js';
import { runPauseFeature, validateScheduledPauseInput } from '../features/pause/index.js';
import type { HomeAssistant } from '../types/hass.js';

const CARD_TAG = 'test-card-schedule-start';
if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, AutomationPauseCard);
const SELECTOR_TAG = 'test-selector-schedule-start';
if (!customElements.get(SELECTOR_TAG)) customElements.define(SELECTOR_TAG, AutoSnoozeDurationSelector);

const hass = {
  states: {},
  entities: {},
  areas: {},
  locale: { language: 'en' },
  connection: { sendMessagePromise: async () => [] },
  callService: async () => undefined,
} as unknown as HomeAssistant;

type Card = HTMLElement & {
  hass: HomeAssistant;
  updateComplete: Promise<unknown>;
  _selected: string[];
  _scheduleMode: boolean;
  _disableAtDate: string;
  _disableAtTime: string;
  _resumeAtDate: string;
  _resumeAtTime: string;
  _snooze: () => Promise<void>;
  _showToast: (message: string, options?: unknown) => void;
};

async function mountCard(): Promise<Card> {
  const card = document.createElement(CARD_TAG) as Card;
  card.hass = hass;
  document.body.appendChild(card);
  await card.updateComplete;
  return card;
}

function selectorOf(card: Card): AutoSnoozeDurationSelector {
  return card.shadowRoot!.querySelector('autosnooze-duration-selector') as AutoSnoozeDurationSelector;
}

function pill(root: ShadowRoot | null | undefined, label: string): HTMLButtonElement {
  const found = [...(root?.querySelectorAll<HTMLButtonElement>('.duration-pills .pill') ?? [])]
    .find((b) => b.textContent?.trim() === label);
  if (!found) throw new Error(`pill ${label} not found`);
  return found;
}

async function enterDateTime(card: Card): Promise<void> {
  pill(selectorOf(card).shadowRoot, 'Date/Time').click();
  await card.updateComplete;
  await selectorOf(card).updateComplete;
}

describe('date/time snooze start and reset', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 3, 29, 12, 0, 0));
    pauseAutomations.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  test('validateScheduledPauseInput rejects a start time that is not in the future', () => {
    const nowMs = new Date(2026, 3, 29, 12, 0, 0).getTime();
    const resume = { resumeAtDate: '2026-04-29', resumeAtTime: '13:00', nowMs };

    expect(validateScheduledPauseInput({ ...resume, disableAtDate: '2026-04-29', disableAtTime: '11:50' }))
      .toEqual({ status: 'error', message: 'Snooze start time must be in the future' });
    expect(validateScheduledPauseInput({ ...resume, disableAtDate: '2026-04-29', disableAtTime: '12:00' }))
      .toEqual({ status: 'error', message: 'Snooze start time must be in the future' });
    expect(validateScheduledPauseInput({ ...resume, disableAtDate: '2026-04-29', disableAtTime: '12:01' }))
      .toEqual({ status: 'valid' });
  });

  test('runPauseFeature refuses a stale start time without calling the backend', async () => {
    const result = await runPauseFeature({
      hass,
      selected: ['automation.a'],
      scheduleMode: true,
      customDuration: { days: 0, hours: 0, minutes: 30 },
      disableAtDate: '2026-04-29',
      disableAtTime: '11:50',
      resumeAtDate: '2026-04-29',
      resumeAtTime: '13:00',
      nowMs: Date.now(),
    });

    expect(result).toEqual({ status: 'validation_error', toastMessage: 'Start time must be in the future' });
    expect(pauseAutomations).not.toHaveBeenCalled();
  });

  test('a Start later time that passed while the form was open is not submitted', async () => {
    const card = await mountCard();
    const toasts: string[] = [];
    card._showToast = (message: string) => { toasts.push(message); };
    card._selected = ['automation.a'];
    await enterDateTime(card);
    card._disableAtDate = '2026-04-29';
    card._disableAtTime = '11:50';
    await card.updateComplete;

    await card._snooze();

    expect(pauseAutomations).not.toHaveBeenCalled();
    expect(toasts).toEqual(['Start time must be in the future']);
  });

  test('a successful date/time snooze returns the picker to the duration pills', async () => {
    const card = await mountCard();
    card._showToast = () => {};
    card._selected = ['automation.a'];
    await enterDateTime(card);

    await card._snooze();
    await card.updateComplete;
    const selector = selectorOf(card);
    await selector.updateComplete;

    expect(pauseAutomations).toHaveBeenCalledTimes(1);
    expect(card._scheduleMode).toBe(false);
    expect(pill(selector.shadowRoot, 'Date/Time').getAttribute('aria-checked')).toBe('false');

    card._selected = ['automation.b'];
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector<HTMLButtonElement>('.snooze-btn')!.disabled).toBe(false);
  });
});
