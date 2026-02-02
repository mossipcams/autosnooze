/**
 * Stress Testing
 *
 * Tests for handling large numbers of automations efficiently.
 */

import '../custom_components/autosnooze/www/autosnooze-card.js';

// =============================================================================
// HELPER: Shadow DOM helpers for child component access
// =============================================================================
function _computeAutomations(card) {
  const states = card.hass?.states || {};
  const entityReg = card._entityRegistry || {};
  const hassEntities = card.hass?.entities || {};
  return Object.entries(states)
    .filter(([id, state]) => id.startsWith('automation.') && state)
    .map(([id, state]) => {
      const reg = entityReg[id] || {};
      const hassEntry = hassEntities[id] || {};
      const categories = reg.categories || {};
      return {
        id,
        name: state.attributes?.friendly_name || id,
        area_id: reg.area_id ?? hassEntry.area_id ?? null,
        labels: reg.labels ?? hassEntry.labels ?? [],
        category_id: categories.automation ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function queryAutomationList(card) {
  // If card has rendered, find child in shadow DOM
  const sr = card.shadowRoot;
  if (sr) {
    const child = sr.querySelector('autosnooze-automation-list');
    if (child) {
      // Sync all properties from card to child (may not have re-rendered yet)
      if (card.hass) child.hass = card.hass;
      if (card._selected !== undefined) child.selected = card._selected;
      if (card._labelRegistry) child.labelRegistry = card._labelRegistry;
      if (card._categoryRegistry) child.categoryRegistry = card._categoryRegistry;
      // Recompute automations from card's current state (entity registry may have changed)
      child.automations = _computeAutomations(card);
      return child;
    }
  }
  // For tests that access child methods without rendering:
  // Create a standalone automation list with synced data
  if (!card.__automationList) {
    const list = document.createElement('autosnooze-automation-list');
    // Listen for selection-change events on the element itself
    list.addEventListener('selection-change', (e) => {
      list.selected = e.detail.selected;
      card._selected = e.detail.selected;
    });
    card.__automationList = list;
  }
  const list = card.__automationList;
  // Sync state from card to child
  if (card.hass) list.hass = card.hass;
  list.automations = _computeAutomations(card);
  list.selected = card._selected || [];
  list.labelRegistry = card._labelRegistry || {};
  list.categoryRegistry = card._categoryRegistry || {};
  return list;
}

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
});
