import { describe, expect, test, vi } from 'vitest';
import '../components/autosnooze-scheduled-pauses.js';
import type { HomeAssistant } from '../types/hass.js';

const hass = { language: 'en', locale: { language: 'en' } } as HomeAssistant;

describe('autosnooze-scheduled-pauses', () => {
  test('renders nothing for an empty schedule', async () => {
    const list = document.createElement('autosnooze-scheduled-pauses') as HTMLElement & {
      hass: HomeAssistant;
      scheduled: Record<string, never>;
      updateComplete: Promise<boolean>;
    };
    list.hass = hass;
    list.scheduled = {};
    document.body.appendChild(list);
    await list.updateComplete;
    expect(list.querySelector('.scheduled-list')).toBeNull();
  });

  test('renders schedule details and dispatches cancel', async () => {
    const list = document.createElement('autosnooze-scheduled-pauses') as HTMLElement & {
      hass: HomeAssistant;
      scheduled: Record<string, unknown>;
      updateComplete: Promise<boolean>;
    };
    list.hass = hass;
    list.scheduled = {
      'automation.kitchen': {
        friendly_name: 'Kitchen',
        disable_at: '2026-06-11T18:00:00Z',
        resume_at: '2026-06-11T19:00:00Z',
      },
    };
    const cancelled = vi.fn();
    list.addEventListener('cancel-scheduled', cancelled);
    document.body.appendChild(list);
    await list.updateComplete;

    expect(list.querySelector('.scheduled-list')?.getAttribute('role')).toBe('region');
    expect(list.textContent).toContain('Kitchen');
    expect(list.textContent).toContain('Disables:');
    expect(list.textContent).toContain('Resumes:');
    list.querySelector<HTMLButtonElement>('.cancel-scheduled-btn')?.click();
    expect(cancelled).toHaveBeenCalledTimes(1);
    expect((cancelled.mock.calls[0][0] as CustomEvent).detail).toEqual({ entityId: 'automation.kitchen' });
  });
});
