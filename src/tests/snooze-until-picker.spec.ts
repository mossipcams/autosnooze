import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { runPauseFeature, runUndoFeature } = vi.hoisted(() => ({
  runPauseFeature: vi.fn(),
  runUndoFeature: vi.fn(),
}));

vi.mock('../services/registry.js', () => ({
  fetchLabelRegistry: vi.fn().mockResolvedValue({}),
  fetchCategoryRegistry: vi.fn().mockResolvedValue({}),
  fetchEntityRegistry: vi.fn().mockResolvedValue([]),
}));

vi.mock('../features/pause/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/pause/index.js')>();
  return { ...actual, runPauseFeature };
});

vi.mock('../features/resume/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../features/resume/index.js')>();
  return { ...actual, runUndoFeature };
});

import { AutomationPauseCard } from '../components/autosnooze-card.js';
import { AutoSnoozeDurationSelector } from '../components/autosnooze-duration-selector.js';
import { createScheduleModeState } from '../features/card-shell/index.js';
import type { HomeAssistant } from '../types/hass.js';

const CARD_TAG = 'test-card-snooze-until';
const SELECTOR_TAG = 'test-selector-snooze-until';
if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, AutomationPauseCard);
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
  _showCustomInput: boolean;
  _untilTomorrow: boolean;
  _disableAtDate: string;
  _disableAtTime: string;
  _resumeAtDate: string;
  _resumeAtTime: string;
  _snooze: () => Promise<void>;
};

async function mountCard(): Promise<Card> {
  const card = document.createElement(CARD_TAG) as Card;
  card.hass = hass;
  document.body.appendChild(card);
  await card.updateComplete;
  return card;
}

