/**
 * Error handling utilities for AutoSnooze card.
 */

import { ERROR_MESSAGES } from '../constants/index.js';

interface HAError {
  translation_key?: string;
  message?: string;
  data?: {
    translation_key?: string;
  };
}

/**
 * Get a user-friendly error message from an HA error.
 */
export function getErrorMessage(error: unknown, defaultMessage: string): string {
  const haError = error as HAError | undefined;

  // Check for HA translation key in error (preferred method)
  const translationKey = haError?.translation_key ?? haError?.data?.translation_key;
  if (translationKey && ERROR_MESSAGES[translationKey]) {
    return ERROR_MESSAGES[translationKey];
  }

  // Fallback: check error message for known patterns
  const errorMsg = haError?.message ?? '';
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    // Match translation key patterns in error message
    if (errorMsg.includes(key) || errorMsg.toLowerCase().includes(key.replace(/_/g, ' '))) {
      return message;
    }
  }

  return `${defaultMessage}. Check Home Assistant logs for details.`;
}
