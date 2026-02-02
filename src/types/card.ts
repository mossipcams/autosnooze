/**
 * Lovelace card type definitions for AutoSnooze.
 */

export interface AutoSnoozeCardConfig {
  type: string;
  title?: string;
}

export interface CustomCardEntry {
  type: string;
  name: string;
  description: string;
  preview: boolean;
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
