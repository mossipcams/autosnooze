/**
 * AutoSnooze Adjust Modal child component.
 * Displays overlay with automation name, live countdown, and increment/decrement buttons.
 * Fires custom events for adjust-time and close-modal actions (parent handles services).
 */

import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import { formatCountdown } from '../utils/index.js';
import { UI_TIMING } from '../constants/index.js';
import { adjustModalStyles } from '../styles/adjust-modal.styles.js';
import type { HomeAssistant } from '../types/hass.js';
import type { PropertyValues } from 'lit';

interface AdjustIncrement {
  label: string;
  minutes?: number;
  hours?: number;
}

interface AdjustDecrement {
  label: string;
  minutes: number;
  thresholdMs: number;
}

const ADJUST_INCREMENTS: AdjustIncrement[] = [
  { label: '+15m', minutes: 15 },
  { label: '+30m', minutes: 30 },
  { label: '+1h', hours: 1 },
  { label: '+2h', hours: 2 },
];

const ADJUST_DECREMENTS: AdjustDecrement[] = [
  { label: '-15m', minutes: -15, thresholdMs: 15 * 60 * 1000 },
  { label: '-30m', minutes: -30, thresholdMs: 30 * 60 * 1000 },
];

const MIN_REMAINING_MS = 60 * 1000; // 1 minute minimum

export class AutoSnoozeAdjustModal extends LitElement {
  static styles = adjustModalStyles;

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ type: Boolean })
  open: boolean = false;

  @property({ type: String })
  entityId: string = '';

  @property({ type: String })
  friendlyName: string = '';

  @property({ type: String })
  resumeAt: string = '';

  @property({ attribute: false })
  entityIds: string[] = [];

  @property({ attribute: false })
  friendlyNames: string[] = [];

  get _isGroupMode(): boolean {
    return this.entityIds.length > 1;
  }

  _interval: number | null = null;
  _syncTimeout: number | null = null;

  updated(changedProps: PropertyValues): void {
    if (changedProps.has('open')) {
      if (this.open) {
        this._startSynchronizedCountdown();
      } else {
        this._stopCountdown();
      }
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._stopCountdown();
  }

  _startSynchronizedCountdown(): void {
    this._stopCountdown();
    const now = Date.now();
    const msUntilNextSecond = 1000 - (now % 1000);
    this._syncTimeout = window.setTimeout(() => {
      this._syncTimeout = null;
      this.requestUpdate();
      this._interval = window.setInterval(() => {
        this.requestUpdate();
      }, UI_TIMING.COUNTDOWN_INTERVAL_MS);
    }, msUntilNextSecond);
  }

  _stopCountdown(): void {
    if (this._interval !== null) {
      clearInterval(this._interval);
      this._interval = null;
    }
    if (this._syncTimeout !== null) {
      clearTimeout(this._syncTimeout);
      this._syncTimeout = null;
    }
  }

  _isDecrementDisabled(thresholdMs: number): boolean {
    if (!this.resumeAt) return true;
    const remainingMs = new Date(this.resumeAt).getTime() - Date.now();
    return (remainingMs - thresholdMs) < MIN_REMAINING_MS;
  }

  _fireAdjustTime(params: { days?: number; hours?: number; minutes?: number }): void {
    if (this.entityIds.length > 0) {
      this.dispatchEvent(new CustomEvent('adjust-time', {
        detail: { entityIds: this.entityIds, ...params },
        bubbles: true,
        composed: true,
      }));
    } else {
      this.dispatchEvent(new CustomEvent('adjust-time', {
        detail: { entityId: this.entityId, ...params },
        bubbles: true,
        composed: true,
      }));
    }
  }

  _close(): void {
    this.dispatchEvent(new CustomEvent('close-modal', {
      bubbles: true,
      composed: true,
    }));
  }

  _handleOverlayClick(e: Event): void {
    if (e.target === e.currentTarget) {
      this._close();
    }
  }

  render() {
    if (!this.open) return html``;

    return html`
      <div class="modal-overlay" @click=${this._handleOverlayClick}>
        <div class="modal-content" @click=${(e: Event) => e.stopPropagation()}>
          <div class="modal-header">
            <span class="modal-title">
              ${this._isGroupMode
                ? localize(this.hass, 'adjust.group_title', { count: this.entityIds.length })
                : (this.friendlyName || this.entityId)}
            </span>
            ${this._isGroupMode ? html`
              <div class="modal-subtitle">
                ${this.friendlyNames.join(', ')}
              </div>
            ` : ''}
            <button class="modal-close" @click=${this._close}
              aria-label="${localize(this.hass, 'a11y.close_adjust_modal')}">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </div>
          <div class="modal-body">
            <div class="remaining-label">${localize(this.hass, 'adjust.remaining')}</div>
            <div class="remaining-time">${formatCountdown(this.resumeAt)}</div>

            <div class="adjust-section">
              <div class="adjust-section-label">${localize(this.hass, 'adjust.add_time')}</div>
              <div class="adjust-buttons">
                ${ADJUST_INCREMENTS.map((inc) => html`
                  <button type="button"
                    class="adjust-btn increment"
                    @click=${() => this._fireAdjustTime(inc.hours ? { hours: inc.hours } : { minutes: inc.minutes })}
                    aria-label="${localize(this.hass, 'a11y.add_minutes', { label: inc.label })}">
                    ${inc.label}
                  </button>
                `)}
              </div>
            </div>

            <div class="adjust-section">
              <div class="adjust-section-label">${localize(this.hass, 'adjust.reduce_time')}</div>
              <div class="decrement-buttons">
                ${ADJUST_DECREMENTS.map((dec) => html`
                  <button type="button"
                    class="adjust-btn decrement"
                    ?disabled=${this._isDecrementDisabled(dec.thresholdMs)}
                    @click=${() => this._fireAdjustTime({ minutes: dec.minutes })}
                    aria-label="${localize(this.hass, 'a11y.reduce_minutes', { label: dec.label })}">
                    ${dec.label}
                  </button>
                `)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
