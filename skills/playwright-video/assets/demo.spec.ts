import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { createChecklist } from './checkpoint';

const criteria = [
  'A new task appears in the table',
  'The row gets a new title and owner',
  'The updated task is marked Done',
];

test('Add a table row and save an update', async ({ page }) => {
  test.setTimeout(60_000);
  // Standalone demo only. Navigate to your real app when collecting app evidence.
  await page.setContent(readFileSync(join(__dirname, 'demo.html'), 'utf8'));
  const checklist = createChecklist(page, criteria);
  await checklist.show('Acceptance criteria');
  const overlay = page.locator('[data-playwright-video-checkpoint]');
  const table = page.getByRole('table', { name: 'Project tasks' });
  const rows = table.locator('tbody tr');
  const title = page.getByRole('textbox', { name: 'Task title' });
  const owner = page.getByRole('textbox', { name: 'Owner' });
  const status = page.getByRole('combobox', { name: 'Status' });

  await test.step('Show the starting table', async () => {
    await expect(rows).toHaveCount(2);
    await checklist.show('Start with two tasks', { holdMs: 1800 });
  });
  await test.step('Add a task with a title and owner', async () => {
    await page.getByRole('button', { name: '+ Add task', exact: true }).click();
    await title.pressSequentially('Write launch notes', { delay: 95 });
    await owner.click();
    await owner.pressSequentially('Alex', { delay: 130 });
    await status.selectOption('To do');
    await expect(title).toHaveValue('Write launch notes');
    await expect(owner).toHaveValue('Alex');
    await expect(overlay).toBeVisible();
    await checklist.show('Fill in the new row', { target: rows.last(), holdMs: 1800 });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await checklist.check(0, async () => {
      await expect(overlay.locator('[data-criterion="0"]')).toHaveAttribute('data-state', 'checking');
      await expect(rows).toHaveCount(3);
      await expect(rows.last().getByRole('cell')).toHaveText(['Write launch notes', 'Alex', 'To do', 'Edit']);
      await expect(page.getByRole('status')).toHaveText('Added: Write launch notes');
    }, { target: rows.last(), holdMs: 2200 });
  });
  await test.step('Edit the row that was just added', async () => {
    await checklist.show('Edit the new row');
    await rows.last().getByRole('button', { name: 'Edit', exact: true }).click();
    await title.selectText();
    await title.press('Backspace');
    await title.pressSequentially('Review launch notes', { delay: 95 });
    await owner.click();
    await owner.selectText();
    await owner.press('Backspace');
    await owner.pressSequentially('Jamie', { delay: 130 });
    await status.selectOption('Done');
    await expect(title).toHaveValue('Review launch notes');
    await expect(owner).toHaveValue('Jamie');
    await expect(status).toHaveValue('Done');
    await expect(overlay).toBeVisible();
    await expect(overlay.locator('[data-criterion="0"]')).toHaveAttribute('data-state', 'passed');
    await checklist.show('Change the title, owner, and status', { target: rows.last(), holdMs: 1800 });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await checklist.check(1, async () => {
      await expect(rows).toHaveCount(3);
      await expect(rows.last().getByRole('cell').nth(0)).toHaveText('Review launch notes');
      await expect(rows.last().getByRole('cell').nth(1)).toHaveText('Jamie');
      await expect(page.getByRole('status')).toHaveText('Updated: Review launch notes');
      await expect(rows.first().getByRole('cell')).toHaveText(['Plan the kickoff', 'Sam', 'Done', 'Edit']);
      await expect(rows.nth(1).getByRole('cell')).toHaveText(['Prepare the demo', 'Morgan', 'In progress', 'Edit']);
    }, { target: rows.last(), holdMs: 2200 });
    await checklist.check(2, async () => {
      await expect(rows.last().getByRole('cell').nth(2)).toHaveText('Done');
    }, { target: rows.last().getByRole('cell').nth(2), holdMs: 2200 });
  });
  await expect(overlay.locator('[data-state="passed"]')).toHaveCount(3);
  await expect(overlay).toBeVisible();
  await checklist.show('All acceptance criteria passed', { holdMs: 2200 });
});
