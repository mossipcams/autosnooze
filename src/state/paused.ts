/**
 * Paused/scheduled automation state for AutoSnooze card.
 */

import type { HomeAssistant, PausedAutomationAttribute, ScheduledSnoozeAttribute } from '../types/hass.js';
import { SENSOR_SCHEMA_VERSION, type PauseGroup } from '../types/automation.js';

export const SENSOR_ENTITY_ID = 'sensor.autosnooze_snoozed_automations';
export const PAUSED_CONTRACT_VERSION = SENSOR_SCHEMA_VERSION;

interface ParsedPausedContract {
  paused: Record<string, PausedAutomationAttribute>;
  scheduled: Record<string, ScheduledSnoozeAttribute>;
}

interface PausedSnapshot extends ParsedPausedContract {
  groups: PauseGroup[];
}

const EMPTY_PAUSED: Record<string, PausedAutomationAttribute> = {};
const EMPTY_SCHEDULED: Record<string, ScheduledSnoozeAttribute> = {};
const EMPTY_GROUPS: PauseGroup[] = [];

let lastAttributes: unknown = null;
let lastSchemaVersion: unknown = null;
let lastPausedRoot: unknown = null;
let lastScheduledRoot: unknown = null;
let lastSnapshot: PausedSnapshot | null = null;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function isValidIsoDateTime(value: unknown): boolean {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function isNonNegativeNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isValidPausedEntry(value: unknown): value is PausedAutomationAttribute {
  const record = asRecord(value);
  if (!record) {
    return false;
  }
  return (record.friendly_name === undefined || typeof record.friendly_name === 'string')
    && isValidIsoDateTime(record.resume_at)
    && (record.paused_at === undefined || isValidIsoDateTime(record.paused_at))
    && (record.days === undefined || isNonNegativeNumber(record.days))
    && (record.hours === undefined || isNonNegativeNumber(record.hours))
    && (record.minutes === undefined || isNonNegativeNumber(record.minutes))
    && (record.disable_at === undefined || record.disable_at === null || isValidIsoDateTime(record.disable_at));
}

function isValidScheduledEntry(value: unknown): value is ScheduledSnoozeAttribute {
  const record = asRecord(value);
  if (!record) {
    return false;
  }
  if ((record.friendly_name !== undefined && typeof record.friendly_name !== 'string')
    || !isValidIsoDateTime(record.resume_at)
    || (record.disable_at !== undefined && !isValidIsoDateTime(record.disable_at))) {
    return false;
  }
  return record.disable_at === undefined
    || Date.parse(record.disable_at as string) < Date.parse(record.resume_at as string);
}

function asPausedMap(value: unknown): Record<string, PausedAutomationAttribute> | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const parsed: Record<string, PausedAutomationAttribute> = {};
  let validCount = 0;
  for (const [entityId, entry] of Object.entries(record)) {
    if (!entityId.startsWith('automation.') || !isValidPausedEntry(entry)) {
      continue;
    }
    parsed[entityId] = entry;
    validCount += 1;
  }
  return validCount === Object.keys(record).length
    ? value as Record<string, PausedAutomationAttribute>
    : parsed;
}

function asScheduledMap(value: unknown): Record<string, ScheduledSnoozeAttribute> | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const parsed: Record<string, ScheduledSnoozeAttribute> = {};
  let validCount = 0;
  for (const [entityId, entry] of Object.entries(record)) {
    if (!entityId.startsWith('automation.') || !isValidScheduledEntry(entry)) {
      continue;
    }
    parsed[entityId] = entry;
    validCount += 1;
  }
  return validCount === Object.keys(record).length
    ? value as Record<string, ScheduledSnoozeAttribute>
    : parsed;
}

/**
 * Parse sensor attributes using versioned contract with legacy fallback.
 */
