/**
 * Shared countdown timer state used by countdown services and components.
 */

export interface CountdownState {
  interval: number | null;
  syncTimeout: number | null;
}
