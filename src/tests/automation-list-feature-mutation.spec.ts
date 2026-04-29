import { describe, expect, test } from 'vitest';
import {
  buildAutomationListViewModel,
  filterAutomations,
  formatRegistryId,
  getAreaName,
  getAutomations,
  getCategoryName,
  getLabelName,
  groupAutomationsBy,
} from '../features/automation-list/index.js';
import type { AutomationItem } from '../types/automation.js';
import type { HassCategory, HassEntityRegistryEntry, HassLabel, HomeAssistant } from '../types/hass.js';

const automations: AutomationItem[] = [
  {
    id: 'automation.kitchen_lights',
    name: 'Kitchen Lights',
    area_id: 'kitchen',
    category_id: 'lighting',
    labels: ['include', 'evening'],
  },
  {
    id: 'automation.office_fan',
    name: 'Office Fan',
    area_id: 'office',
    category_id: 'climate',
    labels: ['exclude'],
  },
  {
    id: 'automation.porch',
    name: 'Porch',
    area_id: null,
    category_id: null,
    labels: ['evening', 'outdoor'],
  },
  {
    id: 'automation.no_labels',
    name: 'No Labels',
    area_id: null,
    category_id: null,
    labels: [],
  },
];

const labelRegistry: Record<string, HassLabel> = {
  include: { label_id: 'include', name: 'autosnooze_include' },
  exclude: { label_id: 'exclude', name: 'autosnooze_exclude' },
  evening: { label_id: 'evening', name: 'Evening' },
  outdoor: { label_id: 'outdoor', name: 'Outdoor' },
};

const categoryRegistry: Record<string, HassCategory> = {
  lighting: { category_id: 'lighting', name: 'Lighting' },
  climate: { category_id: 'climate', name: 'Climate' },
};

const hass = {
  states: {
    'automation.office_fan': {
      entity_id: 'automation.office_fan',
      attributes: { friendly_name: 'Office Fan' },
    },
    'automation.kitchen_lights': {
      entity_id: 'automation.kitchen_lights',
      attributes: { friendly_name: 'Kitchen Lights' },
    },
    'automation.no_name': {
      entity_id: 'automation.no_name',
      attributes: {},
    },
    'light.kitchen': {
      entity_id: 'light.kitchen',
      attributes: { friendly_name: 'Ignored Light' },
    },
  },
  entities: {
    'automation.office_fan': {
      entity_id: 'automation.office_fan',
      area_id: 'office',
      labels: ['exclude'],
    },
  },
  areas: {
    kitchen: { name: 'Kitchen' },
  },
} as unknown as HomeAssistant;

const entityRegistry: Record<string, HassEntityRegistryEntry> = {
  'automation.kitchen_lights': {
    entity_id: 'automation.kitchen_lights',
    area_id: 'kitchen',
    labels: ['include', 'evening'],
    categories: { automation: 'lighting' },
  } as HassEntityRegistryEntry,
  'automation.no_name': {
    entity_id: 'automation.no_name',
    categories: {},
  } as HassEntityRegistryEntry,
};

function build(search: string, filterTab: 'all' | 'areas' | 'categories' | 'labels') {
  return buildAutomationListViewModel({
    automations,
    search,
    filterTab,
    hass,
    labelRegistry,
    categoryRegistry,
    emptyAreaLabel: 'Unassigned',
    emptyLabelLabel: 'Unlabeled',
    emptyCategoryLabel: 'Uncategorized',
  });
}

