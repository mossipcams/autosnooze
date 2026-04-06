/**
 * Shared countdown timer state used by countdown services and components.
 */

export interface CountdownState {
  interval: ReturnType<typeof globalThis.setInterval> | null;
  syncTimeout: ReturnType<typeof globalThis.setTimeout> | null;
}
