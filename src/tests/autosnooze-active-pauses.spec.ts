import { describe, expect, test, vi } from 'vitest';
import { AutoSnoozeActivePauses } from '../components/autosnooze-active-pauses.js';

type TestActivePauses = {
  connectedCallback: () => void;
  disconnectedCallback: () => void;
  _countdownState: {
    interval: ReturnType<typeof globalThis.setInterval> | null;
    syncTimeout: ReturnType<typeof globalThis.setTimeout> | null;
  };
};

describe('AutoSnoozeActivePauses countdown lifecycle', () => {
  test('schedules a bootstrap sync timeout when connected before pause groups are populated', () => {
    vi.useFakeTimers();

    if (!customElements.get('test-autosnooze-active-pauses')) {
      customElements.define('test-autosnooze-active-pauses', AutoSnoozeActivePauses);
    }

    const element = document.createElement('test-autosnooze-active-pauses') as unknown as TestActivePauses;

    element.connectedCallback();

    expect(element._countdownState.interval).toBeNull();
    expect(element._countdownState.syncTimeout).not.toBeNull();

    element.disconnectedCallback();
    vi.useRealTimers();
  });
});
