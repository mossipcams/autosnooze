// @ts-nocheck -- focused regression spec for grouped derivation reuse
import { describe, expect, test } from 'vitest';
import { AutoSnoozeAutomationList } from '../components/autosnooze-automation-list.js';

describe('AutoSnoozeAutomationList grouped derivation', () => {
  test('derives grouped results for areas, labels, and categories through one shared helper', () => {
    if (!customElements.get('test-autosnooze-automation-list')) {
      customElements.define('test-autosnooze-automation-list', AutoSnoozeAutomationList);
    }

    const element = document.createElement('test-autosnooze-automation-list') as AutoSnoozeAutomationList;
    element.hass = createMockHass({
      areas: {
        kitchen: { name: 'Kitchen' },
      },
    });
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
