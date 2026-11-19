import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { HomeAssistant } from '../types/hass.js';
import { automationListStyles } from '../styles/automation-list.styles.js';

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

type TestList = HTMLElement & { updateComplete: Promise<boolean> };

async function listOf(card: TestCard): Promise<{ list: TestList; root: ShadowRoot }> {
  const list = card.shadowRoot!.querySelector('autosnooze-automation-list') as TestList;
  await list.updateComplete;
  return { list, root: list.shadowRoot! };
}

describe('Hide snoozed toggle in the View panel', () => {
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

  test('renders hide-snoozed toggle with the grouping tabs in the View panel, not the header', async () => {
    const card = await connectCard();
    const header = card.shadowRoot!.querySelector('.header')!;
    expect(header.querySelector('.hide-snoozed-toggle')).toBeNull();

    const { list, root } = await listOf(card);
    const ordered = Array.from(
      card.shadowRoot!.querySelector('ha-card')!.querySelectorAll('.header, autosnooze-automation-list')
    );
    expect(ordered[0]).toBe(header);
    expect(ordered[1]).toBe(list);

    const panel = root.querySelector('#view-panel')!;
    expect(panel.querySelector('.hide-snoozed-toggle')).not.toBeNull();
    expect(panel.querySelector('.filter-tabs')).not.toBeNull();
    expect(panel.querySelector('[role="tablist"]')).not.toBeNull();
    expect(panel.lastElementChild).toBe(panel.querySelector('.hide-snoozed-toggle'));
  });

  test('clicking the toggle sets aria-pressed and persists preference', async () => {
    const card = await connectCard();
    const { list, root } = await listOf(card);
    const toggle = root.querySelector<HTMLButtonElement>('.hide-snoozed-toggle')!;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    toggle.click();
    await card.updateComplete;
    await list.updateComplete;

    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('autosnooze_hide_snoozed')).toBe('true');
  });

  test('loads persisted hide snoozed preference on connect', async () => {
    localStorage.setItem('autosnooze_hide_snoozed', 'true');
    const card = await connectCard();
    const { root } = await listOf(card);
    expect(root.querySelector('.hide-snoozed-toggle')?.getAttribute('aria-pressed')).toBe('true');
  });

  test('hide-snoozed toggle styles keep a 44px touch target', () => {
    const cssText = automationListStyles.cssText;
    const match = cssText.match(/\.hide-snoozed-toggle\s*\{[^}]*\}/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain('min-height: 44px');
    expect(match![0]).toContain('display: inline-flex');
  });
});
