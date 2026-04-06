// @ts-nocheck
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import '../src/index.ts';

describe('PR #329 Automation List Cache', () => {
  let list;

  beforeEach(async () => {
    const ListClass = customElements.get('autosnooze-automation-list');
    list = new ListClass();
    list.hass = createMockHass({
      states: {
        'automation.kitchen': {
          entity_id: 'automation.kitchen',
          state: 'on',
          attributes: { friendly_name: 'Kitchen' },
        },
      },
    });
    list.automations = [
      { id: 'automation.kitchen', name: 'Kitchen', area_id: 'kitchen', category_id: 'lighting', labels: [] },
    ];
    document.body.appendChild(list);
    await list.updateComplete;
  });

  afterEach(() => {
    list?.remove();
  });

  test('reuses the cached view model when tracked inputs are unchanged', () => {
    list._filterTab = 'categories';
    list.categoryRegistry = {
      lighting: { name: 'Lighting' },
    };

    const first = list._getViewModel();
    const second = list._getViewModel();

    expect(second).toBe(first);
    expect(second.grouped).toEqual([
      ['Lighting', [{ id: 'automation.kitchen', name: 'Kitchen', area_id: 'kitchen', category_id: 'lighting', labels: [] }]],
    ]);
  });

  test('recomputes the cached view model when the category registry reference changes', async () => {
    list._filterTab = 'categories';
    list.categoryRegistry = {};

    const before = list._getViewModel();
    expect(before.grouped[0][0]).toBe('Lighting');

    list.categoryRegistry = {
      lighting: { name: 'Scenes' },
    };

    const after = list._getViewModel();
    expect(after).not.toBe(before);
    expect(after.grouped[0][0]).toBe('Scenes');
  });
});
