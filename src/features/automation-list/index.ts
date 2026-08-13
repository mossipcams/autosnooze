/**
 * Automation list feature read-model helpers.
 */

import { EXCLUDE_LABEL, INCLUDE_LABEL } from '../../constants/index.js';
import type { AutomationItem } from '../../types/automation.js';
import type { FilterTab } from '../../types/card.js';
import type { HassCategory, HassLabel, HomeAssistant } from '../../types/hass.js';
import { formatRegistryId } from '../../utils/registry-formatting.js';
import { reportTelemetry } from '../../services/telemetry.js';
export { getAutomations } from '../../state/automations.js';
export {
  loadHideSnoozedPreference,
  saveHideSnoozedPreference,
} from '../../services/storage.js';

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
  hideSnoozed?: boolean;
  pausedEntityIds?: ReadonlySet<string>;
}

interface DecoratedAutomation {
  automation: AutomationItem;
  areaName: string;
  categoryName: string;
  visibleLabelNames: string[];
  hasIncludeLabel: boolean;
  hasExcludeLabel: boolean;
}

export { formatRegistryId };

export function trackSelectionFeatureUsed(hass: HomeAssistant, targetCount: number): void {
  reportTelemetry(hass, {
    event: 'selection_feature_used',
    properties: { target_count: targetCount },
    source: 'card',
  });
}

export function trackFilterTabSelected(
  hass: HomeAssistant,
  tab: 'all' | 'areas' | 'categories' | 'labels',
): void {
  reportTelemetry(hass, {
    event: 'filter_tab_selected',
    properties: { tab },
    source: 'card',
  });
}

export function trackHideSnoozedToggled(hass: HomeAssistant, enabled: boolean): void {
  reportTelemetry(hass, {
    event: 'hide_snoozed_toggled',
    properties: { enabled },
    source: 'card',
  });
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

export function buildAutomationListViewModel(
  input: BuildAutomationListViewModelInput
): AutomationListViewModel {
  const hiddenLabels = new Set([EXCLUDE_LABEL.toLowerCase(), INCLUDE_LABEL.toLowerCase()]);
  const searchLower = input.search.toLowerCase();

  const decorated = input.automations.map((automation) => {
    const visibleLabelNames = getVisibleLabelNames(automation, input.labelRegistry, hiddenLabels);

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
  const pausedEntityIds = input.pausedEntityIds;
  const hideSnoozed = Boolean(input.hideSnoozed);
  const filteredDecorated = decorated.filter((automation) => {
    const labelVisible = hasIncludeLabel ? automation.hasIncludeLabel : !automation.hasExcludeLabel;
    if (!labelVisible) {
      return false;
    }

    if (hideSnoozed && pausedEntityIds?.has(automation.automation.id)) {
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

  const areaIds = new Set<string>();
  const labelIds = new Set<string>();
  const categoryIds = new Set<string>();

  filteredDecorated.forEach((item) => {
    if (item.automation.area_id) {
      areaIds.add(item.automation.area_id);
    }
    if (item.automation.category_id) {
      categoryIds.add(item.automation.category_id);
    }
    if (item.automation.labels?.length) {
      item.automation.labels.forEach((labelId) => {
        const labelName = getLabelName(labelId, input.labelRegistry).toLowerCase();
        if (!hiddenLabels.has(labelName)) {
          labelIds.add(labelId);
        }
      });
    }
  });

  return {
    filtered: filteredDecorated.map((automation) => automation.automation),
    grouped,
    areaCount: areaIds.size,
    labelCount: labelIds.size,
    categoryCount: categoryIds.size,
  };
}
