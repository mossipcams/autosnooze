import { expect, Page } from '@playwright/test';
import { test } from '../fixtures/hass.fixture';

type ConfigEntry = {
  entry_id: string;
  domain: string;
  state?: string;
};

type OptionsFlowForm = {
  flow_id: string;
  type: string;
  data_schema?: Array<{ name: string; default?: unknown }>;
};

async function callHassApi<T>(
  page: Page,
  apiPath: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  return await page.evaluate(
    async ({ apiPath, init }) => {
      function findAccessToken(value: unknown): string | null {
        if (!value || typeof value !== 'object') {
          return null;
        }
        if ('access_token' in value && typeof value.access_token === 'string') {
          return value.access_token;
        }
        for (const child of Object.values(value)) {
          const found = findAccessToken(child);
          if (found) {
            return found;
          }
        }
        return null;
      }

      let accessToken: string | null = null;
      for (const key of Object.keys(localStorage)) {
        if (!key.toLowerCase().includes('hass')) {
          continue;
        }
        try {
          accessToken = findAccessToken(JSON.parse(localStorage.getItem(key) || 'null'));
        } catch {
          continue;
        }
        if (accessToken) {
          break;
        }
      }
      if (!accessToken) {
        throw new Error('Could not find a Home Assistant access token in localStorage');
      }

      const response = await fetch(apiPath, {
        method: init.method || 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) {
        throw new Error(`${init.method || 'GET'} ${apiPath} failed (${response.status}): ${text}`);
      }
      return data;
    },
    { apiPath, init },
  );
}

async function getAutoSnoozeEntry(page: Page): Promise<ConfigEntry> {
  const entries = await callHassApi<ConfigEntry[]>(
    page,
    '/api/config/config_entries/entry?domain=autosnooze',
  );
  const entry = entries[0];
  if (!entry) {
    throw new Error('No AutoSnooze config entry found');
  }
  return entry;
}

async function startOptionsFlow(page: Page): Promise<OptionsFlowForm> {
  const entry = await getAutoSnoozeEntry(page);
  return await callHassApi<OptionsFlowForm>(page, '/api/config/config_entries/options/flow', {
    method: 'POST',
    body: { handler: entry.entry_id },
  });
}

async function readTelemetryEnabledDefault(page: Page): Promise<boolean> {
  const flow = await startOptionsFlow(page);
  const field = flow.data_schema?.find((item) => item.name === 'telemetry_enabled');
  if (!field) {
    throw new Error('Options flow is missing telemetry_enabled');
  }
  // Discard the open flow by submitting current defaults so we do not leave it dangling.
  const userInput: Record<string, string | boolean> = {};
  for (const item of flow.data_schema ?? []) {
    if (item.default !== undefined) {
      userInput[item.name] = item.default as string | boolean;
    }
  }
  await callHassApi(page, `/api/config/config_entries/options/flow/${flow.flow_id}`, {
    method: 'POST',
    body: userInput,
  });
  return Boolean(field.default);
}

async function setTelemetryEnabled(page: Page, enabled: boolean): Promise<void> {
  const flow = await startOptionsFlow(page);
  const userInput: Record<string, string | boolean> = {};
  for (const item of flow.data_schema ?? []) {
    if (item.name === 'telemetry_enabled') {
      userInput[item.name] = enabled;
    } else if (item.default !== undefined && item.default !== '') {
      userInput[item.name] = item.default as string | boolean;
    }
  }
  userInput.telemetry_enabled = enabled;

  const result = await callHassApi<{ type: string }>(
    page,
    `/api/config/config_entries/options/flow/${flow.flow_id}`,
    {
      method: 'POST',
      body: userInput,
    },
  );
  if (result.type !== 'create_entry') {
    throw new Error(`Options flow did not save: ${JSON.stringify(result)}`);
  }

  await expect
    .poll(async () => readTelemetryEnabledDefault(page), {
      message: `telemetry_enabled should be ${enabled}`,
      timeout: 15000,
    })
    .toBe(enabled);
}

test.describe('AutoSnooze release-gate smoke @smoke', () => {
  test.beforeEach(async ({ resetAutomations: _resetAutomations }) => {
    // The fixture resets snoozes and automation states before and after the test.
  });

  test('critical card workflow: load, snooze, persist, and resume @smoke', async ({
    autosnoozeCard,
    getState,
    page,
  }) => {
    await expect(autosnoozeCard.snoozeButton).toBeDisabled();

    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.selectDuration('15m');
    await autosnoozeCard.snooze();

    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(1);
    expect(await getState('automation.living_room_motion_lights')).toBe('off');

    await page.reload();
    await autosnoozeCard.waitForCardReady();
    await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');

    await autosnoozeCard.wakeAutomation('Living Room Motion Lights');
    await autosnoozeCard.waitForPausedAutomationGone('Living Room Motion Lights');
    await autosnoozeCard.expectPausedCount(0);
    expect(await getState('automation.living_room_motion_lights')).toBe('on');
  });

  test('invalid duration is rejected before a service call @smoke', async ({ autosnoozeCard }) => {
    await autosnoozeCard.selectAutomation('Living Room Motion Lights');
    await autosnoozeCard.setCustomDuration('invalid');

    expect(await autosnoozeCard.isDurationInputValid()).toBe(false);
    await autosnoozeCard.expectSnoozeButtonDisabled();
    await autosnoozeCard.expectPausedCount(0);
  });

  test('disabling telemetry keeps card workflow working @smoke', async ({
    autosnoozeCard,
    callService,
    getState,
    page,
  }) => {
    test.setTimeout(60000);
    const previousEnabled = await readTelemetryEnabledDefault(page);

    try {
      await setTelemetryEnabled(page, false);

      await callService('autosnooze', 'report_telemetry', {
        event: 'snooze_button_clicked',
        properties: { strategy: 'duration' },
        source: 'card',
        card_type: 'full',
      });

      await autosnoozeCard.selectAutomation('Living Room Motion Lights');
      await autosnoozeCard.selectDuration('15m');
      await autosnoozeCard.snooze();

      await autosnoozeCard.waitForPausedAutomation('Living Room Motion Lights');
      await autosnoozeCard.expectPausedCount(1);
      expect(await getState('automation.living_room_motion_lights')).toBe('off');

      await autosnoozeCard.wakeAutomation('Living Room Motion Lights');
      await autosnoozeCard.waitForPausedAutomationGone('Living Room Motion Lights');
      await autosnoozeCard.expectPausedCount(0);
      expect(await getState('automation.living_room_motion_lights')).toBe('on');

      expect(await readTelemetryEnabledDefault(page)).toBe(false);
    } finally {
      await setTelemetryEnabled(page, previousEnabled);
    }
  });
});
