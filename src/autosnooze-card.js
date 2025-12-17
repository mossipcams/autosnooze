import { LitElement, html, css } from "lit";

// Version 2.9.1 - Fix: Root-level path for reverse proxy compatibility
const CARD_VERSION = "2.9.1";

// ============================================================================
// CARD EDITOR
// ============================================================================
class AutomationPauseCardEditor extends LitElement {
  static properties = {
    hass: { type: Object },
    _config: { state: true },
  };

  static styles = css`
    .row {
      margin-bottom: 12px;
    }
    .row label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
    }
    input[type="text"] {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      box-sizing: border-box;
    }
    .help {
      font-size: 0.85em;
      color: var(--secondary-text-color);
      margin-top: 4px;
    }
  `;

  constructor() {
    super();
    this.hass = {};
    this._config = {};
  }

  setConfig(config) {
    this._config = config;
  }

  _valueChanged(key, value) {
    if (!this._config) return;

    const newConfig = { ...this._config, [key]: value };
    if (value === "" || value === null || value === undefined) {
      delete newConfig[key];
    }

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    if (!this._config) return html``;

    return html`
      <div class="row">
        <label>Title</label>
        <input
          type="text"
          .value=${this._config.title || ""}
          @input=${(e) => this._valueChanged("title", e.target.value)}
          placeholder="AutoSnooze"
        />
      </div>
    `;
  }
}

// ============================================================================
// MAIN CARD
// ============================================================================
class AutomationPauseCard extends LitElement {
  static properties = {
    hass: { type: Object },
    config: { type: Object },
    _selected: { state: true },
    _duration: { state: true },
    _customDuration: { state: true },
    _customDurationInput: { state: true },
    _loading: { state: true },
    _search: { state: true },
    _filterTab: { state: true },
    _expandedGroups: { state: true },
    _scheduleMode: { state: true },
    _disableAt: { state: true },
    _resumeAt: { state: true },
    _labelRegistry: { state: true },
    _categoryRegistry: { state: true },
    _entityRegistry: { state: true },
    _showCustomInput: { state: true },
  };

  constructor() {
    super();
    this.hass = {};
    this.config = {};
    this._selected = [];
    this._duration = 1800000; // 30 minutes default
    this._customDuration = { days: 0, hours: 0, minutes: 30 };
    this._customDurationInput = "30m";
    this._loading = false;
    this._search = "";
    this._filterTab = "all";
    this._expandedGroups = {};
    this._scheduleMode = false;
    this._disableAt = "";
    this._resumeAt = "";
    this._labelRegistry = {};
    this._categoryRegistry = {};
    this._entityRegistry = {};
    this._showCustomInput = false;
    this._interval = null;
    this._labelsFetched = false;
    this._categoriesFetched = false;
    this._entityRegistryFetched = false;
    this._debugLogged = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._interval = window.setInterval(() => this.requestUpdate(), 1000);
    this._fetchLabelRegistry();
    this._fetchCategoryRegistry();
    this._fetchEntityRegistry();
  }

  async _fetchLabelRegistry() {
    if (this._labelsFetched || !this.hass?.connection) return;

    try {
      const labels = await this.hass.connection.sendMessagePromise({
        type: "config/label_registry/list",
      });

      const labelMap = {};
      if (Array.isArray(labels)) {
        labels.forEach((label) => {
          labelMap[label.label_id] = label;
        });
      }

      this._labelRegistry = labelMap;
      this._labelsFetched = true;
      console.log("[AutoSnooze] Label registry fetched:", Object.keys(labelMap).length, "labels");
    } catch (err) {
      console.warn("[AutoSnooze] Failed to fetch label registry:", err);
    }
  }

  async _fetchCategoryRegistry() {
    if (this._categoriesFetched || !this.hass?.connection) return;

    try {
      const categories = await this.hass.connection.sendMessagePromise({
        type: "config/category_registry/list",
        scope: "automation",
      });

      const categoryMap = {};
      if (Array.isArray(categories)) {
        categories.forEach((category) => {
          categoryMap[category.category_id] = category;
        });
      }

      this._categoryRegistry = categoryMap;
      this._categoriesFetched = true;
      console.log("[AutoSnooze] Category registry fetched:", Object.keys(categoryMap).length, "categories");
    } catch (err) {
      console.warn("[AutoSnooze] Failed to fetch category registry:", err);
    }
  }

