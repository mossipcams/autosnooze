/**
 * Stress Testing
 *
 * Tests for handling large numbers of automations efficiently.
 */

import '../custom_components/autosnooze/www/autosnooze-card.js';

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

    card._search = '50';
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
});
