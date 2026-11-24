import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../services/registry.js', () => ({
  fetchLabelRegistry: vi.fn().mockResolvedValue({}),
  fetchCategoryRegistry: vi.fn().mockResolvedValue({}),
  fetchEntityRegistry: vi.fn().mockResolvedValue([]),
}));

import { AutomationPauseCard } from '../components/autosnooze-card.js';
import { AutoSnoozeDurationSelector } from '../components/autosnooze-duration-selector.js';
import { saveNotificationPreference } from '../services/preferences.js';
import type { HomeAssistant } from '../types/hass.js';

const CARD_TAG = 'test-card-select-display';
const SELECTOR_TAG = 'test-selector-select-display';
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

type Card = HTMLElement & { hass: HomeAssistant; updateComplete: Promise<unknown> };

async function mountCard(): Promise<Card> {
  const card = document.createElement(CARD_TAG) as Card;
  card.hass = hass;
  document.body.appendChild(card);
  await card.updateComplete;
  return card;
}

function leadSelect(card: Card): HTMLSelectElement {
  return card.shadowRoot!.querySelectorAll<HTMLSelectElement>('.notify-detail select')[1]!;
}

describe('dropdowns display the value the card will use', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 3, 29, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    localStorage.clear();
  });

  test('a remembered lead time is shown in the lead dropdown', async () => {
    saveNotificationPreference({ trigger: 'about_to_end', leadMinutes: 120 });
    const card = await mountCard();

    expect(leadSelect(card).value).toBe('120');
  });

  test('choosing "Before snooze ends" shows the default lead it will use', async () => {
    const card = await mountCard();
    const toggle = card.shadowRoot!.querySelector<HTMLInputElement>('.notify-toggle input')!;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    await card.updateComplete;
    const when = card.shadowRoot!.querySelector<HTMLSelectElement>('.notify-detail select')!;
    when.value = 'about_to_end';
    when.dispatchEvent(new Event('change'));
    await card.updateComplete;

    expect(leadSelect(card).value).toBe('60');
  });

  test('date/time dropdowns show the resume and start dates they hold', async () => {
    const el = document.createElement(SELECTOR_TAG) as AutoSnoozeDurationSelector;
    el.hass = hass;
    el.scheduleMode = true;
    el.resumeAtDate = '2026-04-30';
    el.resumeAtTime = '09:00';
    el.disableAtDate = '2026-04-29';
    el.disableAtTime = '12:30';
    document.body.appendChild(el);
    await el.updateComplete;

    const selects = [...el.shadowRoot!.querySelectorAll<HTMLSelectElement>('.schedule-inputs select')];
    expect(selects.map((s) => s.value)).toEqual(['2026-04-30', '2026-04-29']);
  });
});
