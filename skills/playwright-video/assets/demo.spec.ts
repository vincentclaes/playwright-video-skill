import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { checkpoint } from './checkpoint';

const criteria = [
  'A new task appears in the table',
  'The same row gets a new title and owner',
  'The updated task is marked Done',
];

test('Add a table row and save an update', async ({ page }) => {
  test.setTimeout(60_000);
  // Standalone demo only. Navigate to your real app when collecting app evidence.
  await page.setContent(readFileSync(join(__dirname, 'demo.html'), 'utf8'));
  const table = page.getByRole('table', { name: 'Project tasks' });
  const rows = table.locator('tbody tr');
  const title = page.getByRole('textbox', { name: 'Task title' });
  const owner = page.getByRole('textbox', { name: 'Owner' });
  const status = page.getByRole('combobox', { name: 'Status' });

  await test.step('Show the starting table', async () => {
    await expect(rows).toHaveCount(2);
    await checkpoint(page, 'Start with two tasks', { criteria, target: table, holdMs: 1800 });
  });
  await test.step('Add a task with a title and owner', async () => {
    await page.getByRole('button', { name: '+ Add task', exact: true }).click();
    await title.pressSequentially('Write launch notes', { delay: 95 });
    await owner.click();
    await owner.pressSequentially('Alex', { delay: 130 });
    await status.selectOption('To do');
    await expect(title).toHaveValue('Write launch notes');
    await expect(owner).toHaveValue('Alex');
    await checkpoint(page, 'Fill in the new row', { criteria, target: rows.last(), holdMs: 1800 });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(rows).toHaveCount(3);
    await expect(rows.last().getByRole('cell')).toHaveText(['Write launch notes', 'Alex', 'To do', 'Edit']);
    await expect(page.getByRole('status')).toHaveText('Added: Write launch notes');
    await checkpoint(page, '1. New row saved', { criteria, active: 0, target: rows.last(), holdMs: 2200 });
  });
  await test.step('Edit the row that was just added', async () => {
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
    await checkpoint(page, 'Change the title, owner, and status', { criteria, target: rows.last(), holdMs: 1800 });
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(rows).toHaveCount(3);
    await expect(rows.last().getByRole('cell')).toHaveText(['Review launch notes', 'Jamie', 'Done', 'Edit']);
    await expect(page.getByRole('status')).toHaveText('Updated: Review launch notes');
    await expect(rows.first().getByRole('cell')).toHaveText(['Plan the kickoff', 'Sam', 'Done', 'Edit']);
    await expect(rows.nth(1).getByRole('cell')).toHaveText(['Prepare the demo', 'Morgan', 'In progress', 'Edit']);
    await checkpoint(page, '2. Changes saved in the same row', { criteria, active: 1, target: rows.last(), holdMs: 2200 });
    await checkpoint(page, '3. Updated task is Done', { criteria, active: 2, target: rows.last().getByText('Done', { exact: true }), holdMs: 2200 });
  });
  await expect(page.locator('[data-playwright-video-checkpoint]')).toHaveCount(0);
});
