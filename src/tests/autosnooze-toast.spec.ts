import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../components/autosnooze-toast.js';

describe('autosnooze-toast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  test('renders accessible messages and optional undo', () => {
    const toast = document.createElement('autosnooze-toast') as HTMLElement & {
      show: (message: string, undoLabel: string, undoAria: string, undo?: () => void) => void;
    };
    const undo = vi.fn();
    document.body.appendChild(toast);

    toast.show('Paused', 'Undo', 'Undo last action', undo);
    expect(toast.querySelector('.toast')?.getAttribute('role')).toBe('alert');
    expect(toast.querySelector('.toast')?.getAttribute('aria-live')).toBe('polite');
    expect(toast.querySelector('.toast')?.getAttribute('aria-atomic')).toBe('true');
    toast.querySelector<HTMLButtonElement>('.toast-undo-btn')?.click();
    expect(undo).toHaveBeenCalledTimes(1);
    expect(toast.querySelector('.toast')).toBeNull();
  });

  test('replaces messages and removes them after fade', () => {
    const toast = document.createElement('autosnooze-toast') as HTMLElement & {
      show: (message: string, undoLabel: string) => void;
    };
    document.body.appendChild(toast);

    toast.show('First', 'Undo');
    toast.show('Second', 'Undo');
    expect(toast.querySelectorAll('.toast')).toHaveLength(1);
    expect(toast.textContent).toBe('Second');
    vi.runAllTimers();
    expect(toast.querySelector('.toast')).toBeNull();
  });

  test('clears pending work when disconnected', () => {
    const toast = document.createElement('autosnooze-toast') as HTMLElement & {
      show: (message: string, undoLabel: string) => void;
    };
    document.body.appendChild(toast);
    toast.show('Pending', 'Undo');
    toast.remove();
    vi.runAllTimers();
    expect(toast.querySelector('.toast')).toBeNull();
  });
});
