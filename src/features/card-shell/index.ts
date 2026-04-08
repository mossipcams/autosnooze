/**
 * Card shell helpers for local UI state transitions.
 */

import { startCountdownSync, stopCountdownSync } from '../../services/countdown-sync.js';
import type { CountdownState } from '../../utils/countdown-timer.js';

interface AdjustModalState {
  adjustModalOpen: boolean;
  adjustModalEntityId: string;
  adjustModalFriendlyName: string;
  adjustModalResumeAt: string;
  adjustModalEntityIds: string[];
  adjustModalFriendlyNames: string[];
}

function formatLocalDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalTime(value: Date): string {
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function createScheduleModeState(input: {
  enabled: boolean;
  now: Date;
  resumeMinutes: number;
}): {
  scheduleMode: boolean;
  disableAtDate: string;
  disableAtTime: string;
  resumeAtDate: string;
  resumeAtTime: string;
} {
  if (!input.enabled) {
    return {
      scheduleMode: false,
      disableAtDate: '',
      disableAtTime: '',
      resumeAtDate: '',
      resumeAtTime: '',
    };
  }

  const resumeDate = new Date(input.now.getTime() + (input.resumeMinutes * 60 * 1000));
  return {
    scheduleMode: true,
    disableAtDate: formatLocalDate(input.now),
    disableAtTime: formatLocalTime(input.now),
    resumeAtDate: formatLocalDate(resumeDate),
    resumeAtTime: formatLocalTime(resumeDate),
  };
}

export function createAdjustModalState(input: {
  entityId?: string;
  friendlyName?: string;
  entityIds?: string[];
  friendlyNames?: string[];
  resumeAt: string;
}): AdjustModalState {
  return {
    adjustModalOpen: true,
    adjustModalEntityId: input.entityId ?? '',
    adjustModalFriendlyName: input.friendlyName ?? '',
    adjustModalResumeAt: input.resumeAt,
    adjustModalEntityIds: input.entityIds ?? [],
    adjustModalFriendlyNames: input.friendlyNames ?? [],
  };
}

export function createClosedAdjustModalState(): AdjustModalState {
  return {
    adjustModalOpen: false,
    adjustModalEntityId: '',
    adjustModalFriendlyName: '',
    adjustModalResumeAt: '',
    adjustModalEntityIds: [],
    adjustModalFriendlyNames: [],
  };
}

export function startCardShellCountdown(onTick: () => void): CountdownState {
  return startCountdownSync(onTick);
}

export function stopCardShellCountdown(state: CountdownState): void {
  stopCountdownSync(state);
}
