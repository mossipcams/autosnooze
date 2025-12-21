import { LitElement, html, css } from "lit";

// Version 0.1.0 - Beta release, fresh version start
const CARD_VERSION = "0.1.0";

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
    _disableAtMonth: { state: true },
    _disableAtDay: { state: true },
    _disableAtTime: { state: true },
    _resumeAtMonth: { state: true },
    _resumeAtDay: { state: true },
    _resumeAtTime: { state: true },
    _labelRegistry: { state: true },
    _categoryRegistry: { state: true },
    _entityRegistry: { state: true },
    _showCustomInput: { state: true },
    _automationsCache: { state: true },
    _automationsCacheKey: { state: true },
    _wakeAllPending: { state: true },
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
    this._disableAtMonth = "";
    this._disableAtDay = "";
    this._disableAtTime = "";
    this._resumeAtMonth = "";
    this._resumeAtDay = "";
    this._resumeAtTime = "";
    this._labelRegistry = {};
    this._categoryRegistry = {};
    this._entityRegistry = {};
    this._showCustomInput = false;
    this._interval = null;
    this._syncTimeout = null;
    this._labelsFetched = false;
    this._categoriesFetched = false;
    this._entityRegistryFetched = false;
    this._automationsCache = null;
    this._automationsCacheKey = null;
    this._lastHassStates = null;
    this._searchTimeout = null;
    this._wakeAllPending = false;
    this._wakeAllTimeout = null;
  }

  connectedCallback() {
    super.connectedCallback();

    if (this._interval) {
      window.clearInterval(this._interval);
      this._interval = null;
    }
    if (this._syncTimeout) {
      window.clearTimeout(this._syncTimeout);
      this._syncTimeout = null;
    }

    // Synchronize countdown updates to second boundaries for consistent display
    this._startSynchronizedCountdown();

    this._fetchLabelRegistry();
    this._fetchCategoryRegistry();
    this._fetchEntityRegistry();
  }

  _startSynchronizedCountdown() {
    // Calculate milliseconds until the next second boundary
    const now = Date.now();
    const msUntilNextSecond = 1000 - (now % 1000);

    // Wait until the next second boundary, then start the interval
    this._syncTimeout = window.setTimeout(() => {
      this._syncTimeout = null;
      // Trigger an immediate update at the second boundary
      this._updateCountdownIfNeeded();

      // Start interval aligned to second boundaries
      this._interval = window.setInterval(() => {
        this._updateCountdownIfNeeded();
      }, 1000);
    }, msUntilNextSecond);
  }

  _updateCountdownIfNeeded() {
    // Update countdown elements directly in DOM to avoid expensive full re-render
    const countdownElements = this.shadowRoot?.querySelectorAll(".countdown[data-resume-at]");
    if (countdownElements && countdownElements.length > 0) {
      countdownElements.forEach((el) => {
        const resumeAt = el.dataset.resumeAt;
        if (resumeAt) {
          el.textContent = this._formatCountdown(resumeAt);
        }
      });
    }
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
    } catch (err) {
      console.warn("[AutoSnooze] Failed to fetch category registry:", err);
    }
  }

  async _fetchEntityRegistry() {
    if (this._entityRegistryFetched || !this.hass?.connection) return;

    try {
      const entities = await this.hass.connection.sendMessagePromise({
        type: "config/entity_registry/list",
      });

      // Build map directly from list response (includes categories data)
      const entityMap = {};
      if (Array.isArray(entities)) {
        entities
          .filter((e) => e.entity_id.startsWith("automation."))
          .forEach((entity) => {
            entityMap[entity.entity_id] = entity;
          });
      }

      this._entityRegistry = entityMap;
      this._entityRegistryFetched = true;
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
    if (this._syncTimeout !== null) {
      clearTimeout(this._syncTimeout);
      this._syncTimeout = null;
    }
    if (this._searchTimeout !== null) {
      clearTimeout(this._searchTimeout);
      this._searchTimeout = null;
    }
    if (this._wakeAllTimeout !== null) {
      clearTimeout(this._wakeAllTimeout);
      this._wakeAllTimeout = null;
    }
  }

  _handleSearchInput(e) {
    const value = e.target.value;
    clearTimeout(this._searchTimeout);
    this._searchTimeout = setTimeout(() => {
      this._search = value;
    }, 300);
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
    .list-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary-color);
      flex-shrink: 0;
    }
    .group-header input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary-color);
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

    /* Pause Group */
    .pause-group {
      background: var(--card-background-color);
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .pause-group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      color: #ff9800;
      font-size: 0.85em;
      border-bottom: 1px solid var(--divider-color);
    }
    .pause-group-header ha-icon {
      --mdc-icon-size: 18px;
    }
    .pause-group-header .countdown {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    /* Paused Item */
    .paused-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
    }
    .paused-item + .paused-item {
      border-top: 1px solid var(--divider-color);
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

    /* Wake All Button - Pending State */
    .wake-all.pending {
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

    /* Schedule Link (Progressive Disclosure) */
    .schedule-link {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 8px 0;
      color: var(--primary-color);
      cursor: pointer;
      font-size: 0.9em;
    }
    .schedule-link:hover {
      text-decoration: underline;
    }
    .schedule-link ha-icon {
      --mdc-icon-size: 18px;
    }

    /* Field Hint */
    .field-hint {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-top: 4px;
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
    .datetime-row {
      display: flex;
      gap: 8px;
    }
    .datetime-row select,
    .datetime-row input[type="time"] {
      padding: 10px 12px;
      border: 1px solid var(--divider-color);
      border-radius: 6px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 0.95em;
    }
    .datetime-row select {
      flex: 1;
      min-width: 0;
    }
    .datetime-row input[type="time"] {
      width: 110px;
      flex-shrink: 0;
    }
    .datetime-row select:focus,
    .datetime-row input:focus {
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
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .toast-undo-btn {
      padding: 4px 12px;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 4px;
      background: transparent;
      color: var(--text-primary-color);
      cursor: pointer;
      font-size: 0.85em;
      font-weight: 500;
      transition: all 0.2s;
    }
    .toast-undo-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.8);
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
    const states = this.hass?.states;
    const entities = this.hass?.entities;
    if (!states) return [];

    // Use reference check for fast cache validation - hass.states is a new object when states change
    const statesRef = states;
    const registryKey = this._entityRegistryFetched;

    // Return cached result if states reference and registry state haven't changed
    if (
      this._lastHassStates === statesRef &&
      this._automationsCacheKey === registryKey &&
      this._automationsCache
    ) {
      return this._automationsCache;
    }

    const automationIds = Object.keys(states).filter((id) =>
      id.startsWith("automation.")
    );

    const result = automationIds
      .map((id) => {
        const state = states[id];
        if (!state) return null;
        const registryEntry = this._entityRegistry?.[id];
        const hassEntry = entities?.[id];
        const categories = registryEntry?.categories || {};
        const category_id = categories.automation || null;
        return {
          id,
          name: state.attributes?.friendly_name || id.replace("automation.", ""),
          area_id: registryEntry?.area_id || hassEntry?.area_id || null,
          category_id,
          labels: registryEntry?.labels || hassEntry?.labels || [],
        };
      })
      .filter((a) => a !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Cache the result with reference and registry state
    this._automationsCache = result;
    this._automationsCacheKey = registryKey;
    this._lastHassStates = statesRef;

    return result;
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

    const category = this._categoryRegistry[categoryId];
    if (category?.name) return category.name;

    return categoryId
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  _getGroupedByCategory() {
    const automations = this._getFilteredAutomations();
    const groups = {};

    automations.forEach((auto) => {
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
    automations.forEach((auto) => {
      if (auto.category_id) {
        categories.add(auto.category_id);
      }
    });
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

  _getPausedGroupedByResumeTime() {
    const paused = this._getPaused();
    const groups = {};

    Object.entries(paused).forEach(([id, data]) => {
      const resumeAt = data.resume_at;
      if (!groups[resumeAt]) {
        groups[resumeAt] = {
          resumeAt,
          disableAt: data.disable_at,
          automations: [],
        };
      }
      groups[resumeAt].automations.push({ id, ...data });
    });

    // Sort groups by resume time (earliest first)
    return Object.values(groups).sort(
      (a, b) => new Date(a.resumeAt).getTime() - new Date(b.resumeAt).getTime()
    );
  }

  _getScheduled() {
    const entity = this.hass?.states["sensor.autosnooze_snoozed_automations"];
    return entity?.attributes?.scheduled_snoozes || {};
  }

  _formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  _formatCountdown(resumeAt) {
    const diff = new Date(resumeAt).getTime() - Date.now();
    if (diff <= 0) return "Resuming...";

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

  _showToast(message, options = {}) {
    const { showUndo = false, onUndo = null } = options;

    // Remove any existing toast
    const existingToast = this.shadowRoot?.querySelector(".toast");
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = "toast";

    if (showUndo && onUndo) {
      const textSpan = document.createElement("span");
      textSpan.textContent = message;
      toast.appendChild(textSpan);

      const undoBtn = document.createElement("button");
      undoBtn.className = "toast-undo-btn";
      undoBtn.textContent = "Undo";
      undoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        onUndo();
        toast.remove();
      });
      toast.appendChild(undoBtn);
    } else {
      toast.textContent = message;
    }

    this.shadowRoot?.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "slideUp 0.3s ease-out reverse";
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  _combineDateTime(month, day, time) {
    if (!month || !day || !time) return null;
    const now = new Date();
    let year = now.getFullYear();
    const paddedMonth = month.padStart(2, "0");
    const paddedDay = day.padStart(2, "0");

    // Create tentative date with current year
    const tentativeDate = new Date(`${year}-${paddedMonth}-${paddedDay}T${time}`);

    // If the date is in the past, use next year
    // Add a small buffer (1 minute) to avoid edge cases at exact current time
    if (tentativeDate.getTime() < now.getTime() - 60000) {
      year += 1;
    }

    return `${year}-${paddedMonth}-${paddedDay}T${time}`;
  }

  _hasResumeAt() {
    return this._resumeAtMonth && this._resumeAtDay && this._resumeAtTime;
  }

  _hasDisableAt() {
    return this._disableAtMonth && this._disableAtDay && this._disableAtTime;
  }

  async _snooze() {
    if (this._selected.length === 0 || this._loading) return;

    if (this._scheduleMode) {
      if (!this._hasResumeAt()) {
        this._showToast("Please set a resume date and time");
        return;
      }

      // Validate schedule dates
      const resumeAt = this._combineDateTime(this._resumeAtMonth, this._resumeAtDay, this._resumeAtTime);
      const disableAt = this._hasDisableAt()
        ? this._combineDateTime(this._disableAtMonth, this._disableAtDay, this._disableAtTime)
        : null;

      const now = Date.now();
      const resumeTime = new Date(resumeAt).getTime();

      // Resume time must be in the future
      if (resumeTime <= now) {
        this._showToast("Resume time must be in the future");
        return;
      }

      // If disable time is set, it must be before resume time
      if (disableAt) {
        const disableTime = new Date(disableAt).getTime();
        if (disableTime >= resumeTime) {
          this._showToast("Pause time must be before resume time");
          return;
        }
      }
    } else {
      if (this._duration === 0) return;
    }

    this._loading = true;
    try {
      const count = this._selected.length;
      const snoozedEntities = [...this._selected];
      const wasScheduleMode = this._scheduleMode;
      const hadDisableAt = this._hasDisableAt();
      let toastMessage;

      if (this._scheduleMode) {
        const resumeAt = this._combineDateTime(this._resumeAtMonth, this._resumeAtDay, this._resumeAtTime);
        const disableAt = this._combineDateTime(this._disableAtMonth, this._disableAtDay, this._disableAtTime);

        const serviceData = {
          entity_id: this._selected,
          resume_at: resumeAt,
        };

        if (disableAt) {
          serviceData.disable_at = disableAt;
        }

        await this.hass.callService("autosnooze", "pause", serviceData);

        if (disableAt) {
          toastMessage = `Scheduled ${count} automation${count !== 1 ? "s" : ""} to pause`;
        } else {
          toastMessage = `Paused ${count} automation${count !== 1 ? "s" : ""} until ${this._formatDateTime(resumeAt)}`;
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

      // Show toast with undo option
      this._showToast(toastMessage, {
        showUndo: true,
        onUndo: async () => {
          try {
            // Cancel the snooze for all entities that were just snoozed
            for (const entityId of snoozedEntities) {
              if (wasScheduleMode && hadDisableAt) {
                // Cancel scheduled snooze
                await this.hass.callService("autosnooze", "cancel_scheduled", {
                  entity_id: entityId,
                });
              } else {
                // Cancel active snooze
                await this.hass.callService("autosnooze", "cancel", {
                  entity_id: entityId,
                });
              }
            }
            // Restore the selection
            this._selected = snoozedEntities;
            this._showToast(`Restored ${count} automation${count !== 1 ? "s" : ""}`);
          } catch (e) {
            console.error("Undo failed:", e);
            this._showToast("Failed to undo");
          }
        },
      });

      this._selected = [];
      this._disableAtMonth = "";
      this._disableAtDay = "";
      this._disableAtTime = "";
      this._resumeAtMonth = "";
      this._resumeAtDay = "";
      this._resumeAtTime = "";
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

  _handleWakeAll = async () => {
    if (this._wakeAllPending) {
      // Second click - execute
      clearTimeout(this._wakeAllTimeout);
      this._wakeAllTimeout = null;
      this._wakeAllPending = false;
      try {
        await this.hass.callService("autosnooze", "cancel_all", {});
        this._showToast("All automations resumed");
      } catch (e) {
        console.error("Wake all failed:", e);
        this._showToast("Failed to resume automations");
      }
    } else {
      // First click - start confirmation
      this._wakeAllPending = true;
      this._wakeAllTimeout = setTimeout(() => {
        this._wakeAllPending = false;
        this._wakeAllTimeout = null;
      }, 3000);
    }
  };

  async _cancelScheduled(entityId) {
    try {
      await this.hass.callService("autosnooze", "cancel_scheduled", {
        entity_id: entityId,
      });
      this._showToast("Scheduled pause cancelled");
    } catch (e) {
      console.error("Cancel scheduled failed:", e);
      this._showToast("Failed to cancel scheduled pause");
    }
  }

  _renderMonthOptions() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((m, i) => html`<option value="${i + 1}">${m}</option>`);
  }

  _renderDayOptions() {
    return Array.from({ length: 31 }, (_, i) => html`<option value="${i + 1}">${i + 1}</option>`);
  }

  _renderSelectionList() {
    const filtered = this._getFilteredAutomations();

    if (this._filterTab === "all") {
      if (filtered.length === 0) {
        return html`<div class="list-empty">No automations found</div>`;
      }
      return filtered.map((a) => html`
        <div
          class="list-item ${this._selected.includes(a.id) ? "selected" : ""}"
          @click=${() => this._toggleSelection(a.id)}
        >
          <input
            type="checkbox"
            .checked=${this._selected.includes(a.id)}
            @click=${(e) => e.stopPropagation()}
            @change=${() => this._toggleSelection(a.id)}
          />
          <div class="list-item-content">
            <div class="list-item-name">${a.name}</div>
          </div>
        </div>
      `);
    }

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
          <input
            type="checkbox"
            .checked=${groupSelected}
            .indeterminate=${someSelected}
            @click=${(e) => e.stopPropagation()}
            @change=${() => this._selectGroup(items)}
          />
        </div>
        ${expanded
          ? items.map((a) => {
              const showArea = this._filterTab === "labels" && a.area_id;
              const metaInfo = showArea ? this._getAreaName(a.area_id) : null;

              return html`
                <div
                  class="list-item ${this._selected.includes(a.id) ? "selected" : ""}"
                  @click=${() => this._toggleSelection(a.id)}
                >
                  <input
                    type="checkbox"
                    .checked=${this._selected.includes(a.id)}
                    @click=${(e) => e.stopPropagation()}
                    @change=${() => this._toggleSelection(a.id)}
                  />
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
    if (!this.hass || !this.config) {
      return html``;
    }

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
              type="search"
              placeholder="Search automations..."
              .value=${this._search}
              @input=${(e) => this._handleSearchInput(e)}
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

          ${this._scheduleMode
            ? html`
                <!-- Schedule Date/Time Inputs -->
                <div class="schedule-inputs">
                  <div class="datetime-field">
                    <label>Pause at:</label>
                    <div class="datetime-row">
                      <select
                        .value=${this._disableAtMonth}
                        @change=${(e) => (this._disableAtMonth = e.target.value)}
                      >
                        <option value="">Month</option>
                        ${this._renderMonthOptions()}
                      </select>
                      <select
                        .value=${this._disableAtDay}
                        @change=${(e) => (this._disableAtDay = e.target.value)}
                      >
                        <option value="">Day</option>
                        ${this._renderDayOptions()}
                      </select>
                      <input
                        type="time"
                        .value=${this._disableAtTime}
                        @input=${(e) => (this._disableAtTime = e.target.value)}
                      />
                    </div>
                    <span class="field-hint">Leave empty to pause immediately</span>
                  </div>
                  <div class="datetime-field">
                    <label>Resume at:</label>
                    <div class="datetime-row">
                      <select
                        .value=${this._resumeAtMonth}
                        @change=${(e) => (this._resumeAtMonth = e.target.value)}
                      >
                        <option value="">Month</option>
                        ${this._renderMonthOptions()}
                      </select>
                      <select
                        .value=${this._resumeAtDay}
                        @change=${(e) => (this._resumeAtDay = e.target.value)}
                      >
                        <option value="">Day</option>
                        ${this._renderDayOptions()}
                      </select>
                      <input
                        type="time"
                        .value=${this._resumeAtTime}
                        @input=${(e) => (this._resumeAtTime = e.target.value)}
                      />
                    </div>
                  </div>
                  <div class="schedule-link" @click=${() => (this._scheduleMode = false)}>
                    <ha-icon icon="mdi:timer-outline"></ha-icon>
                    Back to duration selection
                  </div>
                </div>
              `
            : html`
                <!-- Duration Selector -->
                <div class="duration-selector">
                  <div class="duration-section-header">Pause Duration</div>
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

                  <div class="schedule-link" @click=${() => (this._scheduleMode = true)}>
                    <ha-icon icon="mdi:calendar-clock"></ha-icon>
                    Pick specific date/time instead
                  </div>
                </div>
              `}

          <!-- Pause Button -->
          <button
            class="snooze-btn"
            ?disabled=${this._selected.length === 0 ||
            (!this._scheduleMode && !this._isDurationValid()) ||
            (this._scheduleMode && !this._hasResumeAt()) ||
            this._loading}
            @click=${this._snooze}
          >
            ${this._loading
              ? "Pausing..."
              : this._scheduleMode
                ? `Schedule${this._selected.length > 0 ? ` (${this._selected.length})` : ""}`
                : `Pause${this._selected.length > 0 ? ` (${this._selected.length})` : ""}`}
          </button>
        </div>

        <!-- Section B: Active Pauses -->
        ${pausedCount > 0
          ? html`
              <div class="snooze-list">
                <div class="list-header">
                  <ha-icon icon="mdi:bell-sleep"></ha-icon>
                  Paused Automations (${pausedCount})
                </div>

                ${this._getPausedGroupedByResumeTime().map(
                  (group) => html`
                    <div class="pause-group">
                      <div class="pause-group-header">
                        <ha-icon icon="mdi:timer-outline"></ha-icon>
                        ${group.disableAt
                          ? html`Resumes ${this._formatDateTime(group.resumeAt)}`
                          : html`<span class="countdown" data-resume-at="${group.resumeAt}">${this._formatCountdown(group.resumeAt)}</span>`}
                      </div>
                      ${group.automations.map(
                        (auto) => html`
                          <div class="paused-item">
                            <ha-icon class="paused-icon" icon="mdi:sleep"></ha-icon>
                            <div class="paused-info">
                              <div class="paused-name">${auto.friendly_name || auto.id}</div>
                            </div>
                            <button class="wake-btn" @click=${() => this._wake(auto.id)}>
                              Resume
                            </button>
                          </div>
                        `
                      )}
                    </div>
                  `
                )}

                ${pausedCount > 1
                  ? html`
                      <button
                        class="wake-all ${this._wakeAllPending ? "pending" : ""}"
                        @click=${this._handleWakeAll}
                      >
                        ${this._wakeAllPending ? "Confirm Resume All" : "Resume All"}
                      </button>
                    `
                  : ""}
              </div>
            `
          : ""}

        <!-- Section C: Scheduled Pauses -->
        ${scheduledCount > 0
          ? html`
              <div class="scheduled-list">
                <div class="list-header">
                  <ha-icon icon="mdi:calendar-clock"></ha-icon>
                  Scheduled Pauses (${scheduledCount})
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
if (!customElements.get("autosnooze-card-editor")) {
  customElements.define("autosnooze-card-editor", AutomationPauseCardEditor);
}
if (!customElements.get("autosnooze-card")) {
  customElements.define("autosnooze-card", AutomationPauseCard);
}

// Register for the manual card picker
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "autosnooze-card")) {
  window.customCards.push({
    type: "autosnooze-card",
    name: "AutoSnooze Card",
    description: `Temporarily pause automations with area and label filtering (v${CARD_VERSION})`,
    preview: true,
  });
}
