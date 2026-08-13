import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { HomeAssistant } from '../types/hass.js';
import { cardStyles } from '../styles/card.styles.js';

await import('../components/autosnooze-automation-list.js');
const cardModule = await import('../components/autosnooze-card.js');

const TEST_TAG = 'test-hide-snoozed-header';

if (!customElements.get(TEST_TAG)) {
  customElements.define(TEST_TAG, cardModule.AutomationPauseCard);
}

const SENSOR_ID = 'sensor.autosnooze_snoozed_automations';

type TestCard = HTMLElement & {
  hass: HomeAssistant;
  config: { type: string; title: string };
  updateComplete: Promise<boolean>;
};

function createHass(): HomeAssistant {
  return {
    locale: { language: 'en-US' },
    states: {
      [SENSOR_ID]: {
        entity_id: SENSOR_ID,
        state: '0',
        attributes: { schema_version: 1, paused: {}, scheduled: {} },
      },
      'automation.kitchen_lights': {
        entity_id: 'automation.kitchen_lights',
        state: 'on',
        attributes: { friendly_name: 'Kitchen Lights' },
      },
      'automation.office_fan': {
        entity_id: 'automation.office_fan',
        state: 'off',
        attributes: { friendly_name: 'Office Fan' },
      },
    },
    entities: {
      'automation.kitchen_lights': {
        entity_id: 'automation.kitchen_lights',
        area_id: 'kitchen',
        labels: [],
        categories: {},
      },
      'automation.office_fan': {
        entity_id: 'automation.office_fan',
        area_id: 'office',
        labels: [],
        categories: {},
      },
    },
    areas: {
      kitchen: { name: 'Kitchen' },
      office: { name: 'Office' },
    },
    connection: {
      sendMessagePromise: async <T>(message: { type: string }) => {
        if (message.type === 'config/label_registry/list') {
          return [] as T;
        }
        if (message.type === 'config/category_registry/list') {
          return [] as T;
        }
        if (message.type === 'config/entity_registry/list') {
          return [
            { entity_id: 'automation.kitchen_lights' },
            { entity_id: 'automation.office_fan' },
          ] as T;
        }
        return [] as T;
      },
    },
    callService: async () => undefined,
  } as unknown as HomeAssistant;
}

async function connectCard(): Promise<TestCard> {
  const card = document.createElement(TEST_TAG) as TestCard;
  card.hass = createHass();
  card.config = { type: 'custom:autosnooze-card', title: 'AutoSnooze' };
  document.body.appendChild(card);
  await card.updateComplete;
  return card;
}

describe('Hide snoozed toggle in card header', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    vi.restoreAllMocks();
  });

  test('renders hide-snoozed toggle in header above automation list', async () => {
    const card = await connectCard();
    const headerToggle = card.shadowRoot!.querySelector('.header .hide-snoozed-toggle');
    expect(headerToggle).not.toBeNull();

    const header = card.shadowRoot!.querySelector('.header')!;
    expect(header.contains(headerToggle!)).toBe(true);
    expect(header.lastElementChild).toBe(headerToggle);

    const list = card.shadowRoot!.querySelector('autosnooze-automation-list')! as HTMLElement & {
      updateComplete: Promise<boolean>;
    };
    await list.updateComplete;
    const ordered = Array.from(
      card.shadowRoot!.querySelector('ha-card')!.querySelectorAll('.header, autosnooze-automation-list')
    );
    expect(ordered[0]).toBe(header);
    expect(ordered[1]).toBe(list);

    const listShadow = list.shadowRoot!;
    expect(listShadow.querySelector('.hide-snoozed-toggle')).toBeNull();
    expect(listShadow.querySelector('.filter-tabs')).not.toBeNull();
    expect(listShadow.querySelector('[role="tablist"]')).not.toBeNull();
  });

  test('clicking header toggle sets aria-pressed and persists preference', async () => {
    const card = await connectCard();
    const toggle = card.shadowRoot!.querySelector<HTMLButtonElement>('.header .hide-snoozed-toggle')!;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    toggle.click();
    await card.updateComplete;

    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('autosnooze_hide_snoozed')).toBe('true');
  });

  test('loads persisted hide snoozed preference on connect', async () => {
    localStorage.setItem('autosnooze_hide_snoozed', 'true');
    const card = await connectCard();
    const toggle = card.shadowRoot!.querySelector('.header .hide-snoozed-toggle');
    expect(toggle?.getAttribute('aria-pressed')).toBe('true');
  });

  test('hide-snoozed toggle styles pin it to the far right of the header', () => {
    const cssText = cardStyles.cssText;
    expect(cssText).toContain('.hide-snoozed-toggle');
    const match = cssText.match(/\.hide-snoozed-toggle\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain('margin-left: auto');
    expect(match![0]).toContain('flex-shrink: 0');
  });
});
