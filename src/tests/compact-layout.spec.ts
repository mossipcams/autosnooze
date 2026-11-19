import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../services/registry.js', () => ({
  fetchLabelRegistry: vi.fn().mockResolvedValue({}),
  fetchCategoryRegistry: vi.fn().mockResolvedValue({}),
  fetchEntityRegistry: vi.fn().mockResolvedValue([]),
}));

import { AutomationPauseCard } from '../components/autosnooze-card.js';
import { AutoSnoozeAutomationList } from '../components/autosnooze-automation-list.js';
import type { HomeAssistant } from '../types/hass.js';

const CARD_TAG = 'test-card-compact-layout';
const LIST_TAG = 'test-list-compact-layout';
if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, AutomationPauseCard);
if (!customElements.get(LIST_TAG)) customElements.define(LIST_TAG, AutoSnoozeAutomationList);

const hass = {
  states: {},
  entities: {},
  areas: {},
  locale: { language: 'en' },
  connection: { sendMessagePromise: async () => [] },
  callService: async () => undefined,
} as unknown as HomeAssistant;

type List = AutoSnoozeAutomationList & { shadowRoot: ShadowRoot };

async function mountList(setup: (el: AutoSnoozeAutomationList) => void = () => {}): Promise<List> {
  const el = document.createElement(LIST_TAG) as List;
  el.hass = hass;
  setup(el);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('compact layout', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('card header no longer carries the hide-snoozed toggle', async () => {
    const card = document.createElement(CARD_TAG) as AutomationPauseCard & { updateComplete: Promise<unknown> };
    card.hass = hass;
    card.config = { type: 'custom:autosnooze-card', title: 'AutoSnooze' };
    document.body.appendChild(card);
    await card.updateComplete;
    expect(card.shadowRoot?.querySelector('.header .hide-snoozed-toggle')).toBeNull();
  });

  test('grouping and hide-snoozed sit behind a View button next to search', async () => {
    const el = await mountList();
    const toggle = el.shadowRoot.querySelector<HTMLButtonElement>('.search-row .view-toggle')!;
    const panel = el.shadowRoot.querySelector<HTMLElement>('#view-panel')!;
    expect(toggle.getAttribute('aria-label')).toBe('View options');
    expect(toggle.getAttribute('aria-controls')).toBe('view-panel');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    expect(panel.querySelector('[role="tablist"]')).not.toBeNull();
    expect(panel.querySelector('.hide-snoozed-toggle')).not.toBeNull();
    expect(panel.contains(el.shadowRoot.querySelector('input[type="search"]'))).toBe(false);

    toggle.click();
    await el.updateComplete;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
  });

  test('View button signals a non-default view', async () => {
    const plain = await mountList();
    expect(plain.shadowRoot.querySelector('.view-toggle')?.classList.contains('active')).toBe(false);

    const hiding = await mountList((el) => { el.hideSnoozed = true; });
    expect(hiding.shadowRoot.querySelector('.view-toggle')?.classList.contains('active')).toBe(true);

    const grouped = await mountList();
    grouped.shadowRoot.querySelectorAll<HTMLButtonElement>('.tab')[1]!.click();
    await grouped.updateComplete;
    expect(grouped.shadowRoot.querySelector('.view-toggle')?.classList.contains('active')).toBe(true);
  });

  test('hide-snoozed toggle in the panel updates and persists through the card', async () => {
    const card = document.createElement(CARD_TAG) as AutomationPauseCard & { updateComplete: Promise<unknown> };
    card.hass = hass;
    card.config = { type: 'custom:autosnooze-card', title: 'AutoSnooze' };
    document.body.appendChild(card);
    await card.updateComplete;
    const list = card.shadowRoot!.querySelector('autosnooze-automation-list') as List;
    await list.updateComplete;

    const toggle = list.shadowRoot.querySelector<HTMLButtonElement>('.hide-snoozed-toggle')!;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(toggle.textContent?.trim()).toBe('Hide snoozed');
    toggle.click();
    await card.updateComplete;
    await list.updateComplete;
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('autosnooze_hide_snoozed')).toBe('true');
  });

  test('the chosen grouping is remembered', async () => {
    const first = await mountList();
    first.shadowRoot.querySelectorAll<HTMLButtonElement>('.tab')[1]!.click();
    document.body.innerHTML = '';

    const second = await mountList();
    expect(second._filterTab).toBe('areas');

    localStorage.setItem('autosnooze_filter_tab', '"bogus"');
    expect((await mountList())._filterTab).toBe('all');
  });
});
