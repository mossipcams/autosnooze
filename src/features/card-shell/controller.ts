import { UI_TIMING } from '../../constants/index.js';
import { getAutomations as listAutomations } from '../../state/automations.js';
import { SENSOR_ENTITY_ID } from '../../state/paused.js';
import { fetchCategoryRegistry, fetchEntityRegistry, fetchLabelRegistry } from '../../services/registry.js';
import type { AutomationItem } from '../../types/automation.js';
import type { HassCategory, HassEntityRegistryEntry, HassLabel, HomeAssistant } from '../../types/hass.js';

type Timer = ReturnType<typeof setTimeout>;
type Dependencies = {
  loadLabels: typeof fetchLabelRegistry;
  loadCategories: typeof fetchCategoryRegistry;
  loadEntities: typeof fetchEntityRegistry;
  getAutomations: typeof listAutomations;
  setTimeout: (callback: () => void, delay: number) => Timer;
  clearTimeout: (timer: Timer) => void;
};

const defaults: Dependencies = {
  loadLabels: fetchLabelRegistry,
  loadCategories: fetchCategoryRegistry,
  loadEntities: fetchEntityRegistry,
  getAutomations: listAutomations,
  setTimeout,
  clearTimeout,
};

export class CardShellController {
  labels: Record<string, HassLabel> = {};
  labelsUnavailable = false;
  categories: Record<string, HassCategory> = {};
  entities: Record<string, HassEntityRegistryEntry> = {};
  cacheVersion = 0;

  private connected = false;
  private labelsLoaded = false;
  private categoriesLoaded = false;
  private entitiesLoaded = false;
  private labelsPromise?: Promise<void>;
  private categoriesPromise?: Promise<void>;
  private entitiesPromise?: Promise<void>;
  private retryTimer?: Timer;
  private retryDelay: number = UI_TIMING.REGISTRY_RETRY_MIN_MS;
  private cachedStates?: HomeAssistant['states'];
  private cachedVersion = -1;
  private automations?: AutomationItem[];
  private hass?: HomeAssistant;
  private readonly deps: Dependencies;

  constructor(private readonly changed: () => void, dependencies: Partial<Dependencies> = {}) {
    this.deps = { ...defaults, ...dependencies };
  }

  get snapshot() {
    return {
      labels: this.labels,
      labelsUnavailable: this.labelsUnavailable,
      categories: this.categories,
      entities: this.entities,
      cacheVersion: this.cacheVersion,
    } as const;
  }

  connect(hass: HomeAssistant): Promise<void> {
    this.connected = true;
    this.hass = hass;
    if (!hass.connection) return Promise.resolve();
    return Promise.all([this.loadLabels(), this.loadCategories(), this.loadEntities()]).then(() => undefined);
  }

  disconnect(): void {
    this.connected = false;
    if (this.retryTimer !== undefined) this.deps.clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
  }

  getAutomations(hass: HomeAssistant): AutomationItem[] {
    if (this.cachedStates !== hass.states || this.cachedVersion !== this.cacheVersion || !this.automations) {
      this.automations = this.deps.getAutomations(hass, this.entities);
      this.cachedStates = hass.states;
      this.cachedVersion = this.cacheVersion;
    }
    return this.automations;
  }

  shouldUpdate(oldHass?: HomeAssistant, newHass?: HomeAssistant): boolean {
    if (!oldHass || !newHass) return true;
    if (oldHass.states?.[SENSOR_ENTITY_ID] !== newHass.states?.[SENSOR_ENTITY_ID]
      || oldHass.entities !== newHass.entities
      || oldHass.areas !== newHass.areas
      || (oldHass.language ?? oldHass.locale?.language) !== (newHass.language ?? newHass.locale?.language)) {
      return true;
    }
    if (!oldHass.states || !newHass.states) return true;
    if (oldHass.states === newHass.states) return false;
    const oldEntries = Object.entries(oldHass.states).filter(([id]) => id.startsWith('automation.'));
    const newCount = Object.keys(newHass.states).filter((id) => id.startsWith('automation.')).length;
    return oldEntries.length !== newCount
      || oldEntries.some(([id, state]) => newHass.states[id] !== state);
  }

  automationFingerprint(states: HomeAssistant['states']): string {
    return Object.keys(states ?? {}).filter((id) => id.startsWith('automation.')).sort().map((id) => {
      const entity = states?.[id];
      return `${id}:${entity?.state ?? ''}:${entity?.last_changed ?? ''}:${entity?.last_updated ?? ''}`;
    }).join('|');
  }

  loadLabels(hass?: HomeAssistant): Promise<void> {
    if (hass) this.hass = hass;
    if (this.labelsLoaded || this.retryTimer !== undefined) return Promise.resolve();
    return this.labelsPromise ??= this.deps.loadLabels(this.hass!).then((labels) => {
      if (labels === null) {
        this.labelsUnavailable = true;
        if (this.retryTimer === undefined) {
          this.retryTimer = this.deps.setTimeout(() => {
            this.finishRetry();
            void this.loadLabels();
          }, this.retryDelay);
          this.retryDelay = Math.min(this.retryDelay * 2, UI_TIMING.REGISTRY_RETRY_MAX_MS);
        }
        this.changed();
        return;
      }
      this.labels = labels;
      this.labelsLoaded = true;
      this.labelsUnavailable = false;
      this.retryDelay = UI_TIMING.REGISTRY_RETRY_MIN_MS;
      this.finishRetry();
      this.invalidate();
    }).finally(() => { this.labelsPromise = undefined; });
  }

  loadCategories(hass?: HomeAssistant): Promise<void> {
    if (hass) this.hass = hass;
    if (this.categoriesLoaded) return Promise.resolve();
    return this.categoriesPromise ??= this.deps.loadCategories(this.hass!).then((categories) => {
      this.categories = categories;
      this.categoriesLoaded = true;
      this.changed();
    }).finally(() => { this.categoriesPromise = undefined; });
  }

  loadEntities(hass?: HomeAssistant): Promise<void> {
    if (hass) this.hass = hass;
    if (this.entitiesLoaded) return Promise.resolve();
    return this.entitiesPromise ??= this.deps.loadEntities(this.hass!).then((entities) => {
      this.entities = entities;
      this.entitiesLoaded = true;
      this.invalidate();
    }).finally(() => { this.entitiesPromise = undefined; });
  }

  private finishRetry(): void {
    if (this.retryTimer !== undefined) this.deps.clearTimeout(this.retryTimer);
    this.retryTimer = undefined;
  }

  private invalidate(): void {
    this.cacheVersion++;
    if (this.connected) this.changed();
  }
}
