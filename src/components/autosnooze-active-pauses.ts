/**
 * AutoSnooze Active Pauses child component.
 * Displays grouped paused automations with countdown timers.
 * Fires custom events for wake/wake-all actions (parent handles services).
 */

import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import { formatCountdown, formatDateTime, hapticFeedback } from '../utils/index.js';
import { UI_TIMING } from '../constants/index.js';
import { activePausesStyles } from '../styles/active-pauses.styles.js';
import type { HomeAssistant } from '../types/hass.js';
import type { PauseGroup, PausedAutomation } from '../types/automation.js';

export class AutoSnoozeActivePauses extends LitElement {
  static styles = activePausesStyles;

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ attribute: false })
  pauseGroups: PauseGroup[] = [];

  @property({ type: Number })
  pausedCount: number = 0;

  _wakeAllPending: boolean = false;

  private _wakeAllTimeout: number | null = null;
  _interval: number | null = null;
  _syncTimeout: number | null = null;

  connectedCallback(): void {
    super.connectedCallback();

    if (this._interval) {
      window.clearInterval(this._interval);
      this._interval = null;
    }
    if (this._syncTimeout) {
      window.clearTimeout(this._syncTimeout);
      this._syncTimeout = null;
    }

    this._startSynchronizedCountdown();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._interval !== null) {
      clearInterval(this._interval);
      this._interval = null;
    }
    if (this._syncTimeout !== null) {
      clearTimeout(this._syncTimeout);
      this._syncTimeout = null;
    }
    if (this._wakeAllTimeout !== null) {
      clearTimeout(this._wakeAllTimeout);
      this._wakeAllTimeout = null;
    }
  }

  _startSynchronizedCountdown(): void {
    const now = Date.now();
    const msUntilNextSecond = 1000 - (now % 1000);
    this._syncTimeout = window.setTimeout(() => {
      this._syncTimeout = null;
      this._updateCountdownIfNeeded();
      this._interval = window.setInterval(() => {
        this._updateCountdownIfNeeded();
      }, UI_TIMING.COUNTDOWN_INTERVAL_MS);
    }, msUntilNextSecond);
  }

  private _updateCountdownIfNeeded(): void {
    if (this.pauseGroups.length > 0) {
      this.requestUpdate();
    }
  }

  _handleWakeAll(): void {
    if (this._wakeAllPending) {
      if (this._wakeAllTimeout !== null) {
        clearTimeout(this._wakeAllTimeout);
        this._wakeAllTimeout = null;
      }
      this._wakeAllPending = false;
      this._fireWakeAll();
    } else {
      hapticFeedback('medium');
      this._wakeAllPending = true;
      this._wakeAllTimeout = window.setTimeout(() => {
        this._wakeAllPending = false;
        this._wakeAllTimeout = null;
      }, UI_TIMING.WAKE_ALL_CONFIRM_MS);
    }
  }

  _fireWake(entityId: string): void {
    this.dispatchEvent(new CustomEvent('wake-automation', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }


  _fireAdjust(auto: PausedAutomation): void {
    this.dispatchEvent(new CustomEvent('adjust-automation', {
      detail: {
        entityId: auto.entity_id,
        friendlyName: auto.friendly_name,
        resumeAt: auto.resume_at,
      },
      bubbles: true,
      composed: true,
    }));
  }

  _fireAdjustGroup(group: PauseGroup): void {
    this.dispatchEvent(new CustomEvent('adjust-group', {
      detail: {
        entityIds: group.automations.map(a => a.entity_id),
        friendlyNames: group.automations.map(a => a.friendly_name || a.entity_id),
        resumeAt: group.resumeAt,
      },
      bubbles: true,
      composed: true,
    }));
  }

  _fireWakeAll(): void {
    this.dispatchEvent(new CustomEvent('wake-all', {
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    if (this.pausedCount === 0) return html``;
    const locale = this.hass?.locale?.language;
    return html`
      <div class="snooze-list" role="region" aria-label="${localize(this.hass, 'a11y.snoozed_region')}">
        <div class="list-header">
          <ha-icon icon="mdi:bell-sleep" aria-hidden="true"></ha-icon>
          ${localize(this.hass, 'section.snoozed_count', { count: this.pausedCount })}
        </div>
        ${this.pauseGroups.map((group) => html`
          <div class="pause-group" role="group">
            <div class="pause-group-header"
              @click=${() => this._fireAdjustGroup(group)}
              role="button"
              aria-label="${localize(this.hass, 'a11y.adjust_group', { count: group.automations.length })}">
              <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
              ${group.disableAt
                ? html`${localize(this.hass, 'status.resumes')} ${formatDateTime(group.resumeAt, locale)}`
                : html`<span class="countdown">${formatCountdown(group.resumeAt, localize(this.hass, 'status.resuming'))}</span>`}
            </div>
            ${group.automations.map((auto) => html`
              <div class="paused-item" @click=${() => this._fireAdjust(auto)}>
                <ha-icon class="paused-icon" icon="mdi:sleep" aria-hidden="true"></ha-icon>
                <div class="paused-info">
                  <div class="paused-name">${auto.friendly_name || auto.entity_id}</div>
                </div>
                <button type="button" class="wake-btn" @click=${(e: Event) => { e.stopPropagation(); this._fireWake(auto.entity_id); }}>
                  ${localize(this.hass, 'button.resume')}
                </button>
              </div>
            `)}
          </div>
        `)}
        ${this.pausedCount > 1 ? html`
          <button type="button" class="wake-all ${this._wakeAllPending ? 'pending' : ''}"
            @click=${() => this._handleWakeAll()}>
            ${this._wakeAllPending ? localize(this.hass, 'button.confirm_resume_all') : localize(this.hass, 'button.resume_all')}
          </button>
        ` : ''}
      </div>
    `;
  }
}
