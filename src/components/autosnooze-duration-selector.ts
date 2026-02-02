/**
 * AutoSnooze Duration Selector child component.
 */

import { LitElement, html, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { durationSelectorStyles } from '../styles/duration-selector.styles.js';
import { localize } from '../localization/localize.js';
import {
  formatDurationShort,
  formatDuration,
  parseDurationInput,
  isDurationValid,
  durationToMinutes,
  minutesToDuration,
  generateDateOptions,
} from '../utils/index.js';
import { DEFAULT_DURATIONS } from '../constants/index.js';
import type { ParsedDuration } from '../types/automation.js';
import type { LastDurationData } from '../services/storage.js';
import type { HomeAssistant } from '../types/hass.js';

export class AutoSnoozeDurationSelector extends LitElement {
  static styles = durationSelectorStyles;

  @property({ attribute: false })
  hass?: HomeAssistant;

  @property({ type: Boolean })
  scheduleMode: boolean = false;

  @property({ attribute: false })
  customDuration: ParsedDuration = { days: 0, hours: 0, minutes: 30 };

  @property({ type: String })
  customDurationInput: string = '30m';

  @property({ type: Boolean })
  showCustomInput: boolean = false;

  @property({ attribute: false })
  lastDuration: LastDurationData | null = null;

  @property({ type: String })
  disableAtDate: string = '';

  @property({ type: String })
  disableAtTime: string = '';

  @property({ type: String })
  resumeAtDate: string = '';

  @property({ type: String })
  resumeAtTime: string = '';

  _getDurationPills(): { label: string; minutes: number | null }[] {
    const sensor = this.hass?.states?.['sensor.autosnooze_snoozed_automations'];
    const configuredPresets = sensor?.attributes?.duration_presets as
      | { label: string; minutes: number }[]
      | undefined;

    const basePresets: { label: string; minutes: number }[] =
      configuredPresets?.length
        ? configuredPresets
        : DEFAULT_DURATIONS.filter((d): d is { label: string; minutes: number } => d.minutes !== null);

    return [
      ...basePresets,
      { label: 'Custom', minutes: null },
    ];
  }

  _getDurationPreview(): string {
    const parsed = parseDurationInput(this.customDurationInput);
    if (!parsed) return '';
    return formatDuration(parsed.days, parsed.hours, parsed.minutes);
  }

  _isDurationValid(): boolean {
    return isDurationValid(this.customDurationInput);
  }

  _renderDateOptions(): TemplateResult[] {
    const options = generateDateOptions(365, this.hass?.locale?.language);
    return options.map(
      (opt) => html`<option value="${opt.value}">${opt.label}</option>`
    );
  }

  _renderLastDurationBadge(): TemplateResult | string {
    if (!this.lastDuration) return '';

    const sensor = this.hass?.states?.['sensor.autosnooze_snoozed_automations'];
    const configuredPresets = sensor?.attributes?.duration_presets as
      | { label: string; minutes: number }[]
      | undefined;
    const basePresets: { label: string; minutes: number }[] =
      configuredPresets?.length
        ? configuredPresets
        : DEFAULT_DURATIONS.filter((d): d is { label: string; minutes: number } => d.minutes !== null);

    const lastMinutes = this.lastDuration.minutes;
    const isUniqueFromPresets = !basePresets.some((d) => d.minutes === lastMinutes);

    if (!isUniqueFromPresets) return '';

    const { days, hours, minutes } = this.lastDuration.duration;
    const durationStr = formatDurationShort(days, hours, minutes).replace(/ /g, '');
    const currentMinutes = durationToMinutes(this.customDuration);
    const isActive = !this.showCustomInput && lastMinutes === currentMinutes;

    return html`
      <button
        type="button"
        class="last-duration-badge ${isActive ? 'active' : ''}"
        @click=${() => this._fireDurationChange(lastMinutes)}
      >
        <ha-icon icon="mdi:history" aria-hidden="true"></ha-icon>
        ${durationStr}
      </button>
    `;
  }

  _fireDurationChange(minutes: number, options?: { showCustomInput?: boolean }): void {
    const duration = minutesToDuration(minutes);
    const input = formatDurationShort(duration.days, duration.hours, duration.minutes) || '30m';
    this.dispatchEvent(new CustomEvent('duration-change', {
      detail: {
        minutes,
        duration,
        input,
        showCustomInput: options?.showCustomInput ?? false,
      },
      bubbles: true,
      composed: true,
    }));
  }

  _fireCustomDurationChange(value: string): void {
    const parsed = parseDurationInput(value);
    const totalMinutes = parsed ? durationToMinutes(parsed) : 0;
    this.dispatchEvent(new CustomEvent('duration-change', {
      detail: {
        minutes: totalMinutes,
        duration: parsed ?? { days: 0, hours: 0, minutes: 0 },
        input: value,
      },
      bubbles: true,
      composed: true,
    }));
  }

  _fireScheduleModeChange(enabled: boolean): void {
    this.dispatchEvent(new CustomEvent('schedule-mode-change', {
      detail: { enabled },
      bubbles: true,
      composed: true,
    }));
  }

  _fireScheduleFieldChange(field: string, value: string): void {
    this.dispatchEvent(new CustomEvent('schedule-field-change', {
      detail: { field, value },
      bubbles: true,
      composed: true,
    }));
  }

  render(): TemplateResult {
    if (this.scheduleMode) {
      return html`
        <div class="schedule-inputs">
          <div class="datetime-field">
            <label id="snooze-at-label">${localize(this.hass, 'schedule.snooze_at')}</label>
            <div class="datetime-row">
              <select
                .value=${this.disableAtDate}
                @change=${(e: Event) => this._fireScheduleFieldChange('disableAtDate', (e.target as HTMLSelectElement).value)}
                aria-labelledby="snooze-at-label"
              >
                <option value="">${localize(this.hass, 'schedule.select_date')}</option>
                ${this._renderDateOptions()}
              </select>
              <input
                type="time"
                .value=${this.disableAtTime}
                @input=${(e: Event) => this._fireScheduleFieldChange('disableAtTime', (e.target as HTMLInputElement).value)}
                aria-labelledby="snooze-at-label"
              />
            </div>
            <span class="field-hint">${localize(this.hass, 'schedule.hint_immediate')}</span>
          </div>
          <div class="datetime-field">
            <label id="resume-at-label">${localize(this.hass, 'schedule.resume_at')}</label>
            <div class="datetime-row">
              <select
                .value=${this.resumeAtDate}
                @change=${(e: Event) => this._fireScheduleFieldChange('resumeAtDate', (e.target as HTMLSelectElement).value)}
                aria-labelledby="resume-at-label"
              >
                <option value="">${localize(this.hass, 'schedule.select_date')}</option>
                ${this._renderDateOptions()}
              </select>
              <input
                type="time"
                .value=${this.resumeAtTime}
                @input=${(e: Event) => this._fireScheduleFieldChange('resumeAtTime', (e.target as HTMLInputElement).value)}
                aria-labelledby="resume-at-label"
              />
            </div>
          </div>
          <button
            type="button"
            class="schedule-link"
            @click=${() => this._fireScheduleModeChange(false)}
          >
            <ha-icon icon="mdi:timer-outline" aria-hidden="true"></ha-icon>
            ${localize(this.hass, 'schedule.back_to_duration')}
          </button>
        </div>
      `;
    }
    return html`
      <div class="duration-selector">
        <div class="duration-header-row">
          <div class="duration-section-header" id="duration-header">${localize(this.hass, 'duration.header')}</div>
          ${this._renderLastDurationBadge()}
        </div>
        <div class="duration-pills" role="radiogroup" aria-labelledby="duration-header">
          ${this._getDurationPills().map(
            (d) => {
              const currentMinutes = durationToMinutes(this.customDuration);
              const isActive = d.minutes === null
                ? this.showCustomInput
                : !this.showCustomInput && d.minutes === currentMinutes;
              return html`
                <button
                  type="button"
                  class="pill ${isActive ? 'active' : ''}"
                  @click=${() => {
                    if (d.minutes === null) {
                      this.dispatchEvent(new CustomEvent('custom-input-toggle', {
                        detail: { show: !this.showCustomInput },
                        bubbles: true,
                        composed: true,
                      }));
                    } else {
                      this._fireDurationChange(d.minutes, { showCustomInput: false });
                    }
                  }}
                  role="radio"
                  aria-checked=${isActive}
                >
                  ${d.label}
                </button>
              `;
            }
          )}
        </div>

        ${this.showCustomInput ? html`
          <div class="custom-duration-input">
            <input
              type="text"
              class="duration-input ${!this._isDurationValid() ? 'invalid' : ''}"
              placeholder="${localize(this.hass, 'duration.placeholder')}"
              .value=${this.customDurationInput}
              @input=${(e: Event) => this._fireCustomDurationChange((e.target as HTMLInputElement).value)}
              aria-label="${localize(this.hass, 'a11y.custom_duration')}"
              aria-invalid=${!this._isDurationValid()}
              aria-describedby="duration-help"
            />
            ${this._getDurationPreview() && this._isDurationValid()
              ? html`<div class="duration-preview" role="status" aria-live="polite">${localize(this.hass, 'duration.preview_label')} ${this._getDurationPreview()}</div>`
              : html`<div class="duration-help" id="duration-help">${localize(this.hass, 'duration.help')}</div>`}
          </div>
        ` : ''}

        <button
          type="button"
          class="schedule-link"
          @click=${() => this._fireScheduleModeChange(true)}
        >
          ${localize(this.hass, 'schedule.pick_datetime')}
        </button>
      </div>
    `;
  }
}
