import { expect, test } from '@playwright/test';
import { createChecklist } from './checkpoint';

test.use({ video: 'off', launchOptions: { slowMo: 0 } });

test('Checklist retains results and does not mark failed assertions as passed', async ({ page }) => {
  await page.setContent('<button>App action</button>');
  const checklist = createChecklist(page, ['First check', 'Second check']);
  const overlay = page.locator('[data-playwright-video-checkpoint]');
  const first = overlay.locator('[data-criterion="0"]');
  const second = overlay.locator('[data-criterion="1"]');
  await checklist.show('Ready');
  await expect(overlay.locator('[data-state="pending"]')).toHaveCount(2);
  await checklist.check(0, async () => {
    await expect(first).toHaveAttribute('data-state', 'checking');
    await expect(page.getByRole('button', { name: 'App action' })).toBeVisible();
  }, { holdMs: 0 });
  await page.getByRole('button', { name: 'App action' }).click();
  await checklist.show('Next action');
  await expect(first).toHaveAttribute('data-state', 'passed');
  const failure = new Error('Expected failure');
  await expect(checklist.check(1, async () => {
    await expect(second).toHaveAttribute('data-state', 'checking');
    throw failure;
  }, { holdMs: 0 })).rejects.toBe(failure);
  await expect(first).toHaveAttribute('data-state', 'passed');
  await expect(second).toHaveAttribute('data-state', 'failed');
  // Reattach after replacing the document without losing the recorded results.
  await page.setContent('<p>Next page</p>');
  await checklist.show('Continue');
  await expect(overlay).toHaveCount(1);
  await expect(first).toHaveAttribute('data-state', 'passed');
  await expect(second).toHaveAttribute('data-state', 'failed');
  await expect(checklist.check(-1, async () => {})).rejects.toThrow(RangeError);
});
