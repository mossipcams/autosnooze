/**
 * Home Assistant type definitions for AutoSnooze card.
 * These types represent the HA objects and APIs used by the frontend.
 */

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
}

export interface HassEntities {
  [entity_id: string]: HassEntity;
}

export interface HassArea {
  area_id: string;
  name: string;
  picture: string | null;
}

export interface HassAreas {
  [area_id: string]: HassArea;
}

export interface HassLabel {
  label_id: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
}

export interface HassCategory {
  category_id: string;
  name: string;
  icon?: string;
}

export interface HassEntityRegistryEntry {
  entity_id: string;
  area_id: string | null;
  labels: string[];
  categories: Record<string, string>;
}

export interface HassConnection {
  sendMessagePromise<T>(message: { type: string; [key: string]: unknown }): Promise<T>;
}

export interface HassLocale {
  language: string;
}

export interface HomeAssistant {
  states: HassEntities;
  entities: Record<string, HassEntityRegistryEntry>;
  areas: HassAreas;
  connection: HassConnection;
  locale?: HassLocale;
  language?: string;
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>
  ): Promise<void>;
}

export interface AutoSnoozeSensorAttributes {
  paused: Record<string, PausedAutomationAttribute>;
  scheduled: Record<string, ScheduledSnoozeAttribute>;
  [key: string]: unknown;
}

export interface PausedAutomationAttribute {
  friendly_name: string;
  resume_at: string;
  paused_at: string;
  days: number;
  hours: number;
  minutes: number;
  disable_at?: string;
}

export interface ScheduledSnoozeAttribute {
  friendly_name: string;
  disable_at: string;
  resume_at: string;
}
