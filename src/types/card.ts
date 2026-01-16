/**
 * Lovelace card type definitions for AutoSnooze.
 */

import type { HomeAssistant } from './hass.js';

export interface AutoSnoozeCardConfig {
  type: string;
  title?: string;
}

export interface LovelaceCard extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: AutoSnoozeCardConfig): void;
  getCardSize(): number;
}

export interface LovelaceCardEditor extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: AutoSnoozeCardConfig): void;
}

export interface CustomCardEntry {
  type: string;
  name: string;
  description: string;
  preview: boolean;
}

export interface ConfigChangedEvent extends CustomEvent {
  detail: {
    config: AutoSnoozeCardConfig;
  };
}

declare global {
  interface Window {
    customCards?: CustomCardEntry[];
  }
}

export type FilterTab = 'all' | 'areas' | 'categories' | 'labels';

export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'failure'
  | 'selection';