describe('automation list feature mutation boundaries', () => {
  test('formats registry ids and resolves area, label, and category names with fallbacks', () => {
    expect(formatRegistryId('one')).toBe('One');
    expect(formatRegistryId('kitchen_main_lights')).toBe('Kitchen Main Lights');
    expect(getAreaName(null, hass)).toBe('Unassigned');
    expect(getAreaName('kitchen', hass)).toBe('Kitchen');
    expect(getAreaName('garage_doors', hass)).toBe('Garage Doors');
    expect(getLabelName('evening', labelRegistry)).toBe('Evening');
    expect(getLabelName('party_mode', labelRegistry)).toBe('Party Mode');
    expect(getCategoryName(null, categoryRegistry)).toBe('Uncategorized');
    expect(getCategoryName('lighting', categoryRegistry)).toBe('Lighting');
    expect(getCategoryName('whole_home', categoryRegistry)).toBe('Whole Home');
  });

  test('getAutomations filters automation entities, merges registry and hass metadata, and sorts by friendly name', () => {
    expect(getAutomations({ states: undefined } as unknown as HomeAssistant, entityRegistry)).toEqual([]);

    expect(getAutomations(hass, entityRegistry)).toEqual([
      {
        id: 'automation.kitchen_lights',
        name: 'Kitchen Lights',
        area_id: 'kitchen',
        category_id: 'lighting',
        labels: ['include', 'evening'],
      },
      {
        id: 'automation.no_name',
        name: 'no_name',
        area_id: null,
        category_id: null,
        labels: [],
      },
      {
        id: 'automation.office_fan',
        name: 'Office Fan',
        area_id: 'office',
        category_id: null,
        labels: ['exclude'],
      },
    ]);
  });

  test('filterAutomations applies include/exclude labels and case-insensitive name or id search', () => {
    expect(filterAutomations(automations, '', labelRegistry).map((item) => item.id)).toEqual([
      'automation.kitchen_lights',
    ]);

    const noIncludeRegistry = {
      exclude: labelRegistry.exclude,
      evening: labelRegistry.evening,
      outdoor: labelRegistry.outdoor,
    } as Record<string, HassLabel>;
    expect(filterAutomations(automations, '', noIncludeRegistry).map((item) => item.id)).toEqual([
      'automation.kitchen_lights',
      'automation.porch',
      'automation.no_labels',
    ]);
    expect(filterAutomations(automations, 'PORCH', noIncludeRegistry).map((item) => item.id)).toEqual([
      'automation.porch',
    ]);
    expect(filterAutomations(automations, 'office_fan', noIncludeRegistry)).toEqual([]);
  });

  test('groupAutomationsBy creates default groups, supports multi-key groups, and sorts default last', () => {
    expect(groupAutomationsBy(automations, (automation) => automation.area_id ? [automation.area_id] : null, 'none')).toEqual([
      ['kitchen', [automations[0]]],
      ['office', [automations[1]]],
      ['none', [automations[2], automations[3]]],
    ]);
    expect(groupAutomationsBy(automations, (automation) => automation.labels, 'none')).toEqual([
      ['evening', [automations[0], automations[2]]],
      ['exclude', [automations[1]]],
      ['include', [automations[0]]],
      ['outdoor', [automations[2]]],
      ['none', [automations[3]]],
    ]);
  });

  test('view model filters include labels, hides control labels from label counts, and groups by area', () => {
    const viewModel = build('', 'areas');

    expect(viewModel.filtered.map((item) => item.id)).toEqual(['automation.kitchen_lights']);
    expect(viewModel.areaCount).toBe(2);
    expect(viewModel.categoryCount).toBe(2);
    expect(viewModel.labelCount).toBe(2);
    expect(viewModel.grouped).toEqual([
      ['Kitchen', [automations[0]]],
    ]);
  });

  test('view model groups by categories and labels with default groups last and supports search', () => {
    const noInclude = automations.map((automation) => ({
      ...automation,
      labels: automation.labels.filter((label) => label !== 'include'),
    }));
    const noIncludeLabels = {
      exclude: labelRegistry.exclude,
      evening: labelRegistry.evening,
      outdoor: labelRegistry.outdoor,
    } as Record<string, HassLabel>;

    const categories = buildAutomationListViewModel({
      automations: noInclude,
      search: '',
      filterTab: 'categories',
      hass: undefined,
      labelRegistry: noIncludeLabels,
      categoryRegistry,
      emptyAreaLabel: 'Unassigned',
      emptyLabelLabel: 'Unlabeled',
      emptyCategoryLabel: 'Uncategorized',
    });
    expect(categories.filtered.map((item) => item.id)).toEqual([
      'automation.kitchen_lights',
      'automation.porch',
      'automation.no_labels',
    ]);
    expect(categories.grouped).toEqual([
      ['Lighting', [noInclude[0]]],
      ['Uncategorized', [noInclude[2], noInclude[3]]],
    ]);

    const labels = buildAutomationListViewModel({
      automations: noInclude,
      search: 'automation.porch',
      filterTab: 'labels',
      hass,
      labelRegistry: noIncludeLabels,
      categoryRegistry,
      emptyAreaLabel: 'Unassigned',
      emptyLabelLabel: 'Unlabeled',
      emptyCategoryLabel: 'Uncategorized',
    });
    expect(labels.filtered.map((item) => item.id)).toEqual(['automation.porch']);
    expect(labels.grouped).toEqual([
      ['Evening', [noInclude[2]]],
      ['Outdoor', [noInclude[2]]],
    ]);
  });
});
