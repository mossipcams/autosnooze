/**
 * Automation state management for AutoSnooze card.
 */

import type { HomeAssistant, HassLabel, HassCategory, HassEntityRegistryEntry } from '../types/hass.js';
import type { AutomationItem } from '../types/automation.js';
import { EXCLUDE_LABEL, INCLUDE_LABEL } from '../constants/index.js';

/**
 * Format a registry ID from snake_case to Title Case.
 */
export function formatRegistryId(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get area name from ID.
 */
export function getAreaName(areaId: string | null, hass: HomeAssistant, fallback: string = 'Unassigned'): string {
  if (!areaId) return fallback;
  return hass.areas?.[areaId]?.name ?? formatRegistryId(areaId);
}

/**
 * Get label name from ID.
 */
export function getLabelName(
  labelId: string,
  labelRegistry: Record<string, HassLabel>
): string {
  return labelRegistry[labelId]?.name ?? formatRegistryId(labelId);
}

/**
 * Get category name from ID.
 */
export function getCategoryName(
  categoryId: string | null,
  categoryRegistry: Record<string, HassCategory>,
  fallback: string = 'Uncategorized'
): string {
  if (!categoryId) return fallback;
  return categoryRegistry[categoryId]?.name ?? formatRegistryId(categoryId);
}

/**
 * Get all automations from Home Assistant state.
 */
export function getAutomations(
  hass: HomeAssistant,
  entityRegistry: Record<string, HassEntityRegistryEntry>
): AutomationItem[] {
  const states = hass?.states;
  const entities = hass?.entities;
  if (!states) return [];

  const automationIds = Object.keys(states).filter((id) =>
    id.startsWith('automation.')
  );

  const result = automationIds
    .map((id) => {
      const state = states[id];
      if (!state) return null;
      const registryEntry = entityRegistry?.[id];
      const hassEntry = entities?.[id];
      const categories = registryEntry?.categories ?? {};
      const category_id = categories['automation'] ?? null;
      return {
        id,
        name: (state.attributes?.friendly_name as string | undefined) ?? id.replace('automation.', ''),
        area_id: registryEntry?.area_id ?? hassEntry?.area_id ?? null,
        category_id,
        labels: registryEntry?.labels ?? hassEntry?.labels ?? [],
      };
    })
    .filter((a): a is AutomationItem => a !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return result;
}

/**
 * Check if an automation has a specific label.
 */
export function hasLabel(
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

/**
 * Filter automations based on label inclusion/exclusion rules and search.
 */
export function filterAutomations(
  automations: AutomationItem[],
  search: string,
  labelRegistry: Record<string, HassLabel>,
  strictOnMissingRegistry: boolean = false
): AutomationItem[] {
  // Fail-safe: if automations carry labels but registry is unavailable,
  // hide list rather than risk exposing excluded entities.
  const registryUnavailable =
    strictOnMissingRegistry &&
    Object.keys(labelRegistry).length === 0 &&
    automations.some((a) => Array.isArray(a.labels) && a.labels.length > 0);
  if (registryUnavailable) {
    return [];
  }

  let filtered = automations;

  // Check if any automation has the include label (enables whitelist mode)
  const hasIncludeLabel = automations.some((a) => hasLabel(a, INCLUDE_LABEL, labelRegistry));

  if (hasIncludeLabel) {
    // Include mode: only show automations with the include label
    filtered = filtered.filter((a) => hasLabel(a, INCLUDE_LABEL, labelRegistry));
  } else {
    // Exclude mode: hide automations with the exclude label
    filtered = filtered.filter((a) => !hasLabel(a, EXCLUDE_LABEL, labelRegistry));
  }

  // Filter by search term
  const searchLower = search.toLowerCase();
  if (searchLower) {
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(searchLower) ||
        a.id.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

/**
 * Group automations by a key function.
 */
export function groupAutomationsBy(
  automations: AutomationItem[],
  getKeys: (auto: AutomationItem) => string[] | null,
  defaultGroupName: string
): [string, AutomationItem[]][] {
  const groups: Record<string, AutomationItem[]> = {};

  automations.forEach((auto) => {
    const keys = getKeys(auto);
    if (!keys || keys.length === 0) {
      if (!groups[defaultGroupName]) groups[defaultGroupName] = [];
      groups[defaultGroupName].push(auto);
    } else {
      keys.forEach((key) => {
        if (!groups[key]) groups[key] = [];
        groups[key].push(auto);
      });
    }
  });

  return Object.entries(groups).sort((a, b) =>
    a[0] === defaultGroupName ? 1 : b[0] === defaultGroupName ? -1 : a[0].localeCompare(b[0])
  );
}

/**
 * Count unique values from automations.
 */
export function getUniqueCount(
  automations: AutomationItem[],
  getValues: (auto: AutomationItem) => string[] | null
): number {
  const uniqueValues = new Set<string>();
  automations.forEach((auto) => {
    const values = getValues(auto);
    if (values) {
      values.forEach((v) => uniqueValues.add(v));
    }
  });
  return uniqueValues.size;
}
