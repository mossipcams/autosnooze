// @ts-nocheck -- page-object test uses lightweight Playwright page doubles
import { describe, expect, test, vi } from 'vitest';
import { AutoSnoozeCard } from '../e2e/pages/AutoSnoozeCard';

function createPageDouble() {
  const locatorDouble = {
    locator: vi.fn(() => locatorDouble),
  };

  return {
    goto: vi.fn().mockResolvedValue(undefined),
    locator: vi.fn(() => locatorDouble),
    waitForTimeout: vi.fn().mockResolvedValue(undefined),
  };
}

describe('E2E navigation hardening', () => {
  test('AutoSnoozeCard.goto waits for domcontentloaded before HA/card readiness checks', async () => {
    const page = createPageDouble();
    const card = new AutoSnoozeCard(page as never);
    const waitForHassConnection = vi.spyOn(card, 'waitForHassConnection').mockResolvedValue(undefined);
    const waitForCardReady = vi.spyOn(card, 'waitForCardReady').mockResolvedValue(undefined);

    await card.goto();

    expect(page.goto).toHaveBeenCalledWith('/dashboard-testing/0', {
      waitUntil: 'domcontentloaded',
    });
    expect(waitForHassConnection).toHaveBeenCalledTimes(1);
    expect(waitForCardReady).toHaveBeenCalledTimes(1);
  });

  test('AutoSnoozeCard.goto retries once after an initial navigation timeout', async () => {
    const page = createPageDouble();
    page.goto
      .mockRejectedValueOnce(new Error('Timeout 30000ms exceeded'))
      .mockResolvedValueOnce(undefined);

    const card = new AutoSnoozeCard(page as never);
    vi.spyOn(card, 'waitForHassConnection').mockResolvedValue(undefined);
    vi.spyOn(card, 'waitForCardReady').mockResolvedValue(undefined);

    await card.goto();

    expect(page.goto).toHaveBeenCalledTimes(2);
    expect(page.waitForTimeout).toHaveBeenCalledWith(1000);
  });
});
