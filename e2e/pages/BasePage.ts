import { Page } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async waitForHassConnection(): Promise<void> {
    await this.page.waitForFunction(
      () => {
        const ha = document.querySelector('home-assistant') as HTMLElement & {
          hass?: { connection?: unknown };
        };
        return ha?.hass?.connection;
      },
      { timeout: 60000 }
    );
  }

  async waitForStateChange(entityId: string, expectedState: string): Promise<void> {
    await this.page.waitForFunction(
      ([id, state]) => {
        const ha = document.querySelector('home-assistant') as HTMLElement & {
          hass?: { states?: Record<string, { state: string }> };
        };
        return ha?.hass?.states?.[id]?.state === state;
      },
      [entityId, expectedState] as [string, string],
      { timeout: 10000 }
    );
  }

  async getEntityState(entityId: string): Promise<string> {
    return await this.page.evaluate((id) => {
      const ha = document.querySelector('home-assistant') as HTMLElement & {
        hass?: { states?: Record<string, { state: string }> };
      };
      return ha?.hass?.states?.[id]?.state ?? 'unknown';
    }, entityId);
  }

  async callService(domain: string, service: string, data: object = {}): Promise<void> {
    await this.page.evaluate(
      async ({ domain, service, data }) => {
        const ha = document.querySelector('home-assistant') as HTMLElement & {
          hass?: { callService?: (d: string, s: string, sd: object) => Promise<void> };
        };
        await ha?.hass?.callService?.(domain, service, data);
      },
      { domain, service, data }
    );
    // Give HA time to process
    await this.page.waitForTimeout(100);
  }
}
