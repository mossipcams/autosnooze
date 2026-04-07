import { describe, expect, test } from 'vitest';
import { AutoSnoozeAutomationList } from '../components/autosnooze-automation-list.js';
import type { AutomationItem } from '../types/automation.js';
import type { HassCategory, HassLabel, HomeAssistant } from '../types/hass.js';

type TestAutomationList = {
  hass?: HomeAssistant;
  automations: AutomationItem[];
  labelRegistry: Record<string, HassLabel>;
  categoryRegistry: Record<string, HassCategory>;
  _getGroupedByTab: (filterTab: 'areas' | 'labels' | 'categories') => [string, AutomationItem[]][];
};

describe('AutoSnoozeAutomationList grouped derivation', () => {
  test('derives grouped results for areas, labels, and categories through one shared helper', () => {
    if (!customElements.get('test-autosnooze-automation-list')) {
      customElements.define('test-autosnooze-automation-list', AutoSnoozeAutomationList);
    }

    const element = document.createElement('test-autosnooze-automation-list') as unknown as TestAutomationList;
    element.hass = {
      states: {},
      entities: {},
      areas: {
        kitchen: { name: 'Kitchen' },
      },
      connection: {
        sendMessagePromise: async () => [],
      },
      callService: async () => undefined,
    } as unknown as HomeAssistant;
    element.automations = [
      {
        id: 'automation.kitchen',
        name: 'Kitchen Lights',
        area_id: 'kitchen',
        category_id: 'lighting',
        labels: ['party'],
      },
      {
        id: 'automation.alarm',
        name: 'Alarm',
        area_id: null,
        category_id: null,
        labels: [],
      },
    ];
    element.labelRegistry = {
      party: { label_id: 'party', name: 'Party' },
    };
    element.categoryRegistry = {
      lighting: { category_id: 'lighting', name: 'Lighting' },
    };

    expect(element._getGroupedByTab('areas')).toEqual([
      [
        'Kitchen',
        [
          {
            id: 'automation.kitchen',
            name: 'Kitchen Lights',
            area_id: 'kitchen',
            category_id: 'lighting',
            labels: ['party'],
          },
        ],
      ],
      [
        'Unassigned',
        [
          {
            id: 'automation.alarm',
            name: 'Alarm',
            area_id: null,
            category_id: null,
            labels: [],
          },
        ],
      ],
    ]);

    expect(element._getGroupedByTab('labels')).toEqual([
      [
        'Party',
        [
          {
            id: 'automation.kitchen',
            name: 'Kitchen Lights',
            area_id: 'kitchen',
            category_id: 'lighting',
            labels: ['party'],
          },
        ],
      ],
      [
        'Unlabeled',
        [
          {
            id: 'automation.alarm',
            name: 'Alarm',
            area_id: null,
            category_id: null,
            labels: [],
          },
        ],
      ],
    ]);

    expect(element._getGroupedByTab('categories')).toEqual([
      [
        'Lighting',
        [
          {
            id: 'automation.kitchen',
            name: 'Kitchen Lights',
            area_id: 'kitchen',
            category_id: 'lighting',
            labels: ['party'],
          },
        ],
      ],
      [
        'Uncategorized',
        [
          {
            id: 'automation.alarm',
            name: 'Alarm',
            area_id: null,
            category_id: null,
            labels: [],
          },
        ],
      ],
    ]);
  });
});