export function parsePausedContract(attributes: unknown): ParsedPausedContract {
  const root = asRecord(attributes);
  if (!root) {
    return { paused: EMPTY_PAUSED, scheduled: EMPTY_SCHEDULED };
  }

  const schemaVersion = root.schema_version;

  // Explicitly supported versioned contract.
  if (schemaVersion === PAUSED_CONTRACT_VERSION) {
    const paused = asPausedMap(root.paused);
    const scheduled = asScheduledMap(root.scheduled);
    if (!paused || !scheduled) {
      return { paused: EMPTY_PAUSED, scheduled: EMPTY_SCHEDULED };
    }
    return { paused, scheduled };
  }

  // Unversioned transitional contract: accept normalized keys if present.
  if (schemaVersion === undefined) {
    const paused = asPausedMap(root.paused) ?? asPausedMap(root.paused_automations) ?? {};
    const scheduled = asScheduledMap(root.scheduled) ?? asScheduledMap(root.scheduled_snoozes) ?? {};
    if (Object.keys(paused).length > 0 || Object.keys(scheduled).length > 0) {
      return { paused, scheduled };
    }
  }

  // Legacy fallback.
  const legacyPaused = asPausedMap(root.paused_automations);
  const legacyScheduled = asScheduledMap(root.scheduled_snoozes);
  return {
    paused: legacyPaused ?? EMPTY_PAUSED,
    scheduled: legacyScheduled ?? EMPTY_SCHEDULED,
  };
}

function buildPauseGroups(
  paused: Record<string, PausedAutomationAttribute>
): PauseGroup[] {
  if (Object.keys(paused).length === 0) {
    return EMPTY_GROUPS;
  }

  const groups: Record<string, PauseGroup> = {};

  Object.entries(paused).forEach(([id, data]) => {
    const resumeAt = data.resume_at;
    if (!groups[resumeAt]) {
      groups[resumeAt] = {
        resumeAt,
        disableAt: data.disable_at,
        automations: [],
      };
    }
    groups[resumeAt].automations.push({
      entity_id: id,
      friendly_name: data.friendly_name,
      resume_at: data.resume_at,
      paused_at: data.paused_at,
      days: data.days,
      hours: data.hours,
      minutes: data.minutes,
      disable_at: data.disable_at,
      notification_trigger: data.notification_trigger,
    });
  });

  return Object.values(groups).sort(
    (a, b) => new Date(a.resumeAt).getTime() - new Date(b.resumeAt).getTime()
  );
}

export function getPausedSnapshot(hass: HomeAssistant): PausedSnapshot {
  const attributes = hass?.states?.[SENSOR_ENTITY_ID]?.attributes;
  const root = asRecord(attributes);
  const schemaVersion = root?.schema_version;
  const pausedRoot = root?.paused ?? root?.paused_automations;
  const scheduledRoot = root?.scheduled ?? root?.scheduled_snoozes;

  if (
    attributes === lastAttributes &&
    schemaVersion === lastSchemaVersion &&
    pausedRoot === lastPausedRoot &&
    scheduledRoot === lastScheduledRoot &&
    lastSnapshot
  ) {
    return lastSnapshot;
  }

  const parsed = parsePausedContract(attributes);
  lastAttributes = attributes;
  lastSchemaVersion = schemaVersion;
  lastPausedRoot = pausedRoot;
  lastScheduledRoot = scheduledRoot;
  lastSnapshot = {
    paused: parsed.paused,
    scheduled: parsed.scheduled,
    groups: buildPauseGroups(parsed.paused),
  };
  return lastSnapshot;
}

/**
 * Get paused automations from the sensor entity.
 */
export function getPaused(hass: HomeAssistant): Record<string, PausedAutomationAttribute> {
  return getPausedSnapshot(hass).paused;
}

/**
 * Get scheduled snoozes from the sensor entity.
 */
export function getScheduled(hass: HomeAssistant): Record<string, ScheduledSnoozeAttribute> {
  return getPausedSnapshot(hass).scheduled;
}

/**
 * Get paused automations grouped by resume time.
 */
export function getPausedGroupedByResumeTime(hass: HomeAssistant): PauseGroup[] {
  return getPausedSnapshot(hass).groups;
}
