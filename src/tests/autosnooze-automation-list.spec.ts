import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AutoSnoozeAutomationList } from '../components/autosnooze-automation-list.js';
import {
  buildAutomationListViewModel,
  partitionRecentAutomations,
} from '../features/automation-list/index.js';
import type { AutomationItem } from '../types/automation.js';
import type { HassCategory, HassLabel, HomeAssistant } from '../types/hass.js';

describe('AutoSnoozeAutomationList grouped derivation', () => {
  test('derives grouped results for areas, labels, and categories through one shared helper', () => {
    if (!customElements.get('test-autosnooze-automation-list')) {
      customElements.define('test-autosnooze-automation-list', AutoSnoozeAutomationList);
    }

    const hass = {
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
    const automations: AutomationItem[] = [
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
    const labelRegistry: Record<string, HassLabel> = {
      party: { label_id: 'party', name: 'Party' },
    };
    const categoryRegistry: Record<string, HassCategory> = {
      lighting: { category_id: 'lighting', name: 'Lighting' },
    };

    const build = (filterTab: 'areas' | 'labels' | 'categories') =>
      buildAutomationListViewModel({
        automations,
        search: '',
        filterTab,
        hass,
        labelRegistry,
        categoryRegistry,
        emptyAreaLabel: 'Unassigned',
        emptyLabelLabel: 'Unlabeled',
        emptyCategoryLabel: 'Uncategorized',
      }).grouped;

    expect(build('areas')).toEqual([
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

    expect(build('labels')).toEqual([
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

    expect(build('categories')).toEqual([
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

  test('partitionRecentAutomations keeps recent items first without duplicating ids', () => {
    const items = [
      { id: 'automation.b', name: 'B', area_id: null, category_id: null, labels: [] },
      { id: 'automation.a', name: 'A', area_id: null, category_id: null, labels: [] },
      { id: 'automation.c', name: 'C', area_id: null, category_id: null, labels: [] },
    ];

    const { recentItems, ordered } = partitionRecentAutomations(items, ['automation.c', 'automation.a']);

    expect(recentItems.map((item) => item.id)).toEqual(['automation.a', 'automation.c']);
    expect(ordered.map((item) => item.id)).toEqual(['automation.a', 'automation.c', 'automation.b']);
  });

  test('does not keep separate grouping implementations for public and decorated paths', () => {
    const sourcePath = join(process.cwd(), 'src/features/automation-list/index.ts');
    const source = readFileSync(sourcePath, 'utf8');

    expect(source).not.toContain('function groupDecoratedAutomations');
  });
});
