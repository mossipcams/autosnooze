import type { AutomationItem } from '../types/automation.js';
import type { HassEntityRegistryEntry, HomeAssistant } from '../types/hass.js';
export { formatRegistryId } from '../utils/registry-formatting.js';

export function getAutomations(
  hass: HomeAssistant,
  entityRegistry: Record<string, HassEntityRegistryEntry>
): AutomationItem[] {
  if (!hass.states) return [];
  return Object.keys(hass.states)
    .filter((id) => id.startsWith('automation.'))
    .map((id) => {
      const state = hass.states[id];
      if (!state) return null;
      const registryEntry = entityRegistry[id];
      const hassEntry = hass.entities?.[id];
      return {
        id,
        name: (state.attributes?.friendly_name as string | undefined) ?? id.replace('automation.', ''),
        area_id: registryEntry?.area_id ?? hassEntry?.area_id ?? null,
        category_id: registryEntry?.categories?.automation ?? null,
        labels: registryEntry?.labels ?? hassEntry?.labels ?? [],
      };
    })
    .filter((automation): automation is AutomationItem => automation !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}
