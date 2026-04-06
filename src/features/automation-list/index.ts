/**
 * Automation list feature read-model helpers.
 */

import { EXCLUDE_LABEL, INCLUDE_LABEL } from '../../constants/index.js';
import type { AutomationItem } from '../../types/automation.js';
import type { HassCategory, HassEntityRegistryEntry, HassLabel, HomeAssistant } from '../../types/hass.js';

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
