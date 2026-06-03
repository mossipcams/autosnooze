/**
 * Card shell helpers for local UI state transitions.
 */

export { startCountdownSync as startCardShellCountdown, stopCountdownSync as stopCardShellCountdown } from '../../services/countdown-sync.js';

export interface AdjustModalState {
  adjustModalOpen: boolean;
  adjustModalEntityId: string;
  adjustModalFriendlyName: string;
  adjustModalResumeAt: string;
  adjustModalEntityIds: string[];
  adjustModalFriendlyNames: string[];
}

function formatLocalDateTime(value: Date): { date: string; time: string } {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  const hours = String(value.getHours()).padStart(2, '0');
  const minutes = String(value.getMinutes()).padStart(2, '0');
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
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
  const now = formatLocalDateTime(input.now);
  const resume = formatLocalDateTime(resumeDate);
  return {
    scheduleMode: true,
    disableAtDate: now.date,
    disableAtTime: now.time,
    resumeAtDate: resume.date,
    resumeAtTime: resume.time,
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
    ...createAdjustModalState({ resumeAt: '' }),
    adjustModalOpen: false,
  };
}
