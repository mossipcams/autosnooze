const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// ============================================================================
// CARD EDITOR
// ============================================================================
class AutomationPauseCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      _config: { type: Object },
    };
  }

  static get styles() {
    return css`
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

    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
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

customElements.define("autosnooze-card-editor", AutomationPauseCardEditor);

// ============================================================================
// MAIN CARD
// ============================================================================
class AutomationPauseCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _selected: { type: Array },
      _duration: { type: Number },
      _customDuration: { type: Object },
      _loading: { type: Boolean },
      _search: { type: String },
      _filterTab: { type: String },
      _expandedGroups: { type: Object },
      _scheduleMode: { type: Boolean },
      _disableAt: { type: String },
      _resumeAt: { type: String },
    };
  }

  constructor() {
    super();
    this._selected = [];
    this._duration = 1800000; // 30 minutes default
    this._customDuration = { days: 0, hours: 0, minutes: 30 };
    this._loading = false;
    this._search = "";
    this._filterTab = "all";
    this._expandedGroups = {};
    this._interval = null;
    this._scheduleMode = false;
    this._disableAt = "";
    this._resumeAt = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this._interval = setInterval(() => this.requestUpdate(), 1000);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  static getConfigElement() {
    return document.createElement("autosnooze-card-editor");
  }

  static getStubConfig() {
    return {
      title: "AutoSnooze",
    };
  }

  static get styles() {
    return css`
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
      .list-item-name {
        flex: 1;
        font-size: 0.95em;
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

      /* Custom Duration */
      .custom-duration {
        display: flex;
        gap: 8px;
        padding: 12px;
        background: var(--secondary-background-color);
        border-radius: 8px;
        margin-top: 8px;
      }
      .duration-field {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .duration-field label {
        font-size: 0.8em;
        color: var(--secondary-text-color);
      }
      .duration-field input {
        padding: 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        text-align: center;
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
  }

  _getAutomations() {
    if (!this.hass?.states) return [];
    
    return Object.keys(this.hass.states)
      .filter((id) => id.startsWith("automation."))
      .map((id) => {
        const state = this.hass.states[id];
        return {
          id,
          name: state.attributes.friendly_name || id.replace("automation.", ""),
          area_id: state.attributes.area_id || null,
          labels: state.attributes.labels || [],
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
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

  _getGroupedByArea() {
    const automations = this._getFilteredAutomations();
    const groups = {};
    
    automations.forEach((auto) => {
      const areaId = auto.area_id || "_unassigned";
      const areaName = areaId === "_unassigned" 
        ? "Unassigned" 
        : this.hass.areas?.[areaId]?.name || areaId;
      
      if (!groups[areaName]) {
        groups[areaName] = [];
      }
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
          const label = this.hass.labels?.[labelId];
          const labelName = label?.name || labelId;
          if (!groups[labelName]) groups[labelName] = [];
          groups[labelName].push(auto);
        });
      }
    });

    return Object.entries(groups).sort((a, b) => 
      a[0] === "Unlabeled" ? 1 : b[0] === "Unlabeled" ? -1 : a[0].localeCompare(b[0])
    );
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
    const diff = new Date(resumeAt) - Date.now();
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
    
    // Update custom fields
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    
    this._customDuration = { days, hours, minutes: mins };
  }

  _updateCustomDuration() {
    const { days, hours, minutes } = this._customDuration;
    const totalMinutes = days * 1440 + hours * 60 + minutes;
    this._duration = totalMinutes * 60000;
  }

  _showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    this.shadowRoot.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = "slideUp 0.3s ease-out reverse";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async _snooze() {
    if (this._selected.length === 0 || this._loading) return;

    // Validate inputs based on mode
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
        // Schedule mode - use datetime values
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
        // Duration mode - existing behavior
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
      return filtered.map(
        (a) => html`
          <div
            class="list-item ${this._selected.includes(a.id) ? "selected" : ""}"
            @click=${() => this._toggleSelection(a.id)}
          >
            <ha-icon
              icon=${this._selected.includes(a.id)
                ? "mdi:checkbox-marked"
                : "mdi:checkbox-blank-outline"}
            ></ha-icon>
            <span class="list-item-name">${a.name}</span>
          </div>
        `
      );
    }

    const grouped =
      this._filterTab === "areas"
        ? this._getGroupedByArea()
        : this._getGroupedByLabel();

    if (grouped.length === 0) {
      return html`<div class="list-empty">No automations found</div>`;
    }

    return grouped.map(([groupName, items]) => {
      const expanded = this._expandedGroups[groupName] !== false;
      const groupSelected = items.every((i) => this._selected.includes(i.id));
      
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
              : "mdi:checkbox-blank-outline"}
            @click=${(e) => {
              e.stopPropagation();
              this._selectGroup(items);
            }}
          ></ha-icon>
        </div>
        ${expanded
          ? items.map(
              (a) => html`
                <div
                  class="list-item ${this._selected.includes(a.id)
                    ? "selected"
                    : ""}"
                  @click=${() => this._toggleSelection(a.id)}
                >
                  <ha-icon
                    icon=${this._selected.includes(a.id)
                      ? "mdi:checkbox-marked"
                      : "mdi:checkbox-blank-outline"}
                  ></ha-icon>
                  <span class="list-item-name">${a.name}</span>
                </div>
              `
            )
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
      { label: "Custom", minutes: -1 },
    ];

    const currentDuration =
      this._customDuration.days * 1440 +
      this._customDuration.hours * 60 +
      this._customDuration.minutes;

    const selectedDuration = durations.find((d) => d.minutes === currentDuration);

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
            </button>
            <button
              class="tab ${this._filterTab === "areas" ? "active" : ""}"
              @click=${() => (this._filterTab = "areas")}
            >
              Areas
            </button>
            <button
              class="tab ${this._filterTab === "labels" ? "active" : ""}"
              @click=${() => (this._filterTab = "labels")}
            >
              Labels
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

          <!-- Selection List -->
          <div class="selection-list">${this._renderSelectionList()}</div>

          <!-- Schedule Mode Toggle -->
          <div class="schedule-toggle" @click=${() => this._scheduleMode = !this._scheduleMode}>
            <ha-icon icon=${this._scheduleMode ? "mdi:calendar-clock" : "mdi:timer-outline"}></ha-icon>
            <label>${this._scheduleMode ? "Schedule Mode" : "Duration Mode"}</label>
            <input
              type="checkbox"
              .checked=${this._scheduleMode}
              @click=${(e) => e.stopPropagation()}
              @change=${(e) => this._scheduleMode = e.target.checked}
            />
          </div>

          ${this._scheduleMode
            ? html`
                <!-- Schedule Datetime Inputs -->
                <div class="schedule-inputs">
                  <div class="datetime-field">
                    <label>Disable At (optional - leave empty to disable now)</label>
                    <input
                      type="datetime-local"
                      .value=${this._disableAt}
                      @input=${(e) => this._disableAt = e.target.value}
                    />
                  </div>
                  <div class="datetime-field">
                    <label>Resume At (required)</label>
                    <input
                      type="datetime-local"
                      .value=${this._resumeAt}
                      @input=${(e) => this._resumeAt = e.target.value}
                    />
                  </div>
                </div>
              `
            : html`
                <!-- Duration Selector -->
                <div class="duration-selector">
                  <div class="duration-pills">
                    ${durations.map(
                      (d) => html`
                        <button
                          class="pill ${selectedDuration === d ? "active" : ""}"
                          @click=${() =>
                            d.minutes === -1
                              ? this._updateCustomDuration()
                              : this._setDuration(d.minutes)}
                        >
                          ${d.label}
                        </button>
                      `
                    )}
                  </div>

                  ${selectedDuration?.label === "Custom" || !selectedDuration
                    ? html`
                        <div class="custom-duration">
                          <div class="duration-field">
                            <label>Days</label>
                            <input
                              type="number"
                              min="0"
                              max="365"
                              .value=${this._customDuration.days}
                              @input=${(e) => {
                                this._customDuration = {
                                  ...this._customDuration,
                                  days: +e.target.value || 0,
                                };
                                this._updateCustomDuration();
                              }}
                            />
                          </div>
                          <div class="duration-field">
                            <label>Hours</label>
                            <input
                              type="number"
                              min="0"
                              max="23"
                              .value=${this._customDuration.hours}
                              @input=${(e) => {
                                this._customDuration = {
                                  ...this._customDuration,
                                  hours: +e.target.value || 0,
                                };
                                this._updateCustomDuration();
                              }}
                            />
                          </div>
                          <div class="duration-field">
                            <label>Minutes</label>
                            <input
                              type="number"
                              min="0"
                              max="59"
                              .value=${this._customDuration.minutes}
                              @input=${(e) => {
                                this._customDuration = {
                                  ...this._customDuration,
                                  minutes: +e.target.value || 0,
                                };
                                this._updateCustomDuration();
                              }}
                            />
                          </div>
                        </div>
                      `
                    : ""}
                </div>
              `}

          <!-- Snooze Button -->
          <button
            class="snooze-btn"
            ?disabled=${this._selected.length === 0 ||
            (!this._scheduleMode && this._duration === 0) ||
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
                      <ha-icon
                        class="paused-icon"
                        icon="mdi:sleep"
                      ></ha-icon>
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
                      <ha-icon
                        class="scheduled-icon"
                        icon="mdi:clock-outline"
                      ></ha-icon>
                      <div class="paused-info">
                        <div class="paused-name">
                          ${data.friendly_name || id}
                        </div>
                        <div class="scheduled-time">
                          Disables: ${this._formatDateTime(data.disable_at)}
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

customElements.define("autosnooze-card", AutomationPauseCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "autosnooze-card",
  name: "AutoSnooze Card",
  description: "Temporarily pause automations with area and label filtering",
  preview: true,
});
