import { LitElement, html, css } from "lit";

const CARD_VERSION = "0.2.5"; // x-release-please-version

// ============================================================================
// CONSTANTS
// ============================================================================
const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60000,
  HOUR: 3600000,
  DAY: 86400000,
};

const MINUTES_PER = {
  HOUR: 60,
  DAY: 1440,
};

const UI_TIMING = {
  SEARCH_DEBOUNCE_MS: 300,
  TOAST_FADE_MS: 300,
  WAKE_ALL_CONFIRM_MS: 3000,
  TOAST_DURATION_MS: 5000,
  COUNTDOWN_INTERVAL_MS: 1000,
  // Buffer for time validation to prevent race conditions between frontend and backend
  // This ensures times very close to "now" are rejected by frontend before reaching backend
  TIME_VALIDATION_BUFFER_MS: 5000,
};

const DEFAULT_DURATIONS = [
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "4h", minutes: 240 },
  { label: "1 day", minutes: 1440 },
  { label: "Custom", minutes: null },
];

const DEFAULT_SNOOZE_MINUTES = 30;

// Error translation key to user-friendly message mapping
const ERROR_MESSAGES = {
  not_automation: "Failed to snooze: One or more selected items are not automations",
  invalid_duration: "Failed to snooze: Please specify a valid duration (days, hours, or minutes)",
  resume_time_past: "Failed to snooze: Resume time must be in the future",
  disable_after_resume: "Failed to snooze: Snooze time must be before resume time",
};

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
        <label for="title-input">Title</label>
        <input
          id="title-input"
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
    _disableAtDate: { state: true },
    _disableAtTime: { state: true },
    _resumeAtDate: { state: true },
    _resumeAtTime: { state: true },
    _labelRegistry: { state: true },
    _categoryRegistry: { state: true },
    _entityRegistry: { state: true },
    _showCustomInput: { state: true },
    _automationsCache: { state: true },
    _automationsCacheKey: { state: true },
    _wakeAllPending: { state: true },
  };

  /**
   * Smart update check to prevent infinite re-renders.
   * Only triggers re-render when relevant state actually changes.
   */
  shouldUpdate(changedProps) {
    // Always update for non-hass property changes (internal state)
    if (!changedProps.has("hass")) {
      return true;
    }

    const oldHass = changedProps.get("hass");
    const newHass = this.hass;

    // First render or hass became available/unavailable
    if (!oldHass || !newHass) {
      return true;
    }

    // Check if autosnooze sensor state changed (paused/scheduled automations)
    const oldSensor = oldHass.states?.["sensor.autosnooze_snoozed_automations"];
    const newSensor = newHass.states?.["sensor.autosnooze_snoozed_automations"];
    if (oldSensor !== newSensor) {
      return true;
    }

    // Check if entity registry changed (affects grouping by area/labels)
    if (oldHass.entities !== newHass.entities) {
      return true;
    }

    // Check if areas changed
    if (oldHass.areas !== newHass.areas) {
      return true;
    }

    // Check if any automation entity states changed
    // We need to check all automations since any could be in the visible list
    const newStates = newHass.states || {};
    const oldStates = oldHass.states || {};

    for (const entityId of Object.keys(newStates)) {
      if (entityId.startsWith("automation.")) {
        if (oldStates[entityId] !== newStates[entityId]) {
          return true;
        }
      }
    }

    // Check if any automation was removed
    for (const entityId of Object.keys(oldStates)) {
      if (entityId.startsWith("automation.") && !newStates[entityId]) {
        return true;
      }
    }

    // No relevant changes detected
    return false;
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

  constructor() {
    super();
    this.hass = {};
    this.config = {};
    this._selected = [];
    this._duration = DEFAULT_SNOOZE_MINUTES * TIME_MS.MINUTE;
    this._customDuration = { days: 0, hours: 0, minutes: DEFAULT_SNOOZE_MINUTES };
    this._customDurationInput = "30m";
    this._loading = false;
    this._search = "";
    this._filterTab = "all";
    this._expandedGroups = {};
    this._scheduleMode = false;
    this._disableAtDate = "";
    this._disableAtTime = "";
    this._resumeAtDate = "";
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
    this._toastTimeout = null;
    this._toastFadeTimeout = null;
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
      }, UI_TIMING.COUNTDOWN_INTERVAL_MS);
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

  async _fetchRegistry(config) {
    const { fetchedFlag, messageType, messageParams, idKey, targetProp, filterFn, logName } = config;

    if (this[fetchedFlag] || !this.hass?.connection) return;

    try {
      const message = { type: messageType, ...messageParams };
      const items = await this.hass.connection.sendMessagePromise(message);

      const itemMap = {};
      if (Array.isArray(items)) {
        const filtered = filterFn ? items.filter(filterFn) : items;
        filtered.forEach((item) => {
          itemMap[item[idKey]] = item;
        });
      }

      this[targetProp] = itemMap;
      this[fetchedFlag] = true;
    } catch (err) {
      console.warn(`[AutoSnooze] Failed to fetch ${logName}:`, err);
    }
  }

  async _fetchLabelRegistry() {
    await this._fetchRegistry({
      fetchedFlag: "_labelsFetched",
      messageType: "config/label_registry/list",
      messageParams: {},
      idKey: "label_id",
      targetProp: "_labelRegistry",
      filterFn: null,
      logName: "label registry",
    });
  }

  async _fetchCategoryRegistry() {
    await this._fetchRegistry({
      fetchedFlag: "_categoriesFetched",
      messageType: "config/category_registry/list",
      messageParams: { scope: "automation" },
      idKey: "category_id",
      targetProp: "_categoryRegistry",
      filterFn: null,
      logName: "category registry",
    });
  }

  async _fetchEntityRegistry() {
    await this._fetchRegistry({
      fetchedFlag: "_entityRegistryFetched",
      messageType: "config/entity_registry/list",
      messageParams: {},
      idKey: "entity_id",
      targetProp: "_entityRegistry",
      filterFn: (e) => e.entity_id.startsWith("automation."),
      logName: "entity registry",
    });
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
    if (this._toastTimeout !== null) {
      clearTimeout(this._toastTimeout);
      this._toastTimeout = null;
    }
    if (this._toastFadeTimeout !== null) {
      clearTimeout(this._toastFadeTimeout);
      this._toastFadeTimeout = null;
    }
  }

  _handleSearchInput(e) {
    const value = e.target.value;
    clearTimeout(this._searchTimeout);
    this._searchTimeout = setTimeout(() => {
      this._search = value;
    }, UI_TIMING.SEARCH_DEBOUNCE_MS);
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
      --snooze-primary: var(--primary-color, #2196f3);
      --snooze-warning: var(--warning-color, #ff9800);
      --snooze-bg: var(--card-background-color);
      --snooze-secondary-bg: var(--secondary-background-color);
    }

    ha-card {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* =========================
       HEADER & TOP BAR
       ========================= */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 1.2rem;
      font-weight: 500;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header ha-icon {
      color: var(--snooze-primary);
    }
    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
      background: rgba(var(--rgb-primary-text-color), 0.05);
      color: var(--secondary-text-color);
    }

    /* =========================
       FILTER TABS (Scrollable)
       ========================= */
    .filter-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 4px; /* Space for scrollbar if visible */
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE/Edge */
      margin: 0 -16px; /* Bleed to edges */
      padding: 0 16px 8px 16px;
    }
    .filter-tabs::-webkit-scrollbar {
      display: none;
    }

    .tab {
      flex: 0 0 auto; /* Don't shrink */
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      background: var(--snooze-secondary-bg);
      border: 1px solid transparent;
      color: var(--primary-text-color);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .tab.active {
      background: var(--snooze-primary);
      color: var(--text-primary-color);
    }
    .tab-count {
      background: rgba(0,0,0,0.15);
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 0.75em;
    }
    .tab.active .tab-count {
      background: rgba(255,255,255,0.25);
    }

    /* =========================
       SEARCH & SELECTION
       ========================= */
    .search-box input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      background: var(--snooze-secondary-bg);
      color: var(--primary-text-color);
      box-sizing: border-box;
      font-size: 1rem;
    }
    .search-box input:focus {
      outline: 2px solid var(--snooze-primary);
      background: var(--snooze-bg);
    }

    .selection-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      color: var(--secondary-text-color);
      margin-bottom: 8px;
    }
    .text-btn {
      background: none;
      border: none;
      color: var(--snooze-primary);
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
    }

    .selection-list {
      max-height: 40vh; /* Responsive height */
      overflow-y: auto;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
    }

    .list-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      border: none;
      border-bottom: 1px solid var(--divider-color);
      background: transparent;
      width: 100%;
      text-align: left;
      color: var(--primary-text-color);
      transition: background 0.1s;
    }
    .list-item:active {
      background: rgba(var(--rgb-primary-color), 0.1);
    }
    .list-item.selected {
      background: rgba(var(--rgb-primary-color), 0.08);
    }
    /* Hide default checkbox, use custom styling logic if desired,
       but standard checkbox is reliable */
    .list-item input[type="checkbox"] {
      width: 20px;
      height: 20px;
      accent-color: var(--snooze-primary);
    }
    .list-item-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .list-item-name {
      font-size: 0.95rem;
      font-weight: 500;
    }
    .list-item-meta {
      font-size: 0.8rem;
      color: var(--secondary-text-color);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Group Headers */
    .group-header {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--snooze-secondary-bg);
      border: none;
      border-bottom: 1px solid var(--divider-color);
      color: var(--primary-text-color);
      font-weight: 600;
      cursor: pointer;
    }
    .group-badge {
      margin-left: auto;
      background: var(--divider-color);
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.75rem;
    }

    /* =========================
       DURATION SELECTOR
       ========================= */
    .duration-section-header {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--secondary-text-color);
      margin-bottom: 10px;
    }

    .duration-pills {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }
    .pill {
      padding: 10px;
      border-radius: 12px;
      border: 1px solid var(--divider-color);
      background: var(--snooze-bg);
      color: var(--primary-text-color);
      cursor: pointer;
      font-weight: 500;
    }
    .pill.active {
      background: var(--snooze-primary);
      color: white;
      border-color: var(--snooze-primary);
    }

    /* Custom Input */
    .custom-duration-input {
      margin-top: 12px;
    }
    .duration-input {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      background: var(--snooze-bg);
      color: var(--primary-text-color);
      font-size: 1.1rem; /* Larger font for numbers */
      box-sizing: border-box;
    }

    /* Schedule Mode Inputs */
    .schedule-inputs {
      background: var(--snooze-secondary-bg);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .datetime-field label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--secondary-text-color);
    }
    .datetime-row {
      display: flex;
      gap: 10px;
    }
    .datetime-row select,
    .datetime-row input {
      padding: 12px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--snooze-bg);
      color: var(--primary-text-color);
      font-size: 1rem;
    }
    .datetime-row select {
      flex: 2; /* Date takes more space */
    }
    .datetime-row input {
      flex: 1; /* Time takes less */
    }

    .schedule-link {
      background: none;
      border: none;
      color: var(--snooze-primary);
      padding: 12px 0;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      font-size: 0.9rem;
    }

    /* =========================
       MAIN SNOOZE BUTTON
       ========================= */
    .snooze-btn {
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 14px;
      background: var(--snooze-primary);
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(var(--rgb-primary-color), 0.3);
      transition: transform 0.1s;
    }
    .snooze-btn:active {
      transform: scale(0.98);
    }
    .snooze-btn:disabled {
      opacity: 0.5;
      box-shadow: none;
    }

    /* =========================
       ACTIVE SNOOZES SECTION
       ========================= */
    .snooze-list, .scheduled-list {
      border-top: 1px solid var(--divider-color);
      padding-top: 16px;
      margin-top: 8px;
    }

    .list-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 12px;
      color: var(--snooze-warning);
    }

    .pause-group {
      background: var(--snooze-secondary-bg);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 12px;
      border: 1px solid var(--divider-color);
    }

    .pause-group-header {
      padding: 10px 16px;
      background: rgba(255, 152, 0, 0.1);
      color: #e65100;
      font-weight: 500;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .paused-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 1px solid var(--divider-color);
    }
    .paused-info {
      display: flex;
      flex-direction: column;
    }
    .paused-name {
      font-weight: 500;
    }
    .paused-time {
      font-size: 0.8rem;
      color: var(--secondary-text-color);
    }

    .wake-btn, .cancel-scheduled-btn {
      padding: 8px 16px;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      background: var(--snooze-bg);
      font-weight: 500;
      cursor: pointer;
    }

    .wake-all {
      width: 100%;
      padding: 12px;
      margin-top: 8px;
      background: transparent;
      border: 1px solid var(--snooze-warning);
      color: var(--snooze-warning);
      border-radius: 8px;
      font-weight: 600;
    }

    /* =========================
       TOAST NOTIFICATION
       ========================= */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 20px;
      right: 20px;
      background: #323232;
      color: white;
      padding: 16px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999;
      font-size: 0.95rem;
    }
    .toast-undo-btn {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.3);
      color: #90caf9;
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }

    /* =========================
       MOBILE SPECIFIC OVERRIDES
       ========================= */
    @media (max-width: 480px) {
      ha-card {
        padding: 12px;
        border-radius: 0; /* Flush on very small screens? Optional. */
        box-shadow: none;
      }

      /* Stack the Date/Time inputs vertically on mobile for larger touch targets */
      .datetime-row {
        flex-direction: column;
        gap: 8px;
      }
      .datetime-row select,
      .datetime-row input {
        width: 100%;
        flex: none;
        padding: 14px; /* Taller tap target */
      }

      /* Make tabs spill off screen with padding */
      .filter-tabs {
        margin: 0 -12px;
        padding: 0 12px 12px 12px;
      }

      /* Make list items slightly taller */
      .list-item {
        padding: 14px 12px;
      }

      /* Active snoozes cleanup */
      .paused-item {
        padding: 14px 12px;
      }

      .snooze-btn {
        position: sticky;
        bottom: 12px;
        z-index: 10;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
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

  _formatRegistryId(id) {
    // Convert snake_case IDs to Title Case (e.g., "living_room" -> "Living Room")
    return id
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  _getAreaName(areaId) {
    if (!areaId) return "Unassigned";
    return this.hass.areas?.[areaId]?.name || this._formatRegistryId(areaId);
  }

  _getLabelName(labelId) {
    return this._labelRegistry[labelId]?.name || this._formatRegistryId(labelId);
  }

  _groupAutomationsBy(getKeysFn, defaultGroupName) {
    const automations = this._getFilteredAutomations();
    const groups = {};

    automations.forEach((auto) => {
      const keys = getKeysFn(auto);
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

  _getGroupedByArea() {
    return this._groupAutomationsBy(
      (auto) => auto.area_id ? [this._getAreaName(auto.area_id)] : null,
      "Unassigned"
    );
  }

  _getGroupedByLabel() {
    return this._groupAutomationsBy(
      (auto) => auto.labels?.length > 0 ? auto.labels.map((id) => this._getLabelName(id)) : null,
      "Unlabeled"
    );
  }

  _getUniqueCount(getValuesFn) {
    const automations = this._getAutomations();
    const uniqueValues = new Set();
    automations.forEach((auto) => {
      const values = getValuesFn(auto);
      if (values) {
        values.forEach((v) => uniqueValues.add(v));
      }
    });
    return uniqueValues.size;
  }

  _getAreaCount() {
    return this._getUniqueCount((auto) => auto.area_id ? [auto.area_id] : null);
  }

  _getLabelCount() {
    return this._getUniqueCount((auto) => auto.labels?.length > 0 ? auto.labels : null);
  }

  _getCategoryName(categoryId) {
    if (!categoryId) return "Uncategorized";
    return this._categoryRegistry[categoryId]?.name || this._formatRegistryId(categoryId);
  }

  _getGroupedByCategory() {
    return this._groupAutomationsBy(
      (auto) => auto.category_id ? [this._getCategoryName(auto.category_id)] : null,
      "Uncategorized"
    );
  }

  _getCategoryCount() {
    return this._getUniqueCount((auto) => auto.category_id ? [auto.category_id] : null);
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
    const now = new Date();
    const isNextYear = date.getFullYear() > now.getFullYear();

    const options = {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };

    // Include year if the date is in a different year
    if (isNextYear) {
      options.year = "numeric";
    }

    return date.toLocaleString(undefined, options);
  }

  _formatCountdown(resumeAt) {
    const diff = new Date(resumeAt).getTime() - Date.now();
    if (diff <= 0) return "Resuming...";

    const d = Math.floor(diff / TIME_MS.DAY);
    const h = Math.floor((diff % TIME_MS.DAY) / TIME_MS.HOUR);
    const m = Math.floor((diff % TIME_MS.HOUR) / TIME_MS.MINUTE);
    const s = Math.floor((diff % TIME_MS.MINUTE) / TIME_MS.SECOND);

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
    this._duration = minutes * TIME_MS.MINUTE;

    const days = Math.floor(minutes / MINUTES_PER.DAY);
    const hours = Math.floor((minutes % MINUTES_PER.DAY) / MINUTES_PER.HOUR);
    const mins = minutes % MINUTES_PER.HOUR;

    this._customDuration = { days, hours, minutes: mins };

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    this._customDurationInput = parts.join(" ") || "30m";
  }

  _updateCustomDuration() {
    const { days, hours, minutes } = this._customDuration;
    const totalMinutes = days * MINUTES_PER.DAY + hours * MINUTES_PER.HOUR + minutes;
    this._duration = totalMinutes * TIME_MS.MINUTE;
  }

  /**
   * Parse duration input string supporting decimals.
   * Examples: "1.5h" -> 1h 30m, "2.5d" -> 2d 12h, "1d 2.5h 30m" -> 1d 2h 60m
   * Returns null for invalid input.
   */
  _parseDurationInput(input) {
    const cleaned = input.toLowerCase().replace(/\s+/g, "");
    if (!cleaned) return null;

    let totalMinutes = 0;
    let hasValidUnit = false;

    // Match numbers (including decimals) followed by units
    const dayMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*d/);
    const hourMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*h/);
    const minMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*m(?!i)/); // 'm' but not 'min' to avoid conflict

    if (dayMatch) {
      const dayValue = parseFloat(dayMatch[1]);
      if (isNaN(dayValue) || dayValue < 0) return null;
      totalMinutes += dayValue * MINUTES_PER.DAY;
      hasValidUnit = true;
    }

    if (hourMatch) {
      const hourValue = parseFloat(hourMatch[1]);
      if (isNaN(hourValue) || hourValue < 0) return null;
      totalMinutes += hourValue * MINUTES_PER.HOUR;
      hasValidUnit = true;
    }

    if (minMatch) {
      const minValue = parseFloat(minMatch[1]);
      if (isNaN(minValue) || minValue < 0) return null;
      totalMinutes += minValue;
      hasValidUnit = true;
    }

    // If no units found, try parsing as plain minutes
    if (!hasValidUnit) {
      const plainNum = parseFloat(cleaned);
      if (!isNaN(plainNum) && plainNum > 0) {
        totalMinutes = plainNum;
      } else {
        return null;
      }
    }

    // Round to nearest minute and validate
    totalMinutes = Math.round(totalMinutes);
    if (totalMinutes <= 0) return null;

    // Normalize into days, hours, minutes
    const days = Math.floor(totalMinutes / MINUTES_PER.DAY);
    const remainingAfterDays = totalMinutes % MINUTES_PER.DAY;
    const hours = Math.floor(remainingAfterDays / MINUTES_PER.HOUR);
    const minutes = remainingAfterDays % MINUTES_PER.HOUR;

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

  _getErrorMessage(error, defaultMessage) {
    // Check for HA translation key in error (preferred method)
    const translationKey = error?.translation_key || error?.data?.translation_key;
    if (translationKey && ERROR_MESSAGES[translationKey]) {
      return ERROR_MESSAGES[translationKey];
    }

    // Fallback: check error message for known patterns
    const errorMsg = error?.message || "";
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      // Match translation key patterns in error message
      if (errorMsg.includes(key) || errorMsg.toLowerCase().includes(key.replace(/_/g, " "))) {
        return message;
      }
    }

    return `${defaultMessage}. Check Home Assistant logs for details.`;
  }

  _showToast(message, options = {}) {
    const { showUndo = false, onUndo = null } = options;

    // Safety check: ensure shadowRoot exists
    if (!this.shadowRoot) return;

    // Remove any existing toast
    const existingToast = this.shadowRoot.querySelector(".toast");
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    // Accessibility: announce toast to screen readers
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "polite");
    toast.setAttribute("aria-atomic", "true");

    if (showUndo && onUndo) {
      const textSpan = document.createElement("span");
      textSpan.textContent = message;
      toast.appendChild(textSpan);

      const undoBtn = document.createElement("button");
      undoBtn.className = "toast-undo-btn";
      undoBtn.textContent = "Undo";
      undoBtn.setAttribute("aria-label", "Undo last action");
      undoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        onUndo();
        toast.remove();
      });
      toast.appendChild(undoBtn);
    } else {
      toast.textContent = message;
    }

    this.shadowRoot.appendChild(toast);

    // Clear any existing toast timeouts to prevent orphaned timers
    if (this._toastTimeout !== null) {
      clearTimeout(this._toastTimeout);
    }
    if (this._toastFadeTimeout !== null) {
      clearTimeout(this._toastFadeTimeout);
    }

    this._toastTimeout = setTimeout(() => {
      this._toastTimeout = null;
      // Safety check before animation
      if (!this.shadowRoot || !toast.parentNode) return;
      toast.style.animation = `slideUp ${UI_TIMING.TOAST_FADE_MS}ms ease-out reverse`;
      this._toastFadeTimeout = setTimeout(() => {
        this._toastFadeTimeout = null;
        if (toast.parentNode) toast.remove();
      }, UI_TIMING.TOAST_FADE_MS);
    }, UI_TIMING.TOAST_DURATION_MS);
  }

  _combineDateTime(date, time) {
    // date is ISO format like "2024-12-25", time is "HH:MM"
    if (!date || !time) return null;
    // Create a Date object to get the correct timezone offset for the selected date/time
    const localDate = new Date(`${date}T${time}`);
    // Get timezone offset in minutes and format as ±HH:MM
    // Note: getTimezoneOffset() returns minutes to ADD to get UTC, so we negate
    const offsetMinutes = localDate.getTimezoneOffset();
    const offsetSign = offsetMinutes <= 0 ? '+' : '-';
    // Use Math.abs before division to correctly handle negative offsets (positive UTC timezones)
    // Math.floor(-330/60) = -6, but we need 5 for UTC+5:30
    const absMinutes = Math.abs(offsetMinutes);
    const offsetHours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
    const offsetMins = String(absMinutes % 60).padStart(2, '0');
    const offsetStr = `${offsetSign}${offsetHours}:${offsetMins}`;
    return `${date}T${time}${offsetStr}`;
  }

  _getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    };
  }

  _enterScheduleMode() {
    const { date, time } = this._getCurrentDateTime();
    this._scheduleMode = true;
    this._disableAtDate = date;
    this._disableAtTime = time;
    this._resumeAtDate = date;
    this._resumeAtTime = time;
  }

  _getLocale() {
    // Use Home Assistant's locale setting, fallback to browser default
    return this.hass?.locale?.language || undefined;
  }

  _renderDateOptions() {
    // Generate options for next 365 days
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const locale = this._getLocale();

    for (let i = 0; i < 365; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const isoDate = `${year}-${month}-${day}`;

      const dayName = date.toLocaleDateString(locale, { weekday: "short" });
      const monthName = date.toLocaleDateString(locale, { month: "short" });
      const dayNum = date.getDate();

      // Show year only when different from current year
      const label = year !== currentYear
        ? `${dayName}, ${monthName} ${dayNum}, ${year}`
        : `${dayName}, ${monthName} ${dayNum}`;

      options.push({ value: isoDate, label });
    }

    return options.map(
      (opt) => html`<option value="${opt.value}">${opt.label}</option>`
    );
  }

  _hasResumeAt() {
    return this._resumeAtDate && this._resumeAtTime;
  }

  _hasDisableAt() {
    return this._disableAtDate && this._disableAtTime;
  }

  /**
   * Handle keyboard events for interactive elements.
   * Supports Enter and Space keys for activation.
   */
  _handleKeyDown(e, callback) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  }

  async _snooze() {
    if (this._selected.length === 0 || this._loading) return;

    if (this._scheduleMode) {
      if (!this._hasResumeAt()) {
        this._showToast("Please set a complete resume date and time (month, day, and time are all required)");
        return;
      }

      const disableAt = this._hasDisableAt()
        ? this._combineDateTime(this._disableAtDate, this._disableAtTime)
        : null;
      const resumeAt = this._combineDateTime(this._resumeAtDate, this._resumeAtTime);

      // Add buffer to prevent race condition where frontend validates but backend rejects
      // because time passed between validation and service call
      const nowWithBuffer = Date.now() + UI_TIMING.TIME_VALIDATION_BUFFER_MS;
      const resumeTime = new Date(resumeAt).getTime();

      // Resume time must be in the future (with buffer for backend timing)
      if (resumeTime <= nowWithBuffer) {
        this._showToast("Resume time must be in the future. Please select a date and time that hasn't passed yet.");
        return;
      }

      // If disable time is set, it must be before resume time
      // (This check is now mostly a safeguard since _combineDateTime handles it)
      if (disableAt) {
        const disableTime = new Date(disableAt).getTime();
        if (disableTime >= resumeTime) {
          this._showToast("Snooze time must be before resume time. The automation needs to be snoozed before it can resume.");
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
        const disableAt = this._hasDisableAt()
          ? this._combineDateTime(this._disableAtDate, this._disableAtTime)
          : null;
        const resumeAt = this._combineDateTime(this._resumeAtDate, this._resumeAtTime);

        const serviceData = {
          entity_id: this._selected,
          resume_at: resumeAt,
        };

        if (disableAt) {
          serviceData.disable_at = disableAt;
        }

        await this.hass.callService("autosnooze", "pause", serviceData);

        // Safety check: component may have been disconnected during async operation
        if (!this.isConnected || !this.shadowRoot) {
          this._loading = false;
          return;
        }

        if (disableAt) {
          toastMessage = `Scheduled ${count} automation${count !== 1 ? "s" : ""} to snooze`;
        } else {
          toastMessage = `Snoozed ${count} automation${count !== 1 ? "s" : ""} until ${this._formatDateTime(resumeAt)}`;
        }
      } else {
        const { days, hours, minutes } = this._customDuration;

        await this.hass.callService("autosnooze", "pause", {
          entity_id: this._selected,
          days,
          hours,
          minutes,
        });

        // Safety check: component may have been disconnected during async operation
        if (!this.isConnected || !this.shadowRoot) {
          this._loading = false;
          return;
        }

        const durationText = this._formatDuration(days, hours, minutes);
        toastMessage = `Snoozed ${count} automation${count !== 1 ? "s" : ""} for ${durationText}`;
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
            // Restore the selection (only if component still connected)
            if (this.isConnected) {
              this._selected = snoozedEntities;
              this._showToast(`Restored ${count} automation${count !== 1 ? "s" : ""}`);
            }
          } catch (e) {
            console.error("Undo failed:", e);
            if (this.isConnected && this.shadowRoot) {
              this._showToast("Failed to undo. The automations may have already been modified.");
            }
          }
        },
      });

      this._selected = [];
      this._disableAtDate = "";
      this._disableAtTime = "";
      this._resumeAtDate = "";
      this._resumeAtTime = "";
    } catch (e) {
      console.error("Snooze failed:", e);
      // Safety check before showing error toast
      if (this.isConnected && this.shadowRoot) {
        this._showToast(this._getErrorMessage(e, "Failed to snooze automations"));
      }
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
      // Safety check after async operation
      if (this.isConnected && this.shadowRoot) {
        this._showToast("Automation resumed successfully");
      }
    } catch (e) {
      console.error("Wake failed:", e);
      if (this.isConnected && this.shadowRoot) {
        this._showToast(this._getErrorMessage(e, "Failed to resume automation"));
      }
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
        // Safety check after async operation
        if (this.isConnected && this.shadowRoot) {
          this._showToast("All automations resumed successfully");
        }
      } catch (e) {
        console.error("Wake all failed:", e);
        if (this.isConnected && this.shadowRoot) {
          this._showToast("Failed to resume automations. Check Home Assistant logs for details.");
        }
      }
    } else {
      // First click - start confirmation
      this._wakeAllPending = true;
      this._wakeAllTimeout = setTimeout(() => {
        this._wakeAllPending = false;
        this._wakeAllTimeout = null;
      }, UI_TIMING.WAKE_ALL_CONFIRM_MS);
    }
  };

  async _cancelScheduled(entityId) {
    try {
      await this.hass.callService("autosnooze", "cancel_scheduled", {
        entity_id: entityId,
      });
      // Safety check after async operation
      if (this.isConnected && this.shadowRoot) {
        this._showToast("Scheduled snooze cancelled successfully");
      }
    } catch (e) {
      console.error("Cancel scheduled failed:", e);
      if (this.isConnected && this.shadowRoot) {
        this._showToast(this._getErrorMessage(e, "Failed to cancel scheduled snooze"));
      }
    }
  }

  _renderSelectionList() {
    const filtered = this._getFilteredAutomations();

    if (this._filterTab === "all") {
      if (filtered.length === 0) {
        return html`<div class="list-empty" role="status">No automations found</div>`;
      }
      return filtered.map((a) => html`
        <button
          type="button"
          class="list-item ${this._selected.includes(a.id) ? "selected" : ""}"
          @click=${() => this._toggleSelection(a.id)}
          role="option"
          aria-selected=${this._selected.includes(a.id)}
        >
          <input
            type="checkbox"
            .checked=${this._selected.includes(a.id)}
            @click=${(e) => e.stopPropagation()}
            @change=${() => this._toggleSelection(a.id)}
            aria-label="Select ${a.name}"
            tabindex="-1"
          />
          <div class="list-item-content">
            <div class="list-item-name">${a.name}</div>
          </div>
        </button>
      `);
    }

    const grouped =
      this._filterTab === "areas"
        ? this._getGroupedByArea()
        : this._filterTab === "categories"
          ? this._getGroupedByCategory()
          : this._getGroupedByLabel();

    if (grouped.length === 0) {
      return html`<div class="list-empty" role="status">No automations found</div>`;
    }

    return grouped.map(([groupName, items]) => {
      const expanded = this._expandedGroups[groupName] !== false;
      const groupSelected = items.every((i) => this._selected.includes(i.id));
      const someSelected = items.some((i) => this._selected.includes(i.id)) && !groupSelected;

      return html`
        <button
          type="button"
          class="group-header ${expanded ? "expanded" : ""}"
          @click=${() => this._toggleGroupExpansion(groupName)}
          aria-expanded=${expanded}
          aria-label="${groupName} group, ${items.length} automations"
        >
          <ha-icon icon="mdi:chevron-right" aria-hidden="true"></ha-icon>
          <span>${groupName}</span>
          <span class="group-badge" aria-label="${items.length} automations">${items.length}</span>
          <input
            type="checkbox"
            .checked=${groupSelected}
            .indeterminate=${someSelected}
            @click=${(e) => e.stopPropagation()}
            @change=${() => this._selectGroup(items)}
            aria-label="Select all automations in ${groupName}"
            tabindex="-1"
          />
        </button>
        ${expanded
          ? items.map((a) => {
              const showArea = this._filterTab === "labels" && a.area_id;
              const metaInfo = showArea ? this._getAreaName(a.area_id) : null;

              return html`
                <button
                  type="button"
                  class="list-item ${this._selected.includes(a.id) ? "selected" : ""}"
                  @click=${() => this._toggleSelection(a.id)}
                  role="option"
                  aria-selected=${this._selected.includes(a.id)}
                >
                  <input
                    type="checkbox"
                    .checked=${this._selected.includes(a.id)}
                    @click=${(e) => e.stopPropagation()}
                    @change=${() => this._toggleSelection(a.id)}
                    aria-label="Select ${a.name}"
                    tabindex="-1"
                  />
                  <div class="list-item-content">
                    <div class="list-item-name">${a.name}</div>
                    ${metaInfo
                      ? html`<div class="list-item-meta">
                          <ha-icon icon="mdi:home-outline" aria-hidden="true"></ha-icon>${metaInfo}
                        </div>`
                      : ""}
                  </div>
                </button>
              `;
            })
          : ""}
      `;
    });
  }

  _renderDurationSelector(selectedDuration, durationPreview, durationValid) {
    return this._scheduleMode
      ? html`
          <!-- Schedule Date/Time Inputs -->
          <div class="schedule-inputs">
            <div class="datetime-field">
              <label id="snooze-at-label">Snooze at:</label>
              <div class="datetime-row">
                <select
                  .value=${this._disableAtDate}
                  @change=${(e) => (this._disableAtDate = e.target.value)}
                  aria-labelledby="snooze-at-label"
                  aria-label="Snooze date"
                >
                  <option value="">Select date</option>
                  ${this._renderDateOptions()}
                </select>
                <input
                  type="time"
                  .value=${this._disableAtTime}
                  @input=${(e) => (this._disableAtTime = e.target.value)}
                  aria-labelledby="snooze-at-label"
                  aria-label="Snooze time"
                />
              </div>
              <span class="field-hint">Leave empty to snooze immediately</span>
            </div>
            <div class="datetime-field">
              <label id="resume-at-label">Resume at:</label>
              <div class="datetime-row">
                <select
                  .value=${this._resumeAtDate}
                  @change=${(e) => (this._resumeAtDate = e.target.value)}
                  aria-labelledby="resume-at-label"
                  aria-label="Resume date"
                >
                  <option value="">Select date</option>
                  ${this._renderDateOptions()}
                </select>
                <input
                  type="time"
                  .value=${this._resumeAtTime}
                  @input=${(e) => (this._resumeAtTime = e.target.value)}
                  aria-labelledby="resume-at-label"
                  aria-label="Resume time"
                />
              </div>
            </div>
            <button
              type="button"
              class="schedule-link"
              @click=${() => (this._scheduleMode = false)}
            >
              <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
              Back to duration selection
            </button>
          </div>
        `
      : html`
          <!-- Duration Selector -->
          <div class="duration-selector">
            <div class="duration-section-header" id="duration-header">Snooze Duration</div>
            <div class="duration-pills" role="radiogroup" aria-labelledby="duration-header">
              ${DEFAULT_DURATIONS.map(
                (d) => {
                  const isActive = d.minutes === null
                    ? this._showCustomInput
                    : !this._showCustomInput && selectedDuration === d;
                  return html`
                    <button
                      type="button"
                      class="pill ${isActive ? "active" : ""}"
                      @click=${() => {
                        if (d.minutes === null) {
                          this._showCustomInput = !this._showCustomInput;
                        } else {
                          this._showCustomInput = false;
                          this._setDuration(d.minutes);
                        }
                      }}
                      role="radio"
                      aria-checked=${isActive}
                      aria-label="${d.minutes === null ? "Custom duration" : `Snooze for ${d.label}`}"
                    >
                      ${d.label}
                    </button>
                  `;
                }
              )}
            </div>

            ${this._showCustomInput ? html`
              <div class="custom-duration-input">
                <input
                  type="text"
                  class="duration-input ${!durationValid ? "invalid" : ""}"
                  placeholder="e.g. 2h30m, 1.5h, 1d, 45m"
                  .value=${this._customDurationInput}
                  @input=${(e) => this._handleDurationInput(e.target.value)}
                  aria-label="Custom duration"
                  aria-invalid=${!durationValid}
                  aria-describedby="duration-help"
                />
                ${durationPreview && durationValid
                  ? html`<div class="duration-preview" role="status" aria-live="polite">Duration: ${durationPreview}</div>`
                  : html`<div class="duration-help" id="duration-help">Enter duration: 30m, 2h, 1.5h, 4h30m, 1d, 1d2h</div>`}
              </div>
            ` : ""}

            <button
              type="button"
              class="schedule-link"
              @click=${() => this._enterScheduleMode()}
            >
              <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
              Pick specific date/time instead
            </button>
          </div>
        `;
  }

  _renderActivePauses(pausedCount) {
    if (pausedCount === 0) return "";

    return html`
      <div class="snooze-list" role="region" aria-label="Snoozed automations">
        <div class="list-header">
          <ha-icon icon="mdi:bell-sleep" aria-hidden="true"></ha-icon>
          Snoozed Automations (${pausedCount})
        </div>

        ${this._getPausedGroupedByResumeTime().map(
          (group) => html`
            <div class="pause-group" role="group" aria-label="Automations resuming ${this._formatDateTime(group.resumeAt)}">
              <div class="pause-group-header">
                <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                ${group.disableAt
                  ? html`Resumes ${this._formatDateTime(group.resumeAt)}`
                  : html`<span class="countdown" data-resume-at="${group.resumeAt}" aria-label="Time remaining: ${this._formatCountdown(group.resumeAt)}">${this._formatCountdown(group.resumeAt)}</span>`}
              </div>
              ${group.automations.map(
                (auto) => html`
                  <div class="paused-item">
                    <ha-icon class="paused-icon" icon="mdi:sleep" aria-hidden="true"></ha-icon>
                    <div class="paused-info">
                      <div class="paused-name">${auto.friendly_name || auto.id}</div>
                    </div>
                    <button type="button" class="wake-btn" @click=${() => this._wake(auto.id)} aria-label="Resume ${auto.friendly_name || auto.id}">
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
                type="button"
                class="wake-all ${this._wakeAllPending ? "pending" : ""}"
                @click=${this._handleWakeAll}
                aria-label="${this._wakeAllPending ? "Confirm resume all automations" : "Resume all paused automations"}"
              >
                ${this._wakeAllPending ? "Confirm Resume All" : "Resume All"}
              </button>
            `
          : ""}
      </div>
    `;
  }

  _renderScheduledPauses(scheduledCount, scheduled) {
    if (scheduledCount === 0) return "";

    return html`
      <div class="scheduled-list" role="region" aria-label="Scheduled snoozes">
        <div class="list-header">
          <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
          Scheduled Snoozes (${scheduledCount})
        </div>

        ${Object.entries(scheduled).map(
          ([id, data]) => html`
            <div class="scheduled-item" role="article" aria-label="Scheduled pause for ${data.friendly_name || id}">
              <ha-icon class="scheduled-icon" icon="mdi:clock-outline" aria-hidden="true"></ha-icon>
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
              <button type="button" class="cancel-scheduled-btn" @click=${() => this._cancelScheduled(id)} aria-label="Cancel scheduled pause for ${data.friendly_name || id}">
                Cancel
              </button>
            </div>
          `
        )}
      </div>
    `;
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    const paused = this._getPaused();
    const pausedCount = Object.keys(paused).length;
    const scheduled = this._getScheduled();
    const scheduledCount = Object.keys(scheduled).length;

    const currentDuration =
      this._customDuration.days * MINUTES_PER.DAY +
      this._customDuration.hours * MINUTES_PER.HOUR +
      this._customDuration.minutes;

    const selectedDuration = DEFAULT_DURATIONS.find((d) => d.minutes === currentDuration);
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
          <div class="filter-tabs" role="tablist" aria-label="Filter automations by">
            <button
              type="button"
              class="tab ${this._filterTab === "all" ? "active" : ""}"
              @click=${() => (this._filterTab = "all")}
              role="tab"
              aria-selected=${this._filterTab === "all"}
              aria-controls="selection-list"
            >
              All
              <span class="tab-count" aria-label="${this._getAutomations().length} automations">${this._getAutomations().length}</span>
            </button>
            <button
              type="button"
              class="tab ${this._filterTab === "areas" ? "active" : ""}"
              @click=${() => (this._filterTab = "areas")}
              role="tab"
              aria-selected=${this._filterTab === "areas"}
              aria-controls="selection-list"
            >
              Areas
              <span class="tab-count" aria-label="${this._getAreaCount()} areas">${this._getAreaCount()}</span>
            </button>
            <button
              type="button"
              class="tab ${this._filterTab === "categories" ? "active" : ""}"
              @click=${() => (this._filterTab = "categories")}
              role="tab"
              aria-selected=${this._filterTab === "categories"}
              aria-controls="selection-list"
            >
              Categories
              <span class="tab-count" aria-label="${this._getCategoryCount()} categories">${this._getCategoryCount()}</span>
            </button>
            <button
              type="button"
              class="tab ${this._filterTab === "labels" ? "active" : ""}"
              @click=${() => (this._filterTab = "labels")}
              role="tab"
              aria-selected=${this._filterTab === "labels"}
              aria-controls="selection-list"
            >
              Labels
              <span class="tab-count" aria-label="${this._getLabelCount()} labels">${this._getLabelCount()}</span>
            </button>
          </div>

          <!-- Search -->
          <div class="search-box">
            <input
              type="search"
              placeholder="Search automations..."
              .value=${this._search}
              @input=${(e) => this._handleSearchInput(e)}
              aria-label="Search automations by name"
            />
          </div>

          <!-- Selection Actions -->
          ${this._getFilteredAutomations().length > 0
            ? html`
                <div class="selection-actions" role="toolbar" aria-label="Selection actions">
                  <span role="status" aria-live="polite">${this._selected.length} of ${this._getFilteredAutomations().length} selected</span>
                  <button
                    type="button"
                    class="select-all-btn"
                    @click=${() => this._selectAllVisible()}
                    aria-label="${this._getFilteredAutomations().every((a) => this._selected.includes(a.id))
                      ? "Deselect all visible automations"
                      : "Select all visible automations"}"
                  >
                    ${this._getFilteredAutomations().every((a) => this._selected.includes(a.id))
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  ${this._selected.length > 0
                    ? html`<button type="button" class="select-all-btn" @click=${() => this._clearSelection()} aria-label="Clear selection">Clear</button>`
                    : ""}
                </div>
              `
            : ""}

          <!-- Selection List -->
          <div class="selection-list" id="selection-list" role="listbox" aria-label="Automations list" aria-multiselectable="true">
            ${this._renderSelectionList()}
          </div>

          ${this._renderDurationSelector(selectedDuration, durationPreview, durationValid)}

          <!-- Snooze Button -->
          <button
            type="button"
            class="snooze-btn"
            ?disabled=${this._selected.length === 0 ||
            (!this._scheduleMode && !this._isDurationValid()) ||
            (this._scheduleMode && !this._hasResumeAt()) ||
            this._loading}
            @click=${this._snooze}
            aria-label="${this._loading
              ? "Snoozing automations"
              : this._scheduleMode
                ? `Schedule snooze for ${this._selected.length} automation${this._selected.length !== 1 ? "s" : ""}`
                : `Snooze ${this._selected.length} automation${this._selected.length !== 1 ? "s" : ""}`}"
            aria-busy=${this._loading}
          >
            ${this._loading
              ? "Snoozing..."
              : this._scheduleMode
                ? `Schedule${this._selected.length > 0 ? ` (${this._selected.length})` : ""}`
                : `Snooze${this._selected.length > 0 ? ` (${this._selected.length})` : ""}`}
          </button>
        </div>

        ${this._renderActivePauses(pausedCount)}
        ${this._renderScheduledPauses(scheduledCount, scheduled)}
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
