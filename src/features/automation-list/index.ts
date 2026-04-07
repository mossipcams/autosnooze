/**
 * Automation list feature read-model helpers.
 */

import { EXCLUDE_LABEL, INCLUDE_LABEL } from '../../constants/index.js';
import type { AutomationItem } from '../../types/automation.js';
import type { FilterTab } from '../../types/card.js';
import type { HassCategory, HassEntityRegistryEntry, HassLabel, HomeAssistant } from '../../types/hass.js';

export interface AutomationListViewModel {
  filtered: AutomationItem[];
  grouped: [string, AutomationItem[]][];
  areaCount: number;
  labelCount: number;
  categoryCount: number;
}

interface BuildAutomationListViewModelInput {
  automations: AutomationItem[];
  search: string;
  filterTab: FilterTab;
  hass?: HomeAssistant;
  labelRegistry: Record<string, HassLabel>;
  categoryRegistry: Record<string, HassCategory>;
  emptyAreaLabel: string;
  emptyLabelLabel: string;
  emptyCategoryLabel: string;
}

interface DecoratedAutomation {
  automation: AutomationItem;
  areaName: string;
  categoryName: string;
  visibleLabelNames: string[];
  hasIncludeLabel: boolean;
  hasExcludeLabel: boolean;
}

export function formatRegistryId(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getAreaName(areaId: string | null, hass: HomeAssistant, fallback: string = 'Unassigned'): string {
  if (!areaId) return fallback;
  return hass.areas?.[areaId]?.name ?? formatRegistryId(areaId);
}

export function getLabelName(
  labelId: string,
  labelRegistry: Record<string, HassLabel>
): string {
  return labelRegistry[labelId]?.name ?? formatRegistryId(labelId);
}

export function getCategoryName(
  categoryId: string | null,
  categoryRegistry: Record<string, HassCategory>,
  fallback: string = 'Uncategorized'
): string {
  if (!categoryId) return fallback;
  return categoryRegistry[categoryId]?.name ?? formatRegistryId(categoryId);
}

export function getAutomations(
  hass: HomeAssistant,
  entityRegistry: Record<string, HassEntityRegistryEntry>
): AutomationItem[] {
  const states = hass?.states;
  const entities = hass?.entities;
  if (!states) return [];

  return Object.keys(states)
    .filter((id) => id.startsWith('automation.'))
    .map((id) => {
      const state = states[id];
      if (!state) return null;
      const registryEntry = entityRegistry?.[id];
      const hassEntry = entities?.[id];
      const categories = registryEntry?.categories ?? {};

      return {
        id,
        name: (state.attributes?.friendly_name as string | undefined) ?? id.replace('automation.', ''),
        area_id: registryEntry?.area_id ?? hassEntry?.area_id ?? null,
        category_id: categories['automation'] ?? null,
        labels: registryEntry?.labels ?? hassEntry?.labels ?? [],
      };
    })
    .filter((automation): automation is AutomationItem => automation !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getVisibleLabelNames(
  automation: AutomationItem,
  labelRegistry: Record<string, HassLabel>,
  hiddenLabels: Set<string>
): string[] {
  if (!automation.labels?.length) {
    return [];
  }

  return automation.labels
    .map((labelId) => getLabelName(labelId, labelRegistry))
    .filter((name) => !hiddenLabels.has(name.toLowerCase()));
}

function hasLabel(
  automation: AutomationItem,
  targetLabel: string,
  labelRegistry: Record<string, HassLabel>
): boolean {
  if (!automation.labels || automation.labels.length === 0) return false;
  return automation.labels.some((labelId) => {
    const labelName = labelRegistry[labelId]?.name;
    return labelName?.toLowerCase() === targetLabel;
  });
}

export function filterAutomations(
  automations: AutomationItem[],
  search: string,
  labelRegistry: Record<string, HassLabel>,
): AutomationItem[] {
  let filtered = automations;

  const hasIncludeLabel = automations.some((automation) => hasLabel(automation, INCLUDE_LABEL, labelRegistry));

  if (hasIncludeLabel) {
    filtered = filtered.filter((automation) => hasLabel(automation, INCLUDE_LABEL, labelRegistry));
  } else {
    filtered = filtered.filter((automation) => !hasLabel(automation, EXCLUDE_LABEL, labelRegistry));
  }

  const searchLower = search.toLowerCase();
  if (searchLower) {
    filtered = filtered.filter(
      (automation) =>
        automation.name.toLowerCase().includes(searchLower) ||
        automation.id.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

function groupDecoratedAutomations(
  automations: DecoratedAutomation[],
  getKeys: (automation: DecoratedAutomation) => string[] | null,
  defaultGroupName: string
): [string, AutomationItem[]][] {
  const groups: Record<string, AutomationItem[]> = {};

  automations.forEach((item) => {
    const keys = getKeys(item);
    if (!keys || keys.length === 0) {
      if (!groups[defaultGroupName]) {
        groups[defaultGroupName] = [];
      }
      groups[defaultGroupName].push(item.automation);
      return;
    }

    keys.forEach((key) => {
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item.automation);
    });
  });

  return Object.entries(groups).sort((a, b) =>
    a[0] === defaultGroupName ? 1 : b[0] === defaultGroupName ? -1 : a[0].localeCompare(b[0])
  );
}

export function groupAutomationsBy(
  automations: AutomationItem[],
  getKeys: (auto: AutomationItem) => string[] | null,
  defaultGroupName: string
): [string, AutomationItem[]][] {
  const groups: Record<string, AutomationItem[]> = {};

  automations.forEach((automation) => {
    const keys = getKeys(automation);
    if (!keys || keys.length === 0) {
      if (!groups[defaultGroupName]) groups[defaultGroupName] = [];
      groups[defaultGroupName].push(automation);
      return;
    }

    keys.forEach((key) => {
      if (!groups[key]) groups[key] = [];
      groups[key].push(automation);
    });
  });

  return Object.entries(groups).sort((a, b) =>
    a[0] === defaultGroupName ? 1 : b[0] === defaultGroupName ? -1 : a[0].localeCompare(b[0])
  );
}

export function getUniqueCount(
  automations: AutomationItem[],
  getValues: (auto: AutomationItem) => string[] | null
): number {
  const uniqueValues = new Set<string>();
  automations.forEach((automation) => {
    const values = getValues(automation);
    if (!values) {
      return;
    }
    values.forEach((value) => uniqueValues.add(value));
  });
  return uniqueValues.size;
}

export function buildAutomationListViewModel(
  input: BuildAutomationListViewModelInput
): AutomationListViewModel {
  const hiddenLabels = new Set([EXCLUDE_LABEL.toLowerCase(), INCLUDE_LABEL.toLowerCase()]);
  const searchLower = input.search.toLowerCase();

  const areaIds = new Set<string>();
  const labelIds = new Set<string>();
  const categoryIds = new Set<string>();

  const decorated = input.automations.map((automation) => {
    if (automation.area_id) {
      areaIds.add(automation.area_id);
    }
    if (automation.category_id) {
      categoryIds.add(automation.category_id);
    }

    const visibleLabelNames = getVisibleLabelNames(automation, input.labelRegistry, hiddenLabels);
    if (automation.labels?.length) {
      automation.labels.forEach((labelId) => {
        const labelName = getLabelName(labelId, input.labelRegistry).toLowerCase();
        if (!hiddenLabels.has(labelName)) {
          labelIds.add(labelId);
        }
      });
    }

    return {
      automation,
      areaName: automation.area_id
        ? input.hass
          ? getAreaName(automation.area_id, input.hass, input.emptyAreaLabel)
          : formatRegistryId(automation.area_id)
        : input.emptyAreaLabel,
      categoryName: automation.category_id
        ? getCategoryName(automation.category_id, input.categoryRegistry, input.emptyCategoryLabel)
        : input.emptyCategoryLabel,
      visibleLabelNames,
      hasIncludeLabel: hasLabel(automation, INCLUDE_LABEL, input.labelRegistry),
      hasExcludeLabel: hasLabel(automation, EXCLUDE_LABEL, input.labelRegistry),
    };
  });

  const hasIncludeLabel = decorated.some((automation) => automation.hasIncludeLabel);
  const filteredDecorated = decorated.filter((automation) => {
    const labelVisible = hasIncludeLabel ? automation.hasIncludeLabel : !automation.hasExcludeLabel;
    if (!labelVisible) {
      return false;
    }

    if (!searchLower) {
      return true;
    }

    return (
      automation.automation.name.toLowerCase().includes(searchLower) ||
      automation.automation.id.toLowerCase().includes(searchLower)
    );
  });

  const grouped =
    input.filterTab === 'areas'
      ? groupDecoratedAutomations(
          filteredDecorated,
          (automation) => (automation.automation.area_id ? [automation.areaName] : null),
          input.emptyAreaLabel
        )
      : input.filterTab === 'categories'
        ? groupDecoratedAutomations(
            filteredDecorated,
            (automation) => (automation.automation.category_id ? [automation.categoryName] : null),
            input.emptyCategoryLabel
          )
        : input.filterTab === 'labels'
          ? groupDecoratedAutomations(
              filteredDecorated,
              (automation) => automation.visibleLabelNames.length > 0 ? automation.visibleLabelNames : null,
              input.emptyLabelLabel
            )
          : [];

  return {
    filtered: filteredDecorated.map((automation) => automation.automation),
    grouped,
    areaCount: areaIds.size,
    labelCount: labelIds.size,
    categoryCount: categoryIds.size,
  };
}