async function mountSelector(setup: (el: AutoSnoozeDurationSelector) => void = () => {}) {
  const el = document.createElement(SELECTOR_TAG) as AutoSnoozeDurationSelector;
  el.hass = hass;
  setup(el);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
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

describe('unified Snooze until picker', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 3, 29, 12, 0, 0));
    runPauseFeature.mockReset().mockResolvedValue({ status: 'submitted', toastMessage: 'Snoozed' });
    runUndoFeature.mockReset().mockResolvedValue({ succeeded: ['automation.a'], failed: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  test('entering date/time does not prefill a start time, so the snooze is immediate', () => {
    const state = createScheduleModeState({ enabled: true, now: new Date(), resumeMinutes: 45 });
    expect(state.disableAtDate).toBe('');
    expect(state.disableAtTime).toBe('');
    expect(state.resumeAtDate).toBe('2026-04-29');
    expect(state.resumeAtTime).toBe('12:45');
  });

  test('date/time is a pill in the same radiogroup and the pills stay visible', async () => {
    const el = await mountSelector((s) => { s.scheduleMode = true; });
    const dateTime = pill(el.shadowRoot, 'Date/Time');
    expect(dateTime.getAttribute('role')).toBe('radio');
    expect(dateTime.getAttribute('aria-checked')).toBe('true');
    expect(pill(el.shadowRoot, '30m').getAttribute('aria-checked')).toBe('false');
    expect(el.shadowRoot?.querySelector('.schedule-link')).toBeNull();
    expect(el.shadowRoot?.querySelector('.duration-section-header')?.textContent?.trim()).toBe('Snooze until');
  });

  test('the last-used duration is a choice in the Snooze until group, after the presets', async () => {
    const last = { minutes: 120, duration: { days: 0, hours: 2, minutes: 0 }, timestamp: Date.now() };
    const el = await mountSelector((s) => {
      s.lastDuration = last;
      s.customDuration = { days: 0, hours: 2, minutes: 0 };
    });
    const group = el.shadowRoot!.querySelector('[role="radiogroup"]')!;
    const badge = group.querySelector('.last-duration-badge')!;
    expect(badge).not.toBeNull();
    expect(badge.getAttribute('role')).toBe('radio');
    expect(badge.getAttribute('aria-checked')).toBe('true');
    expect(badge.previousElementSibling?.textContent?.trim()).toBe('1h');
    expect(pill(el.shadowRoot, '30m').getAttribute('aria-checked')).toBe('false');

    el.customDuration = { days: 0, hours: 0, minutes: 30 };
    await el.updateComplete;
    expect(badge.getAttribute('aria-checked')).toBe('false');
  });

  test('date/time pill fires schedule-mode-change enabled', async () => {
    const el = await mountSelector();
    const events: CustomEvent[] = [];
    el.addEventListener('schedule-mode-change', (e) => events.push(e as CustomEvent));
    pill(el.shadowRoot, 'Date/Time').click();
    expect(events.map((e) => e.detail)).toEqual([{ enabled: true }]);
  });

  test('start time fields stay hidden until Start later is chosen', async () => {
    const el = await mountSelector((s) => {
      s.scheduleMode = true;
      s.resumeAtDate = '2026-04-29';
      s.resumeAtTime = '13:00';
    });
    expect(el.shadowRoot?.querySelector('#snooze-at-label')).toBeNull();
    expect(el.shadowRoot?.querySelectorAll('select')).toHaveLength(1);

    const events: CustomEvent[] = [];
    el.addEventListener('schedule-field-change', (e) => events.push(e as CustomEvent));
    (el.shadowRoot?.querySelector('.start-later-toggle') as HTMLButtonElement).click();
    expect(events.map((e) => e.detail)).toEqual([
      { field: 'disableAtDate', value: '2026-04-29' },
      { field: 'disableAtTime', value: '12:05' },
    ]);
  });

  test('a set start time shows the fields and Start now clears them', async () => {
    const el = await mountSelector((s) => {
      s.scheduleMode = true;
      s.disableAtDate = '2026-04-29';
      s.disableAtTime = '12:30';
      s.resumeAtDate = '2026-04-29';
      s.resumeAtTime = '13:00';
    });
    expect(el.shadowRoot?.querySelector('#snooze-at-label')).not.toBeNull();

    const events: CustomEvent[] = [];
    el.addEventListener('schedule-field-change', (e) => events.push(e as CustomEvent));
    (el.shadowRoot?.querySelector('.start-later-toggle') as HTMLButtonElement).click();
    expect(events.map((e) => e.detail)).toEqual([
      { field: 'disableAtDate', value: '' },
      { field: 'disableAtTime', value: '' },
    ]);
  });

  test('picking any other option leaves date/time mode and clears its fields', async () => {
    const card = await mountCard();
    const click = async (label: string) => {
      pill(selectorOf(card).shadowRoot, label).click();
      await card.updateComplete;
      await selectorOf(card).updateComplete;
    };

    await click('Date/Time');
    expect(card._scheduleMode).toBe(true);

    await click('1h');
    expect(card._scheduleMode).toBe(false);
    expect(card._resumeAtDate).toBe('');
    expect(card._resumeAtTime).toBe('');

    await click('Date/Time');
    await click('Tomorrow');
    expect(card._scheduleMode).toBe(false);
    expect(card._untilTomorrow).toBe(true);

    await click('Date/Time');
    expect(card._untilTomorrow).toBe(false);
    await click('Custom');
    expect(card._scheduleMode).toBe(false);
    expect(card._showCustomInput).toBe(true);

    await click('Date/Time');
    expect(card._showCustomInput).toBe(false);
  });

  test('immediate date/time snooze says Snooze and undo wakes instead of cancelling a schedule', async () => {
    const card = await mountCard();
    card._selected = ['automation.a'];
    pill(selectorOf(card).shadowRoot, 'Date/Time').click();
    await card.updateComplete;
    expect(card.shadowRoot?.querySelector('.snooze-btn')?.textContent?.trim()).toBe('Snooze (1)');

    card._disableAtDate = '2026-04-29';
    card._disableAtTime = '12:30';
    await card.updateComplete;
    expect(card.shadowRoot?.querySelector('.snooze-btn')?.textContent?.trim()).toBe('Schedule (1)');

    card._disableAtDate = '';
    card._disableAtTime = '';
    await card._snooze();
    (card.shadowRoot?.querySelector('autosnooze-toast .toast-undo-btn') as HTMLButtonElement).click();
    expect(runUndoFeature).toHaveBeenCalledWith(hass, ['automation.a'], {
      wasScheduleMode: true,
      hadDisableAt: false,
    });
  });
});
