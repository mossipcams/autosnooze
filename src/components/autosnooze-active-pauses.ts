/**
 * AutoSnooze Active Pauses child component.
 * Displays grouped paused automations with countdown timers.
 * Fires custom events for wake/wake-all actions (parent handles services).
 */

import { LitElement, html, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import { UI_TIMING } from '../constants/index.js';
import {
  setCardShellCountdownHidden,
  subscribeCardShellCountdown,
} from '../features/card-shell/index.js';
import { formatCountdown, formatDateTime } from '../utils/time-formatting.js';
import { hapticFeedback } from '../utils/haptic.js';
import { activePausesStyles } from '../styles/active-pauses.styles.js';
import { sharedPausedStyles } from '../styles/shared.styles.js';
import { defineAutoSnoozeElement } from '../utils/custom-element-registration.js';
import type { HomeAssistant } from '../types/hass.js';
import type { PauseGroup, PausedAutomation } from '../types/automation.js';

export class AutoSnoozeActivePauses extends LitElement {
  static styles = [sharedPausedStyles, activePausesStyles];

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ attribute: false })
  pauseGroups: PauseGroup[] = [];

  @property({ type: Number })
  pausedCount: number = 0;

  /**
   * When true, the section is purely informational: no resume/resume-all or
   * tap-to-adjust controls are rendered. Used by the snoozed-only card.
   */
  @property({ type: Boolean })
  readonly: boolean = false;

  @state() private _wakeAllPending: boolean = false;

  private _wakeAllTimeout: number | null = null;
  private _unsubscribeCountdown?: () => void;
  private _countdownState = { interval: null as ReturnType<typeof globalThis.setInterval> | null, syncTimeout: null as ReturnType<typeof globalThis.setTimeout> | null };

  connectedCallback(): void {
    super.connectedCallback();
    try {
      setCardShellCountdownHidden(document.hidden);
    } catch {
      // Some embedded hosts provide only the subscription facade.
    }
    this._syncCountdownLifecycle();
  }

  updated(changedProps: PropertyValues): void {
    if (changedProps.has('pauseGroups')) {
      this._syncCountdownLifecycle();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._countdownState.interval !== null) {
      globalThis.clearInterval(this._countdownState.interval);
      this._countdownState.interval = null;
    }
    if (this._countdownState.syncTimeout !== null) {
      globalThis.clearTimeout(this._countdownState.syncTimeout);
      this._countdownState.syncTimeout = null;
    }
    this._unsubscribeCountdown?.();
    this._unsubscribeCountdown = undefined;
    if (this._wakeAllTimeout !== null) {
      clearTimeout(this._wakeAllTimeout);
      this._wakeAllTimeout = null;
    }
  }

  private _updateCountdownIfNeeded(): void {
    if (this.pauseGroups.length > 0) {
      this.requestUpdate();
    }
  }

  private _hasLiveCountdowns(): boolean {
    return this.pauseGroups.some((group) => !group.disableAt);
  }

  private _startSharedCountdown(): void {
    this._unsubscribeCountdown = subscribeCardShellCountdown(() => this._updateCountdownIfNeeded());
    this._countdownState.interval = globalThis.setInterval(() => {}, UI_TIMING.COUNTDOWN_INTERVAL_MS);
  }

  private _syncCountdownLifecycle(): void {
    this._unsubscribeCountdown?.();
    this._unsubscribeCountdown = undefined;
    if (this._countdownState.interval !== null) {
      globalThis.clearInterval(this._countdownState.interval);
    }
    if (this._countdownState.syncTimeout !== null) {
      globalThis.clearTimeout(this._countdownState.syncTimeout);
    }
    this._countdownState = { interval: null, syncTimeout: null };

    if (this.pauseGroups.length > 0 && !this._hasLiveCountdowns()) {
      return;
    }

    this._countdownState.syncTimeout = globalThis.setTimeout(() => {
      this._countdownState.syncTimeout = null;
      if (this._hasLiveCountdowns()) {
        this._startSharedCountdown();
      }
    }, 0);
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

  _fireClearNotification(entityId: string): void {
    this.dispatchEvent(new CustomEvent('clear-notification', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _hasNotificationConfig(auto: PausedAutomation): boolean {
    return auto.notification_trigger !== undefined && auto.notification_trigger !== 'none';
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
            ${this.readonly
              ? html`<div class="pause-group-header">
                  <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                  ${group.disableAt
                    ? html`${localize(this.hass, 'status.resumes')} ${formatDateTime(group.resumeAt, locale)}`
                    : html`<span class="countdown">${formatCountdown(group.resumeAt, localize(this.hass, 'status.resuming'))}</span>`}
                </div>`
              : html`<div class="pause-group-header"
                  @click=${() => this._fireAdjustGroup(group)}
                  role="button"
                  aria-label="${localize(this.hass, 'a11y.adjust_group', { count: group.automations.length })}">
                  <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
                  ${group.disableAt
                    ? html`${localize(this.hass, 'status.resumes')} ${formatDateTime(group.resumeAt, locale)}`
                    : html`<span class="countdown">${formatCountdown(group.resumeAt, localize(this.hass, 'status.resuming'))}</span>`}
                </div>`}
            ${group.automations.map((auto) => this.readonly
              ? html`<div class="paused-item">
                  <ha-icon class="paused-icon" icon="mdi:sleep" aria-hidden="true"></ha-icon>
                  <div class="paused-info">
                    <div class="paused-name">${auto.friendly_name || auto.entity_id}</div>
                  </div>
                </div>`
              : html`<div class="paused-item" role="button" tabindex="0" @click=${() => this._fireAdjust(auto)} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._fireAdjust(auto); } }}>
                  <ha-icon class="paused-icon" icon="mdi:sleep" aria-hidden="true"></ha-icon>
                  <div class="paused-info">
                    <div class="paused-name">${auto.friendly_name || auto.entity_id}</div>
                  </div>
                  ${this._hasNotificationConfig(auto) ? html`
                    <button
                      type="button"
                      class="wake-btn clear-notification-btn"
                      aria-label="${localize(this.hass, 'button.remove_notification')}"
                      title="${localize(this.hass, 'button.remove_notification')}"
                      @click=${(e: Event) => {
                        e.stopPropagation();
                        this._fireClearNotification(auto.entity_id);
                      }}
                    >
                      <ha-icon icon="mdi:bell-off-outline" aria-hidden="true"></ha-icon>
                    </button>
                  ` : ''}
                  <button type="button" class="wake-btn" @click=${(e: Event) => { e.stopPropagation(); this._fireWake(auto.entity_id); }}>
                    ${localize(this.hass, 'button.resume')}
                  </button>
                </div>`)}
          </div>
        `)}
        ${!this.readonly && this.pausedCount > 1 ? html`
          <button type="button" class="wake-all ${this._wakeAllPending ? 'pending' : ''}"
            @click=${() => this._handleWakeAll()}>
            ${this._wakeAllPending ? localize(this.hass, 'button.confirm_resume_all') : localize(this.hass, 'button.resume_all')}
          </button>
        ` : ''}
      </div>
    `;
  }
}

defineAutoSnoozeElement('autosnooze-active-pauses', AutoSnoozeActivePauses);
