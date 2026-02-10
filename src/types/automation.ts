/**
 * Automation-related type definitions for AutoSnooze.
 * These types align with the Python models in models.py.
 */

/**
 * Represents a currently paused automation.
 * Matches Python PausedAutomation dataclass.
 */
export interface PausedAutomation {
  entity_id: string;
  friendly_name: string;
  resume_at: string; // ISO datetime string
  paused_at: string; // ISO datetime string
  days: number;
  hours: number;
  minutes: number;
  disable_at?: string; // ISO datetime string, set when snooze originated from schedule mode
}

/**
 * Represents a scheduled future snooze.
 * Matches Python ScheduledSnooze dataclass.
 */
export interface ScheduledSnooze {
  entity_id: string;
  friendly_name: string;
  disable_at: string; // ISO datetime string
  resume_at: string; // ISO datetime string
}

/**
 * Frontend representation of an automation entity.
 */
export interface AutomationItem {
  id: string;
  name: string;
  area_id: string | null;
  category_id: string | null;
  labels: string[];
}

/**
 * Group of paused automations with the same resume time.
 */
export interface PauseGroup {
  resumeAt: string;
  disableAt?: string;
  automations: PausedAutomation[];
}

/**
 * Duration parsed from user input.
 */
export interface ParsedDuration {
  days: number;
  hours: number;
  minutes: number;
}

/**
 * Duration preset button definition.
 */
export interface DurationPreset {
  label: string;
  minutes: number | null; // null for "Custom"
}

/**
 * Base service call data that can be passed to HA services.
 */
export type ServiceData = Record<string, unknown>;

/**
 * Service call parameters for pause operation.
 */
export interface PauseServiceParams extends ServiceData {
  entity_id: string | string[];
  days?: number;
  hours?: number;
  minutes?: number;
  disable_at?: string;
  resume_at?: string;
  confirm?: boolean;
}

/**
 * Service call parameters for pause by area.
 */
export interface PauseByAreaParams extends ServiceData {
  area_id: string | string[];
  days?: number;
  hours?: number;
  minutes?: number;
  disable_at?: string;
  resume_at?: string;
}

/**
 * Service call parameters for pause by label.
 */
export interface PauseByLabelParams extends ServiceData {
  label_id: string | string[];
  days?: number;
  hours?: number;
  minutes?: number;
  disable_at?: string;
  resume_at?: string;
}
