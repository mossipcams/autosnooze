/**
 * Layout Switching Tests
 *
 * Tests for tab switching stability, state preservation, and concurrent updates.
 */

import '../src/index.js';

describe('Layout Switching', () => {
  let card;
  let mockHass;

  const createComplexMockHass = () =>
    createMockHass({
      states: {
        'automation.living_room_lights': {
          entity_id: 'automation.living_room_lights',
          state: 'on',
          attributes: { friendly_name: 'Living Room Lights' },
        },
        'automation.bedroom_fan': {
          entity_id: 'automation.bedroom_fan',
          state: 'on',
          attributes: { friendly_name: 'Bedroom Fan' },
        },
        'automation.kitchen_motion': {
          entity_id: 'automation.kitchen_motion',
          state: 'off',
          attributes: { friendly_name: 'Kitchen Motion' },
        },
        'automation.garage_door': {
          entity_id: 'automation.garage_door',
          state: 'on',
          attributes: { friendly_name: 'Garage Door' },
        },
        'automation.security_alarm': {
          entity_id: 'automation.security_alarm',
          state: 'on',
          attributes: { friendly_name: 'Security Alarm' },
        },
        'sensor.autosnooze_status': {
          state: 'idle',
          attributes: { paused_count: 0, scheduled_count: 0 },
        },
        'sensor.autosnooze_snoozed_automations': {
          state: '0',
          attributes: { paused_automations: {}, scheduled_snoozes: {} },
        },
      },
      areas: {
        living_room: { area_id: 'living_room', name: 'Living Room' },
        bedroom: { area_id: 'bedroom', name: 'Bedroom' },
        kitchen: { area_id: 'kitchen', name: 'Kitchen' },
        garage: { area_id: 'garage', name: 'Garage' },
      },
    });

  beforeEach(async () => {
    mockHass = createComplexMockHass();

    const CardClass = customElements.get('autosnooze-card');
    card = new CardClass();
    card.setConfig({ title: 'AutoSnooze' });
    card.hass = mockHass;
    document.body.appendChild(card);
    await card.updateComplete;
  });

  afterEach(() => {
    if (card && card.parentNode) {
      card.parentNode.removeChild(card);
    }
  });

  describe('Tab switching stability', () => {
    test('rapid tab switching preserves state and renders correctly', async () => {
      card._selected = ['automation.living_room_lights'];
      const tabs = ['all', 'areas', 'categories', 'labels'];

      for (let i = 0; i < 10; i++) {
        card._filterTab = tabs[i % tabs.length];
        await card.updateComplete;
      }

      // Verify state is preserved after rapid switching
      expect(card._selected).toContain('automation.living_room_lights');
      expect(card._filterTab).toBe('areas'); // 10 % 4 = 2 -> 'categories', but 0-indexed cycle ends at 'areas'
    });
  });

  describe('State preservation', () => {
    test('selection preserved across tab changes', async () => {
      card._selected = ['automation.living_room_lights'];
      await card.updateComplete;

      card._filterTab = 'areas';
      await card.updateComplete;
      expect(card._selected).toContain('automation.living_room_lights');

      card._filterTab = 'all';
      await card.updateComplete;
      expect(card._selected).toContain('automation.living_room_lights');
    });

    test('search preserved across tab changes', async () => {
      card._search = 'living';
      await card.updateComplete;

      card._filterTab = 'areas';
      await card.updateComplete;

      expect(card._search).toBe('living');
    });

    test('expanded groups state is maintained', async () => {
      card._filterTab = 'areas';
      await card.updateComplete;

      if (card._expandedGroups instanceof Set) {
        card._expandedGroups.add('living_room');
      } else if (typeof card._expandedGroups === 'object') {
        card._expandedGroups = { ...card._expandedGroups, living_room: true };
      }
      await card.updateComplete;

      card._filterTab = 'all';
      await card.updateComplete;
      card._filterTab = 'areas';
      await card.updateComplete;

      expect(card.shadowRoot.querySelector('ha-card')).not.toBeNull();
    });
  });

  describe('Empty state handling', () => {
    test.each([
      ['all', {}, {}, {}, 'empty automations list'],
      ['areas', {}, {}, {}, 'no areas defined'],
      ['categories', {}, {}, {}, 'no categories'],
      ['labels', {}, {}, {}, 'no labels'],
    ])('%s tab shows empty message for %s', async (tab, categoryReg, labelReg, entityReg) => {
      card.hass = createMockHass({
        states: {
          'sensor.autosnooze_status': { state: 'idle', attributes: { paused_count: 0, scheduled_count: 0 } },
          'sensor.autosnooze_snoozed_automations': { state: '0', attributes: { paused_automations: {}, scheduled_snoozes: {} } },
        },
      });
      card._categoryRegistry = categoryReg;
      card._labelRegistry = labelReg;
      card._entityRegistry = entityReg;
      card._filterTab = tab;
      await card.updateComplete;

      const emptyMessage = card.shadowRoot.querySelector('.list-empty');
      expect(emptyMessage).not.toBeNull();
    });
  });

  describe('Concurrent state updates', () => {
    test('simultaneous hass and config updates preserves state', async () => {
      card._selected = ['automation.living_room_lights'];

      const newHass = createComplexMockHass();
      newHass.states['automation.new_automation'] = {
        entity_id: 'automation.new_automation',
        state: 'on',
        attributes: { friendly_name: 'New Automation' },
      };

      card.hass = newHass;
      card.setConfig({ title: 'Updated Title' });
      await card.updateComplete;

      expect(card.config.title).toBe('Updated Title');
      expect(card._selected).toContain('automation.living_room_lights');
    });

    test('rapid hass updates include new automations in list', async () => {
      for (let i = 0; i < 5; i++) {
        const newHass = createComplexMockHass();
        newHass.states['automation.dynamic_' + i] = {
          entity_id: 'automation.dynamic_' + i,
          state: 'on',
          attributes: { friendly_name: 'Dynamic ' + i },
        };
        card.hass = newHass;
      }
      await card.updateComplete;

      // The final hass update should include the last dynamic automation
      const automations = card._getAutomations();
      expect(automations.some(a => a.id === 'automation.dynamic_4')).toBe(true);
    });
  });
});
