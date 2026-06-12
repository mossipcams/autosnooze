import { LitElement, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { localize } from '../localization/localize.js';
import type { HomeAssistant, ScheduledSnoozeAttribute } from '../types/hass.js';
import { defineAutoSnoozeElement } from '../utils/custom-element-registration.js';
import { formatDateTime } from '../utils/time-formatting.js';

class AutoSnoozeScheduledPauses extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @property({ attribute: false }) scheduled: Record<string, ScheduledSnoozeAttribute> = {};

  protected createRenderRoot(): HTMLElement {
    return this;
  }

  protected render(): TemplateResult {
    const entries = Object.entries(this.scheduled);
    if (!entries.length) return html``;
    return html`
      <div class="scheduled-list" role="region" aria-label="${localize(this.hass, 'a11y.scheduled_region')}">
        <div class="list-header">
          <ha-icon icon="mdi:calendar-clock" aria-hidden="true"></ha-icon>
          ${localize(this.hass, 'section.scheduled_count', { count: entries.length })}
        </div>
        ${entries.map(([id, data]) => {
          const name = data.friendly_name || id;
          return html`
            <div class="scheduled-item" role="article" aria-label="${localize(this.hass, 'a11y.scheduled_pause_for', { name })}">
              <ha-icon class="scheduled-icon" icon="mdi:clock-outline" aria-hidden="true"></ha-icon>
              <div class="paused-info">
                <div class="paused-name">${name}</div>
                <div class="scheduled-time">${localize(this.hass, 'status.disables')} ${this.format(data.disable_at || 'now')}</div>
                <div class="paused-time">${localize(this.hass, 'status.resumes_at')} ${this.format(data.resume_at)}</div>
              </div>
              <button type="button" class="cancel-scheduled-btn" @click=${() => this.cancel(id)}
                aria-label="${localize(this.hass, 'a11y.cancel_scheduled_for', { name })}">
                ${localize(this.hass, 'button.cancel')}
              </button>
            </div>
          `;
        })}
      </div>
    `;
  }

  private format(value: string): string {
    return formatDateTime(value, this.hass?.locale?.language);
  }

  private cancel(entityId: string): void {
    this.dispatchEvent(new CustomEvent('cancel-scheduled', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }
}

defineAutoSnoozeElement('autosnooze-scheduled-pauses', AutoSnoozeScheduledPauses);
