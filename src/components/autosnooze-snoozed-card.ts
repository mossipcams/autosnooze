/**
 * AutoSnooze Snoozed-Only Card Component.
 * A thin, purely informational Lovelace card that surfaces only the currently
 * snoozed automations and when they resume. It has no resume/adjust controls;
 * for managing snoozes use the main AutoSnooze card. Rendering is delegated to
 * AutoSnoozeActivePauses in read-only mode, so no setup UI is duplicated.
 */

import { LitElement, html, type PropertyValues, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import type { HomeAssistant } from '../types/hass.js';
import type { AutoSnoozeCardConfig } from '../types/card.js';
import { cardStyles } from '../styles/card.styles.js';
import { sharedPausedStyles } from '../styles/shared.styles.js';
import { defineAutoSnoozeElement } from '../utils/custom-element-registration.js';
import {
  getCardSnoozeSensorEntity,
  getCardPausedSnapshot,
  isCardSnoozeSensorAvailable,
} from '../features/card-shell/index.js';

export class AutoSnoozeSnoozedCard extends LitElement {
  static styles = [sharedPausedStyles, cardStyles];

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ attribute: false })
  config: AutoSnoozeCardConfig = {} as AutoSnoozeCardConfig;

  static getConfigElement(): HTMLElement {
    return document.createElement('autosnooze-card-editor');
  }

  static getStubConfig(): AutoSnoozeCardConfig {
    return { type: 'custom:autosnooze-snoozed-card', title: 'Snoozed Automations' };
  }

  setConfig(config: AutoSnoozeCardConfig): void {
    this.config = config;
  }

  getCardSize(): number {
    const snapshot = this.hass ? getCardPausedSnapshot(this.hass) : null;
    return 1 + (snapshot ? Object.keys(snapshot.paused).length : 0);
  }

  shouldUpdate(changedProps: PropertyValues): boolean {
    const previous = changedProps.get('hass') as HomeAssistant | undefined;
    if (!previous || !this.hass) {
      return true;
    }
    const sensorChanged =
      getCardSnoozeSensorEntity(previous) !== getCardSnoozeSensorEntity(this.hass);
    const languageChanged =
      (previous.language ?? previous.locale?.language) !==
      (this.hass.language ?? this.hass.locale?.language);
    return sensorChanged || languageChanged;
  }

  render(): TemplateResult {
    if (!this.hass || !this.config) {
      return html``;
    }

    const snapshot = getCardPausedSnapshot(this.hass);
    const pausedCount = Object.keys(snapshot.paused).length;

    return html`
      <ha-card>
        <div class="header">
          <ha-icon icon="mdi:bell-sleep"></ha-icon>
          ${this.config?.title || localize(this.hass, 'card.snoozed_title')}
          ${pausedCount > 0
            ? html`<span class="status-summary"
                >${localize(this.hass, 'status.active_count', { count: pausedCount })}</span
              >`
            : ''}
        </div>

        ${!isCardSnoozeSensorAvailable(this.hass)
          ? html`
              <div class="sensor-health-banner" role="status">
                ${localize(this.hass, 'status.sensor_unavailable')}
              </div>
            `
          : ''}

        ${pausedCount > 0
          ? html`<autosnooze-active-pauses
              .hass=${this.hass}
              .pauseGroups=${snapshot.groups}
              .pausedCount=${pausedCount}
              .readonly=${true}
            ></autosnooze-active-pauses>`
          : html`<div class="snoozed-empty" role="status">
              ${localize(this.hass, 'status.no_snoozed')}
            </div>`}
      </ha-card>
    `;
  }
}

defineAutoSnoozeElement('autosnooze-snoozed-card', AutoSnoozeSnoozedCard);
