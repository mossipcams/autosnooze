/**
 * AutoSnooze Card Editor Component.
 * Configuration editor for the AutoSnooze Lovelace card.
 */

import { LitElement, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { localized } from '@lit/localize';
import { msg, initializeLocaleFromHA } from '../localization/localize.js';
import type { HomeAssistant } from '../types/hass.js';
import type { AutoSnoozeCardConfig } from '../types/card.js';
import { editorStyles } from '../styles/editor.styles.js';

@localized()
export class AutomationPauseCardEditor extends LitElement {
  static styles = editorStyles;

  private _hass?: HomeAssistant;
  private _currentLanguage?: string;

  @property({ attribute: false })
  set hass(value: HomeAssistant | undefined) {
    const oldValue = this._hass;
    this._hass = value;

    // Auto-detect language changes and update locale
    const newLanguage = value?.language ?? value?.locale?.language;
    if (newLanguage !== this._currentLanguage) {
      this._currentLanguage = newLanguage;
      if (value) {
        initializeLocaleFromHA(value);
      }
    }

    this.requestUpdate('hass', oldValue);
  }

  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  @state()
  private _config: AutoSnoozeCardConfig = {} as AutoSnoozeCardConfig;

  setConfig(config: AutoSnoozeCardConfig): void {
    this._config = config;
  }

  private _valueChanged(key: string, value: string): void {
    if (!this._config) return;

    const newConfig = { ...this._config, [key]: value };
    if (value === '' || value === null || value === undefined) {
      delete (newConfig as Record<string, unknown>)[key];
    }

    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      })
    );
  }

  render(): TemplateResult {
    if (!this._config) return html``;

    return html`
      <div class="row">
        <label for="title-input">${msg('Title', { id: 'editor.title_label' })}</label>
        <input
          id="title-input"
          type="text"
          .value=${this._config.title ?? ''}
          @input=${(e: Event) =>
            this._valueChanged('title', (e.target as HTMLInputElement).value)}
          placeholder="${msg('AutoSnooze', { id: 'editor.title_placeholder' })}"
        />
      </div>
    `;
  }
}
