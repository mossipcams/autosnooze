import { authenticatedVisualTest as test, expect } from '../helpers/fixtures';
import {
  EXISTING_DASHBOARD_PATH,
  expectCardReady,
  loadCardResource,
} from '../helpers/ha';

test.describe('Command results @critical', () => {
  test('critical flow displays backend-confirmed partial outcome @critical', async ({ page }) => {
    await page.goto(EXISTING_DASHBOARD_PATH, { waitUntil: 'domcontentloaded' });
    await loadCardResource(page);
    const card = await expectCardReady(page);

    await card.evaluate((element) => {
      const controller = (element as unknown as {
        _controller: {
          _recordCommandOutcome: (
            response: object,
            fallback?: string,
            failed?: string[],
          ) => void;
        };
      })._controller;
      controller._recordCommandOutcome({
        status: 'partial_success',
        complete_success: false,
        partial_success: true,
        entities: [
          { entity_id: 'automation.ok', outcome: 'succeeded', recovery_status: 'none' },
          { entity_id: 'automation.failed', outcome: 'retrying', recovery_status: 'retrying' },
        ],
        recovery_required_entities: [],
      }, undefined, ['automation.failed']);
    });

    await expect(card.locator('.command-status')).toContainText('Retrying: automation.failed');
  });
});
