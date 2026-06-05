// @ts-nocheck -- migrated from JS, type annotations deferred
/**
 * Stress Testing
 *
 * Tests for handling large numbers of automations efficiently.
 */

import '../src/index.js';
import { queryAutomationList } from './helpers/query-helpers.js';

describe('Stress Testing', () => {
  let mockHass;

  beforeEach(() => {
    const states = {
      'sensor.autosnooze_status': {
        state: 'idle',
        attributes: { paused_count: 0, scheduled_count: 0 },
      },
      'sensor.autosnooze_snoozed_automations': {
        state: '0',
        attributes: { paused_automations: {}, scheduled_snoozes: {} },
      },
    };

    // Create many automations
    for (let i = 0; i < 100; i++) {
      states[`automation.auto_${i}`] = {
        entity_id: `automation.auto_${i}`,
        state: i % 2 === 0 ? 'on' : 'off',
        attributes: { friendly_name: `Automation ${i}` },
      };
    }

    mockHass = createMockHass({ states });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders with 100 automations', async () => {
    const CardClass = customElements.get('autosnooze-card');
    const card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    const automations = card._getAutomations();
    expect(automations.length).toBe(100);
  });

  test('search filters 100 automations efficiently', async () => {
    const CardClass = customElements.get('autosnooze-card');
    const card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    queryAutomationList(card)._search = '50';
    await card.updateComplete;

    expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
  });

  test('selecting many automations works', async () => {
    const CardClass = customElements.get('autosnooze-card');
    const card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;

    const selected = [];
    for (let i = 0; i < 50; i++) {
      selected.push(`automation.auto_${i}`);
    }
    card._selected = selected;
    await card.updateComplete;

    expect(card._selected.length).toBe(50);
    expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
  });

  test('five_hundred_automation_fixture_has_bounded_rebuild_count', () => {
    const ListClass = customElements.get('autosnooze-automation-list');
    const list = new ListClass();
    list.automations = Array.from({ length: 500 }, (_, index) => ({
      id: `automation.stress_${index}`,
      name: `Stress ${index}`,
      area_id: null,
      category_id: null,
      labels: [],
    }));
    list.hass = createMockHass();

    list._search = '25';
    const searched = list._getViewModel();
    const repeatedSearch = list._getViewModel();
    list.selected = ['automation.stress_25'];
    const afterSelection = list._getViewModel();

    expect(repeatedSearch).toBe(searched);
    expect(afterSelection).toBe(searched);
    expect(searched.filtered.length).toBeLessThanOrEqual(15);
  });
});
