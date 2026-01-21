/**
 * Shared translation keys that are used in both the frontend and the
 * Home Assistant backend (custom_components/autosnooze/translations/*.json).
 *
 * These keys should match the structure used in Home Assistant translation files.
 */

/**
 * Keys shared between frontend and backend.
 * Keep these in sync with custom_components/autosnooze/translations/*.json
 */
export const SHARED_KEYS = {
  // Card titles and headers
  CARD_TITLE: 'card.title',
  CARD_DESCRIPTION: 'card.description',

  // Common buttons
  BUTTON_SAVE: 'common.button.save',
  BUTTON_CANCEL: 'common.button.cancel',
  BUTTON_DELETE: 'common.button.delete',
  BUTTON_EDIT: 'common.button.edit',
  BUTTON_ADD: 'common.button.add',

  // Snooze actions
  SNOOZE_START: 'snooze.action.start',
  SNOOZE_STOP: 'snooze.action.stop',
  SNOOZE_EXTEND: 'snooze.action.extend',

  // Snooze duration labels
  DURATION_MINUTES: 'snooze.duration.minutes',
  DURATION_HOURS: 'snooze.duration.hours',
  DURATION_DAYS: 'snooze.duration.days',
  DURATION_CUSTOM: 'snooze.duration.custom',

  // Status messages
  STATUS_ACTIVE: 'snooze.status.active',
  STATUS_INACTIVE: 'snooze.status.inactive',
  STATUS_EXPIRED: 'snooze.status.expired',

  // Time remaining
  TIME_REMAINING: 'snooze.time_remaining',

  // Entity labels
  ENTITY_SELECT: 'entity.select',
  ENTITY_NONE: 'entity.none',

  // Validation messages
  VALIDATION_REQUIRED: 'validation.required',
  VALIDATION_INVALID_DURATION: 'validation.invalid_duration',

  // Error messages
  ERROR_GENERIC: 'error.generic',
  ERROR_CONNECTION: 'error.connection',
  ERROR_NOT_FOUND: 'error.not_found',
} as const;

/**
 * Frontend-only translation keys.
 * These are not shared with the backend.
 */
export const FRONTEND_KEYS = {
  // Card editor
  EDITOR_TITLE: 'editor.title',
  EDITOR_ENTITY_LABEL: 'editor.entity_label',
  EDITOR_NAME_LABEL: 'editor.name_label',
  EDITOR_SHOW_STATE: 'editor.show_state',

  // Quick actions
  QUICK_SNOOZE_15M: 'quick_snooze.15m',
  QUICK_SNOOZE_30M: 'quick_snooze.30m',
  QUICK_SNOOZE_1H: 'quick_snooze.1h',
  QUICK_SNOOZE_2H: 'quick_snooze.2h',
  QUICK_SNOOZE_CUSTOM: 'quick_snooze.custom',

  // Confirmation dialogs
  CONFIRM_DELETE_TITLE: 'confirm.delete.title',
  CONFIRM_DELETE_MESSAGE: 'confirm.delete.message',

  // Accessibility
  A11Y_SNOOZE_BUTTON: 'a11y.snooze_button',
  A11Y_TIME_PICKER: 'a11y.time_picker',
  A11Y_ENTITY_SELECTOR: 'a11y.entity_selector',

  // Loading states
  LOADING: 'loading',
  LOADING_ENTITIES: 'loading.entities',
} as const;

/**
 * Type for all shared keys
 */
export type SharedKey = (typeof SHARED_KEYS)[keyof typeof SHARED_KEYS];

/**
 * Type for all frontend keys
 */
export type FrontendKey = (typeof FRONTEND_KEYS)[keyof typeof FRONTEND_KEYS];

/**
 * Type for all translation keys
 */
export type TranslationKey = SharedKey | FrontendKey;
