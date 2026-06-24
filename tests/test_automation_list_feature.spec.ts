// @ts-nocheck -- focused tests for automation list read-model feature
import { describe, expect, test } from 'vitest';
import {
  buildAutomationListViewModel,
  getAutomations,
} from '../src/features/automation-list/index.js';

describe('Automation List Feature', () => {
  test('derives automation read models from hass state and entity registry', () => {
    const hass = createMockHass({
      states: {
        'automation.kitchen_lights': {
          entity_id: 'automation.kitchen_lights',
          state: 'on',
          attributes: { friendly_name: 'Kitchen Lights' },
        },
        'automation.alarm': {
          entity_id: 'automation.alarm',
          state: 'on',
          attributes: { friendly_name: 'Alarm' },
        },
      },
      entities: {
        'automation.alarm': {
          area_id: 'hallway',
          labels: ['confirm'],
        },
      },
    });

    const result = getAutomations(hass, {
      'automation.kitchen_lights': {
        entity_id: 'automation.kitchen_lights',
        area_id: 'kitchen',
        categories: { automation: 'lighting' },
        labels: ['include'],
      },
    });

    expect(result).toEqual([
      {
        id: 'automation.alarm',
        name: 'Alarm',
        area_id: 'hallway',
        category_id: null,
        labels: ['confirm'],
      },
      {
        id: 'automation.kitchen_lights',
        name: 'Kitchen Lights',
        area_id: 'kitchen',
        category_id: 'lighting',
        labels: ['include'],
      },
    ]);
  });

  test('builds filtered results, counts, and label grouping from one input snapshot', () => {
    const automations = [
      { id: 'automation.kitchen', name: 'Kitchen', area_id: 'kitchen', category_id: 'lighting', labels: ['include', 'party'] },
      { id: 'automation.porch', name: 'Porch', area_id: 'outdoor', category_id: 'lighting', labels: ['exclude'] },
      { id: 'automation.alarm', name: 'Alarm', area_id: null, category_id: 'security', labels: ['urgent'] },
    ];

    const viewModel = buildAutomationListViewModel({
      automations,
      search: 'k',
      filterTab: 'labels',
      hass: createMockHass({
        areas: {
          kitchen: { name: 'Kitchen' },
          outdoor: { name: 'Outdoor' },
        },
      }),
      labelRegistry: {
        include: { label_id: 'include', name: 'autosnooze_include' },
        exclude: { label_id: 'exclude', name: 'autosnooze_exclude' },
        party: { label_id: 'party', name: 'Party' },
        urgent: { label_id: 'urgent', name: 'Urgent' },
      },
      categoryRegistry: {
        lighting: { category_id: 'lighting', name: 'Lighting' },
        security: { category_id: 'security', name: 'Security' },
      },
      emptyAreaLabel: 'Unassigned',
      emptyLabelLabel: 'Unlabeled',
      emptyCategoryLabel: 'Uncategorized',
    });

    expect(viewModel.filtered).toEqual([
      { id: 'automation.kitchen', name: 'Kitchen', area_id: 'kitchen', category_id: 'lighting', labels: ['include', 'party'] },
    ]);
    expect(viewModel.grouped).toEqual([
      ['Party', [{ id: 'automation.kitchen', name: 'Kitchen', area_id: 'kitchen', category_id: 'lighting', labels: ['include', 'party'] }]],
    ]);
    expect(viewModel.areaCount).toBe(2);
    expect(viewModel.labelCount).toBe(2);
    expect(viewModel.categoryCount).toBe(2);
  });
});