  async _fetchEntityRegistry() {
    if (this._entityRegistryFetched || !this.hass?.connection) return;

    try {
      // First, get the basic list to identify automation entities
      const entities = await this.hass.connection.sendMessagePromise({
        type: "config/entity_registry/list",
      });

      const entityMap = {};
      const automationIds = [];

      if (Array.isArray(entities)) {
        entities.forEach((entity) => {
          entityMap[entity.entity_id] = entity;
          if (entity.entity_id.startsWith("automation.")) {
            automationIds.push(entity.entity_id);
          }
        });
      }

      console.log("[AutoSnooze] Basic entity registry fetched:", Object.keys(entityMap).length, "entities,", automationIds.length, "automations");

      // The basic list doesn't include categories - need to fetch extended entries
      // Fetch extended entry for each automation to get categories
      if (automationIds.length > 0) {
        console.log("[AutoSnooze] Fetching extended entries for automations to get categories...");

        const extendedEntries = await Promise.all(
          automationIds.map(async (entityId) => {
            try {
              const entry = await this.hass.connection.sendMessagePromise({
                type: "config/entity_registry/get",
                entity_id: entityId,
              });
              return entry;
            } catch (err) {
              console.warn("[AutoSnooze] Failed to fetch extended entry for", entityId, err);
              return null;
            }
          })
        );

        // Update entityMap with extended entries that include categories
        let withCategories = 0;
        extendedEntries.forEach((entry) => {
          if (entry && entry.entity_id) {
            entityMap[entry.entity_id] = entry;
            if (entry.categories && Object.keys(entry.categories).length > 0) {
              withCategories++;
            }
          }
        });

        console.log("[AutoSnooze] Extended entries fetched:", extendedEntries.filter(e => e).length, "automations,", withCategories, "with categories");

        if (withCategories > 0) {
          const sample = extendedEntries.find(e => e?.categories && Object.keys(e.categories).length > 0);
          if (sample) {
            console.log("[AutoSnooze] Sample with category:", sample.entity_id, "categories:", JSON.stringify(sample.categories));
          }
        }
      }

      this._entityRegistry = entityMap;
      this._entityRegistryFetched = true;

      // Reset log flags so they log again with real data
      this._categoryCountLogged = false;
      this._getAutomationsLogged = false;
      this._automationCategoryLogged = false;

      // Force re-render now that we have the data
      this.requestUpdate();
    } catch (err) {
      console.warn("[AutoSnooze] Failed to fetch entity registry:", err);
    }
  }

  updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has("hass") && this.hass?.connection) {
      if (!this._labelsFetched) {
        this._fetchLabelRegistry();
      }
      if (!this._categoriesFetched) {
        this._fetchCategoryRegistry();
      }
      if (!this._entityRegistryFetched) {
        this._fetchEntityRegistry();
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._interval !== null) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  static getConfigElement() {
    return document.createElement("autosnooze-card-editor");
  }

  static getStubConfig() {
    return { title: "AutoSnooze" };
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-card {
      padding: 16px;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 1.2em;
      font-weight: 500;
    }
    .header ha-icon {
      color: var(--primary-color);
    }
    .status-summary {
      margin-left: auto;
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }

    /* Section A: Snooze Setup */
    .snooze-setup {
      margin-bottom: 20px;
    }

    /* Filter Tabs */
    .filter-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--divider-color);
      padding-bottom: 8px;
      flex-wrap: wrap;
    }
    .tab {
      padding: 6px 16px;
      border-radius: 16px;
      cursor: pointer;
      font-size: 0.9em;
      background: transparent;
      border: 1px solid var(--divider-color);
      color: var(--primary-text-color);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .tab:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
      opacity: 0.8;
    }
    .tab.active {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }
    .tab-count {
      background: rgba(0, 0, 0, 0.2);
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 0.8em;
    }
    .tab.active .tab-count {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Search */
    .search-box {
      margin-bottom: 12px;
    }
    .search-box input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      box-sizing: border-box;
      font-size: 0.95em;
    }
    .search-box input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    /* Selection List */
    .selection-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .list-empty {
      padding: 20px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 0.9em;
    }
    .list-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      cursor: pointer;
      border-bottom: 1px solid var(--divider-color);
      transition: background 0.2s;
      min-height: 48px;
    }
    .list-item:last-child {
      border-bottom: none;
    }
    .list-item:hover {
      background: var(--secondary-background-color);
    }
    .list-item.selected {
      background: rgba(var(--rgb-primary-color), 0.1);
    }
    .list-item ha-icon {
      color: var(--primary-color);
      flex-shrink: 0;
    }
    .list-item-content {
      flex: 1;
      min-width: 0;
    }
    .list-item-name {
      font-size: 0.95em;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .list-item-meta {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .list-item-meta ha-icon {
      --mdc-icon-size: 12px;
      margin-right: 4px;
      vertical-align: middle;
    }

    /* Group Headers */
    .group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: var(--secondary-background-color);
      cursor: pointer;
      font-weight: 500;
      font-size: 0.9em;
      border-bottom: 1px solid var(--divider-color);
    }
    .group-header:hover {
      background: var(--divider-color);
    }
    .group-header ha-icon {
      transition: transform 0.2s;
    }
    .group-header.expanded ha-icon {
      transform: rotate(90deg);
    }
    .group-badge {
      margin-left: auto;
      padding: 2px 8px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-radius: 12px;
      font-size: 0.8em;
    }

    /* Selection Actions */
    .selection-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      border-radius: 8px;
      align-items: center;
      font-size: 0.9em;
    }
    .selection-actions span {
      flex: 1;
      color: var(--secondary-text-color);
    }
    .select-all-btn {
      padding: 4px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.85em;
      transition: all 0.2s;
    }
    .select-all-btn:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }

    /* Duration Section */
    .duration-section-header {
      font-size: 0.9em;
      font-weight: 500;
      margin-bottom: 8px;
      color: var(--secondary-text-color);
    }

    /* Duration Pills */
    .duration-selector {
      margin-bottom: 12px;
    }
    .duration-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .pill {
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      cursor: pointer;
      font-size: 0.9em;
      transition: all 0.2s;
    }
    .pill:hover {
      border-color: var(--primary-color);
    }
    .pill.active {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }

    /* Duration Input */
    .custom-duration-input {
      margin-top: 8px;
    }
    .duration-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.95em;
      box-sizing: border-box;
    }
    .duration-input:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    .duration-input.invalid {
      border-color: #f44336;
    }
    .duration-help {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-top: 4px;
    }
    .duration-preview {
      font-size: 0.85em;
      color: var(--primary-color);
      font-weight: 500;
      margin-top: 4px;
    }

    /* Snooze Button */
    .snooze-btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      font-size: 1em;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .snooze-btn:hover:not(:disabled) {
      opacity: 0.9;
    }
    .snooze-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    /* Section B: Active Snoozes */
    .snooze-list {
      border: 2px solid #ff9800;
      border-radius: 8px;
      background: rgba(255, 152, 0, 0.05);
      padding: 12px;
      margin-top: 20px;
    }
    .list-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      margin-bottom: 12px;
      font-size: 1em;
    }
    .list-header ha-icon {
      color: #ff9800;
    }

    /* Paused Item */
    .paused-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--card-background-color);
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .paused-item:last-of-type {
      margin-bottom: 12px;
    }
    .paused-icon {
      color: var(--secondary-text-color);
      opacity: 0.6;
    }
    .paused-info {
      flex: 1;
    }
    .paused-name {
      font-weight: 500;
      margin-bottom: 4px;
    }
    .paused-time {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .countdown {
      font-size: 0.9em;
      color: #ff9800;
      font-weight: 500;
      white-space: nowrap;
    }
    .wake-btn {
      padding: 6px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.85em;
      transition: all 0.2s;
    }
    .wake-btn:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }

    /* Wake All Button */
    .wake-all {
      width: 100%;
      padding: 10px;
      border: 1px solid #ff9800;
      border-radius: 6px;
      background: transparent;
      color: #ff9800;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      transition: all 0.2s;
    }
    .wake-all:hover {
      background: #ff9800;
      color: white;
    }

    /* Empty State */
    .empty {
      padding: 20px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 0.9em;
    }

    /* Schedule Mode Toggle */
    .schedule-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      border-radius: 8px;
      cursor: pointer;
    }
    .schedule-toggle label {
      flex: 1;
      cursor: pointer;
      font-size: 0.9em;
    }
    .schedule-toggle input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    /* Schedule Datetime Inputs */
    .schedule-inputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      background: var(--secondary-background-color);
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .datetime-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .datetime-field label {
      font-size: 0.85em;
      color: var(--secondary-text-color);
      font-weight: 500;
    }
    .datetime-field input[type="datetime-local"] {
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.95em;
    }
    .datetime-field input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    /* Scheduled Snoozes Section */
    .scheduled-list {
      border: 2px solid #2196f3;
      border-radius: 8px;
      background: rgba(33, 150, 243, 0.05);
      padding: 12px;
      margin-top: 12px;
    }
    .scheduled-list .list-header ha-icon {
      color: #2196f3;
    }
    .scheduled-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--card-background-color);
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .scheduled-item:last-of-type {
      margin-bottom: 12px;
    }
    .scheduled-icon {
      color: #2196f3;
      opacity: 0.8;
    }
    .scheduled-time {
      font-size: 0.85em;
      color: #2196f3;
      font-weight: 500;
    }
    .cancel-scheduled-btn {
      padding: 6px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.85em;
      transition: all 0.2s;
    }
    .cancel-scheduled-btn:hover {
      background: #f44336;
      color: white;
      border-color: #f44336;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 20px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
      animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp {
      from {
        transform: translateX(-50%) translateY(100px);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }
  `;

  _getAutomations() {
    if (!this.hass?.states) return [];

    // Debug: log available hass properties on first call
    if (!this._debugLogged) {
      this._debugLogged = true;
      console.log("[AutoSnooze] Card version:", CARD_VERSION);
      console.log("[AutoSnooze] hass.entities available:", !!this.hass.entities, "count:", this.hass.entities ? Object.keys(this.hass.entities).length : 0);
      console.log("[AutoSnooze] hass.areas available:", !!this.hass.areas, "count:", this.hass.areas ? Object.keys(this.hass.areas).length : 0);
      console.log("[AutoSnooze] Label registry (fetched separately):", Object.keys(this._labelRegistry).length, "labels");
      console.log("[AutoSnooze] Entity registry (fetched separately):", Object.keys(this._entityRegistry).length, "entities");
      if (this._entityRegistry) {
        const sampleEntity = Object.keys(this._entityRegistry).find(k => k.startsWith("automation."));
        if (sampleEntity) {
          console.log("[AutoSnooze] Sample entity registry entry:", sampleEntity, this._entityRegistry[sampleEntity]);
        }
      }
      if (this.hass.areas && Object.keys(this.hass.areas).length > 0) {
        console.log("[AutoSnooze] Areas:", Object.entries(this.hass.areas).map(([id, a]) => `${id}: ${a.name}`).join(", "));
      }
    }

    // Debug: Check entity registry state at render time
    const entityRegistrySize = Object.keys(this._entityRegistry || {}).length;
    if (!this._getAutomationsLogged) {
      this._getAutomationsLogged = true;
      console.log("[AutoSnooze] _getAutomations called, _entityRegistry size:", entityRegistrySize);
      console.log("[AutoSnooze] _entityRegistryFetched flag:", this._entityRegistryFetched);
    }

    const automations = Object.keys(this.hass.states)
      .filter((id) => id.startsWith("automation."))
      .map((id) => {
        const state = this.hass.states[id];
        // Use fetched entity registry for full entity data including categories
        const registryEntry = this._entityRegistry?.[id];
        // Fallback to hass.entities for basic info (area_id, labels)
        const hassEntry = this.hass.entities?.[id];
        // Get category from entity registry (categories object with scope keys)
        // The entity registry from WebSocket includes categories: { automation: "category_id" }
        const categories = registryEntry?.categories || {};
        const category_id = categories.automation || null;
        return {
          id,
          name: state.attributes.friendly_name || id.replace("automation.", ""),
          area_id: registryEntry?.area_id || hassEntry?.area_id || null,
          category_id,
          labels: registryEntry?.labels || hassEntry?.labels || [],
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // Debug: Log first automation with category data
    if (!this._automationCategoryLogged && entityRegistrySize > 0) {
      this._automationCategoryLogged = true;
      const withCat = automations.filter(a => a.category_id);
      console.log("[AutoSnooze] After mapping - automations with category_id:", withCat.length);
      if (withCat.length > 0) {
        console.log("[AutoSnooze] First with category:", withCat[0]);
      } else {
        // Log raw registry entry to see actual structure
        const firstAuto = automations[0];
        if (firstAuto) {
          const rawEntry = this._entityRegistry?.[firstAuto.id];
          console.log("[AutoSnooze] Raw registry entry for", firstAuto.id, ":", JSON.stringify(rawEntry, null, 2));
        }
      }
    }

    return automations;
  }

  _getFilteredAutomations() {
    const automations = this._getAutomations();
    const search = this._search.toLowerCase();

    let filtered = automations;
    if (search) {
      filtered = automations.filter(
        (a) =>
          a.name.toLowerCase().includes(search) ||
          a.id.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  _getAreaName(areaId) {
    if (!areaId) return "Unassigned";

    const area = this.hass.areas?.[areaId];
    if (area?.name) return area.name;

    return areaId
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  _getLabelName(labelId) {
    const label = this._labelRegistry[labelId];
    if (label?.name) return label.name;

    return labelId
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  _getGroupedByArea() {
    const automations = this._getFilteredAutomations();
    const groups = {};

    automations.forEach((auto) => {
      const areaName = this._getAreaName(auto.area_id);
      if (!groups[areaName]) groups[areaName] = [];
      groups[areaName].push(auto);
    });

    return Object.entries(groups).sort((a, b) =>
      a[0] === "Unassigned" ? 1 : b[0] === "Unassigned" ? -1 : a[0].localeCompare(b[0])
    );
  }

  _getGroupedByLabel() {
    const automations = this._getFilteredAutomations();
    const groups = {};

    automations.forEach((auto) => {
      if (!auto.labels || auto.labels.length === 0) {
        if (!groups["Unlabeled"]) groups["Unlabeled"] = [];
        groups["Unlabeled"].push(auto);
      } else {
        auto.labels.forEach((labelId) => {
          const labelName = this._getLabelName(labelId);
          if (!groups[labelName]) groups[labelName] = [];
          groups[labelName].push(auto);
        });
      }
    });

    return Object.entries(groups).sort((a, b) =>
      a[0] === "Unlabeled" ? 1 : b[0] === "Unlabeled" ? -1 : a[0].localeCompare(b[0])
    );
  }

  _getAreaCount() {
    const automations = this._getAutomations();
    const areas = new Set();
    automations.forEach((auto) => {
      if (auto.area_id) {
        areas.add(auto.area_id);
      }
    });
    return areas.size;
  }

  _getLabelCount() {
    const automations = this._getAutomations();
    const labels = new Set();
    automations.forEach((auto) => {
      if (auto.labels && auto.labels.length > 0) {
        auto.labels.forEach((l) => labels.add(l));
      }
    });
    return labels.size;
  }

  _getCategoryName(categoryId) {
    if (!categoryId) return "Uncategorized";

    // Look up from category registry first
    const category = this._categoryRegistry[categoryId];
    if (category?.name) return category.name;

    // Fallback: transform ID to readable name
    return categoryId
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  _getGroupedByCategory() {
    const automations = this._getFilteredAutomations();
    const groups = {};

    automations.forEach((auto) => {
      // Get category from entity registry (already fetched in _getAutomations)
      const categoryName = this._getCategoryName(auto.category_id);
      if (!groups[categoryName]) groups[categoryName] = [];
      groups[categoryName].push(auto);
    });

    return Object.entries(groups).sort((a, b) =>
      a[0] === "Uncategorized" ? 1 : b[0] === "Uncategorized" ? -1 : a[0].localeCompare(b[0])
    );
  }

  _getCategoryCount() {
    const automations = this._getAutomations();
    const categories = new Set();
    let withCategory = 0;
    let withoutCategory = 0;
    automations.forEach((auto) => {
      // Use category_id from entity registry (already fetched in _getAutomations)
      if (auto.category_id) {
        categories.add(auto.category_id);
        withCategory++;
      } else {
        withoutCategory++;
      }
    });
    // Debug log once
    if (!this._categoryCountLogged) {
      this._categoryCountLogged = true;
      console.log("[AutoSnooze] Category count:", categories.size, "unique categories,", withCategory, "with category,", withoutCategory, "without");
      if (categories.size > 0) {
        console.log("[AutoSnooze] Categories found:", [...categories]);
      }
    }
    return categories.size;
  }

  _selectAllVisible() {
    const filtered = this._getFilteredAutomations();
    const allIds = filtered.map((a) => a.id);
    const allSelected = allIds.every((id) => this._selected.includes(id));

    if (allSelected) {
      this._selected = this._selected.filter((id) => !allIds.includes(id));
    } else {
      this._selected = [...new Set([...this._selected, ...allIds])];
    }
  }

  _clearSelection() {
    this._selected = [];
  }

  _getPaused() {
    const entity = this.hass?.states["sensor.autosnooze_snoozed_automations"];
    return entity?.attributes?.paused_automations || {};
  }

  _getScheduled() {
    const entity = this.hass?.states["sensor.autosnooze_snoozed_automations"];
    return entity?.attributes?.scheduled_snoozes || {};
  }

  _formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  _formatCountdown(resumeAt) {
    const diff = new Date(resumeAt).getTime() - Date.now();
    if (diff <= 0) return "Waking up...";

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  }

  _toggleSelection(id) {
    if (this._selected.includes(id)) {
      this._selected = this._selected.filter((s) => s !== id);
    } else {
      this._selected = [...this._selected, id];
    }
  }

  _toggleGroupExpansion(group) {
    this._expandedGroups = {
      ...this._expandedGroups,
      [group]: !this._expandedGroups[group],
    };
  }

  _selectGroup(items) {
    const ids = items.map((i) => i.id);
    const allSelected = ids.every((id) => this._selected.includes(id));

    if (allSelected) {
      this._selected = this._selected.filter((id) => !ids.includes(id));
    } else {
      this._selected = [...new Set([...this._selected, ...ids])];
    }
  }

  _setDuration(minutes) {
    this._duration = minutes * 60000;

    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;

    this._customDuration = { days, hours, minutes: mins };

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    this._customDurationInput = parts.join(" ") || "30m";
  }

  _updateCustomDuration() {
    const { days, hours, minutes } = this._customDuration;
    const totalMinutes = days * 1440 + hours * 60 + minutes;
    this._duration = totalMinutes * 60000;
  }

  _parseDurationInput(input) {
    const cleaned = input.toLowerCase().replace(/\s+/g, "");
    if (!cleaned) return null;

    let days = 0;
    let hours = 0;
    let minutes = 0;

    const dayMatch = cleaned.match(/(\d+)\s*d/);
    const hourMatch = cleaned.match(/(\d+)\s*h/);
    const minMatch = cleaned.match(/(\d+)\s*m/);

    if (dayMatch) days = parseInt(dayMatch[1], 10);
    if (hourMatch) hours = parseInt(hourMatch[1], 10);
    if (minMatch) minutes = parseInt(minMatch[1], 10);

    if (!dayMatch && !hourMatch && !minMatch) {
      const plainNum = parseInt(cleaned, 10);
      if (!isNaN(plainNum) && plainNum > 0) {
        minutes = plainNum;
      } else {
        return null;
      }
    }

    if (days === 0 && hours === 0 && minutes === 0) return null;

    return { days, hours, minutes };
  }

  _handleDurationInput(value) {
    this._customDurationInput = value;
    const parsed = this._parseDurationInput(value);
    if (parsed) {
      this._customDuration = parsed;
      this._updateCustomDuration();
    }
  }

  _getDurationPreview() {
    const parsed = this._parseDurationInput(this._customDurationInput);
    if (!parsed) return "";
    return this._formatDuration(parsed.days, parsed.hours, parsed.minutes);
  }

  _isDurationValid() {
    return this._parseDurationInput(this._customDurationInput) !== null;
  }

  _showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    this.shadowRoot?.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideUp 0.3s ease-out reverse";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async _snooze() {
    if (this._selected.length === 0 || this._loading) return;

    if (this._scheduleMode) {
      if (!this._resumeAt) {
        this._showToast("Please set a resume time");
        return;
      }
    } else {
      if (this._duration === 0) return;
    }

    this._loading = true;
    try {
      const count = this._selected.length;
      let toastMessage;

      if (this._scheduleMode) {
        const serviceData = {
          entity_id: this._selected,
          resume_at: this._resumeAt,
        };

        if (this._disableAt) {
          serviceData.disable_at = this._disableAt;
        }

        await this.hass.callService("autosnooze", "pause", serviceData);

        if (this._disableAt) {
          toastMessage = `Scheduled ${count} automation${count !== 1 ? "s" : ""} to snooze`;
        } else {
          toastMessage = `Paused ${count} automation${count !== 1 ? "s" : ""} until ${this._formatDateTime(this._resumeAt)}`;
        }
      } else {
        const { days, hours, minutes } = this._customDuration;

        await this.hass.callService("autosnooze", "pause", {
          entity_id: this._selected,
          days,
          hours,
          minutes,
        });

        const durationText = this._formatDuration(days, hours, minutes);
        toastMessage = `Paused ${count} automation${count !== 1 ? "s" : ""} for ${durationText}`;
      }

      this._showToast(toastMessage);
      this._selected = [];
      this._disableAt = "";
      this._resumeAt = "";
    } catch (e) {
      console.error("Snooze failed:", e);
      this._showToast("Failed to pause automations");
    }
    this._loading = false;
  }

  _formatDuration(days, hours, minutes) {
    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
    return parts.join(", ");
  }

  async _wake(entityId) {
    try {
      await this.hass.callService("autosnooze", "cancel", {
        entity_id: entityId,
      });
      this._showToast("Automation resumed");
    } catch (e) {
      console.error("Wake failed:", e);
      this._showToast("Failed to resume automation");
    }
  }

  async _wakeAll() {
    try {
      await this.hass.callService("autosnooze", "cancel_all", {});
      this._showToast("All automations resumed");
    } catch (e) {
      console.error("Wake all failed:", e);
      this._showToast("Failed to resume automations");
    }
  }

  async _cancelScheduled(entityId) {
    try {
      await this.hass.callService("autosnooze", "cancel_scheduled", {
        entity_id: entityId,
      });
      this._showToast("Scheduled snooze cancelled");
    } catch (e) {
      console.error("Cancel scheduled failed:", e);
      this._showToast("Failed to cancel scheduled snooze");
    }
  }

  _renderSelectionList() {
    const filtered = this._getFilteredAutomations();

    if (this._filterTab === "all") {
      if (filtered.length === 0) {
        return html`<div class="list-empty">No automations found</div>`;
      }
      // All tab: show only automation name, no complementary metadata
      return filtered.map((a) => html`
        <div
          class="list-item ${this._selected.includes(a.id) ? "selected" : ""}"
          @click=${() => this._toggleSelection(a.id)}
        >
          <ha-icon
            icon=${this._selected.includes(a.id)
              ? "mdi:checkbox-marked"
              : "mdi:checkbox-blank-outline"}
          ></ha-icon>
          <div class="list-item-content">
            <div class="list-item-name">${a.name}</div>
          </div>
        </div>
      `);
    }

    // Grouped views: areas, categories, labels
    const grouped =
      this._filterTab === "areas"
        ? this._getGroupedByArea()
        : this._filterTab === "categories"
          ? this._getGroupedByCategory()
          : this._getGroupedByLabel();

    if (grouped.length === 0) {
      return html`<div class="list-empty">No automations found</div>`;
    }

    return grouped.map(([groupName, items]) => {
      const expanded = this._expandedGroups[groupName] !== false;
      const groupSelected = items.every((i) => this._selected.includes(i.id));
      const someSelected = items.some((i) => this._selected.includes(i.id)) && !groupSelected;

      return html`
        <div
          class="group-header ${expanded ? "expanded" : ""}"
          @click=${() => this._toggleGroupExpansion(groupName)}
        >
          <ha-icon icon="mdi:chevron-right"></ha-icon>
          <span>${groupName}</span>
          <span class="group-badge">${items.length}</span>
          <ha-icon
            icon=${groupSelected
              ? "mdi:checkbox-marked"
              : someSelected
                ? "mdi:checkbox-intermediate"
                : "mdi:checkbox-blank-outline"}
            @click=${(e) => {
              e.stopPropagation();
              this._selectGroup(items);
            }}
          ></ha-icon>
        </div>
        ${expanded
          ? items.map((a) => {
              // Areas tab: no metadata (area is the group header, no labels per requirements)
              // Categories tab: show area as complementary info
              // Labels tab: show area as complementary info
              const showArea = (this._filterTab === "labels" || this._filterTab === "categories") && a.area_id;
              const metaInfo = showArea ? this._getAreaName(a.area_id) : null;

              return html`
                <div
                  class="list-item ${this._selected.includes(a.id) ? "selected" : ""}"
                  @click=${() => this._toggleSelection(a.id)}
                >
                  <ha-icon
                    icon=${this._selected.includes(a.id)
                      ? "mdi:checkbox-marked"
                      : "mdi:checkbox-blank-outline"}
                  ></ha-icon>
                  <div class="list-item-content">
                    <div class="list-item-name">${a.name}</div>
                    ${metaInfo
                      ? html`<div class="list-item-meta">
                          <ha-icon icon="mdi:home-outline"></ha-icon>${metaInfo}
                        </div>`
                      : ""}
                  </div>
                </div>
              `;
            })
          : ""}
      `;
    });
  }

  render() {
    const paused = this._getPaused();
    const pausedCount = Object.keys(paused).length;
    const scheduled = this._getScheduled();
    const scheduledCount = Object.keys(scheduled).length;

    const durations = [
      { label: "30m", minutes: 30 },
      { label: "1h", minutes: 60 },
      { label: "4h", minutes: 240 },
      { label: "1 day", minutes: 1440 },
      { label: "Custom", minutes: null },
    ];

    const currentDuration =
      this._customDuration.days * 1440 +
      this._customDuration.hours * 60 +
      this._customDuration.minutes;

    const selectedDuration = durations.find((d) => d.minutes === currentDuration);
    const durationPreview = this._getDurationPreview();
    const durationValid = this._isDurationValid();

    return html`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:sleep"></ha-icon>
          ${this.config?.title || "AutoSnooze"}
          ${pausedCount > 0 || scheduledCount > 0
            ? html`<span class="status-summary"
                >${pausedCount > 0 ? `${pausedCount} active` : ""}${pausedCount > 0 && scheduledCount > 0 ? ", " : ""}${scheduledCount > 0 ? `${scheduledCount} scheduled` : ""}</span
              >`
            : ""}
        </div>

        <!-- Section A: Snooze Setup -->
        <div class="snooze-setup">
          <!-- Filter Tabs -->
          <div class="filter-tabs">
            <button
              class="tab ${this._filterTab === "all" ? "active" : ""}"
              @click=${() => (this._filterTab = "all")}
            >
              All
              <span class="tab-count">${this._getAutomations().length}</span>
            </button>
            <button
              class="tab ${this._filterTab === "areas" ? "active" : ""}"
              @click=${() => (this._filterTab = "areas")}
            >
              Areas
              <span class="tab-count">${this._getAreaCount()}</span>
            </button>
            <button
              class="tab ${this._filterTab === "categories" ? "active" : ""}"
              @click=${() => (this._filterTab = "categories")}
            >
              Categories
              <span class="tab-count">${this._getCategoryCount()}</span>
            </button>
            <button
              class="tab ${this._filterTab === "labels" ? "active" : ""}"
              @click=${() => (this._filterTab = "labels")}
            >
              Labels
              <span class="tab-count">${this._getLabelCount()}</span>
            </button>
          </div>

          <!-- Search -->
          <div class="search-box">
            <input
              type="text"
              placeholder="Search automations..."
              .value=${this._search}
              @input=${(e) => (this._search = e.target.value)}
            />
          </div>

          <!-- Selection Actions -->
          ${this._getFilteredAutomations().length > 0
            ? html`
                <div class="selection-actions">
                  <span>${this._selected.length} of ${this._getFilteredAutomations().length} selected</span>
                  <button class="select-all-btn" @click=${() => this._selectAllVisible()}>
                    ${this._getFilteredAutomations().every((a) => this._selected.includes(a.id))
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  ${this._selected.length > 0
                    ? html`<button class="select-all-btn" @click=${() => this._clearSelection()}>Clear</button>`
                    : ""}
                </div>
              `
            : ""}

          <!-- Selection List -->
          <div class="selection-list">${this._renderSelectionList()}</div>

          <!-- Schedule Mode Toggle -->
          <div class="schedule-toggle" @click=${() => (this._scheduleMode = !this._scheduleMode)}>
            <ha-icon icon=${this._scheduleMode ? "mdi:calendar-clock" : "mdi:timer-outline"}></ha-icon>
            <label>${this._scheduleMode ? "Schedule Mode" : "Duration Mode"}</label>
            <input
              type="checkbox"
              .checked=${this._scheduleMode}
              @click=${(e) => e.stopPropagation()}
              @change=${(e) => (this._scheduleMode = e.target.checked)}
            />
          </div>

          ${this._scheduleMode
            ? html`
                <!-- Schedule Datetime Inputs -->
                <div class="schedule-inputs">
                  <div class="datetime-field">
                    <label>Snooze Start (optional - leave empty to disable now)</label>
                    <input
                      type="datetime-local"
                      .value=${this._disableAt}
                      @input=${(e) => (this._disableAt = e.target.value)}
                    />
                  </div>
                  <div class="datetime-field">
                    <label>Snooze End (required)</label>
                    <input
                      type="datetime-local"
                      .value=${this._resumeAt}
                      @input=${(e) => (this._resumeAt = e.target.value)}
                    />
                  </div>
                </div>
              `
            : html`
                <!-- Duration Selector -->
                <div class="duration-selector">
                  <div class="duration-section-header">Snooze Duration</div>
                  <div class="duration-pills">
                    ${durations.map(
                      (d) => html`
                        <button
                          class="pill ${d.minutes === null
                            ? this._showCustomInput ? "active" : ""
                            : !this._showCustomInput && selectedDuration === d ? "active" : ""}"
                          @click=${() => {
                            if (d.minutes === null) {
                              this._showCustomInput = !this._showCustomInput;
                            } else {
                              this._showCustomInput = false;
                              this._setDuration(d.minutes);
                            }
                          }}
                        >
                          ${d.label}
                        </button>
                      `
                    )}
                  </div>

                  ${this._showCustomInput ? html`
                    <div class="custom-duration-input">
                      <input
                        type="text"
                        class="duration-input ${!durationValid ? "invalid" : ""}"
                        placeholder="e.g. 2h30m, 1d, 45m"
                        .value=${this._customDurationInput}
                        @input=${(e) => this._handleDurationInput(e.target.value)}
                      />
                      ${durationPreview && durationValid
                        ? html`<div class="duration-preview">Duration: ${durationPreview}</div>`
                        : html`<div class="duration-help">Enter duration: 30m, 2h, 4h30m, 1d, 1d2h</div>`}
                    </div>
                  ` : ""}
                </div>
              `}

          <!-- Snooze Button -->
          <button
            class="snooze-btn"
            ?disabled=${this._selected.length === 0 ||
            (!this._scheduleMode && !this._isDurationValid()) ||
            (this._scheduleMode && !this._resumeAt) ||
            this._loading}
            @click=${this._snooze}
          >
            ${this._loading
              ? "Snoozing..."
              : this._scheduleMode
                ? `Schedule${this._selected.length > 0 ? ` (${this._selected.length})` : ""}`
                : `Snooze${this._selected.length > 0 ? ` (${this._selected.length})` : ""}`}
          </button>
        </div>

        <!-- Section B: Active Snoozes -->
        ${pausedCount > 0
          ? html`
              <div class="snooze-list">
                <div class="list-header">
                  <ha-icon icon="mdi:bell-sleep"></ha-icon>
                  Snoozed Automations (${pausedCount})
                </div>

                ${Object.entries(paused).map(
                  ([id, data]) => html`
                    <div class="paused-item">
                      <ha-icon class="paused-icon" icon="mdi:sleep"></ha-icon>
                      <div class="paused-info">
                        <div class="paused-name">
                          ${data.friendly_name || id}
                        </div>
                        <div class="paused-time">
                          Waking up in: ${this._formatCountdown(data.resume_at)}
                        </div>
                      </div>
                      <button class="wake-btn" @click=${() => this._wake(id)}>
                        Wake Now
                      </button>
                    </div>
                  `
                )}

                ${pausedCount > 1
                  ? html`
                      <button class="wake-all" @click=${this._wakeAll}>
                        Wake All
                      </button>
                    `
                  : ""}
              </div>
            `
          : ""}

        <!-- Section C: Scheduled Snoozes -->
        ${scheduledCount > 0
          ? html`
              <div class="scheduled-list">
                <div class="list-header">
                  <ha-icon icon="mdi:calendar-clock"></ha-icon>
                  Scheduled Snoozes (${scheduledCount})
                </div>

                ${Object.entries(scheduled).map(
                  ([id, data]) => html`
                    <div class="scheduled-item">
                      <ha-icon class="scheduled-icon" icon="mdi:clock-outline"></ha-icon>
                      <div class="paused-info">
                        <div class="paused-name">
                          ${data.friendly_name || id}
                        </div>
                        <div class="scheduled-time">
                          Disables: ${this._formatDateTime(data.disable_at || "now")}
                        </div>
                        <div class="paused-time">
                          Resumes: ${this._formatDateTime(data.resume_at)}
                        </div>
                      </div>
                      <button class="cancel-scheduled-btn" @click=${() => this._cancelScheduled(id)}>
                        Cancel
                      </button>
                    </div>
                  `
                )}
              </div>
            `
          : ""}
      </ha-card>
    `;
  }

  getCardSize() {
    const paused = this._getPaused();
    const scheduled = this._getScheduled();
    return 4 + Object.keys(paused).length + Object.keys(scheduled).length;
  }

  setConfig(config) {
    this.config = config;
  }
}

// Register custom elements
customElements.define("autosnooze-card-editor", AutomationPauseCardEditor);
customElements.define("autosnooze-card", AutomationPauseCard);

// Register for the manual card picker
try {
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "autosnooze-card",
    name: "AutoSnooze Card",
    description: `Temporarily pause automations with area and label filtering (v${CARD_VERSION})`,
    preview: true,
  });
  console.log(`[AutoSnooze] Card registered, version ${CARD_VERSION}`);
} catch (e) {
  console.warn("customCards registration failed", e);
}
