import { expect, test } from '@playwright/test';
import { checkpoint } from './checkpoint';

const criteria = [
  'The name changes to Alex Morgan',
  'First save confirms Alex Morgan',
  'Second save confirms Alex Taylor',
];

test('Update a profile and check the confirmation', async ({ page }) => {
  test.setTimeout(45_000);
  // Self-contained demo only. Use page.goto(...) and real assertions in your app.
  await page.setContent(`
    <html lang="en"><head><title>Profile demo</title><style>
      body { margin:0; background:#eef2f7; color:#182338; font:22px system-ui }
      main { margin:80px auto; padding:36px; width:520px; background:white; border-radius:20px }
      h1 { margin:0 0 24px } label { display:block; margin-bottom:10px }
      input, button { font:inherit; padding:12px; border-radius:8px }
      input { width:calc(100% - 28px); border:2px solid #8291aa }
      button { margin-top:20px; background:#2449af; color:white; border:0 }
      output { display:block; margin-top:24px; color:#176b46; font-weight:700 }
    </style></head><body><main>
      <h1>Your profile</h1><label for="name">Name</label><input id="name" value="Sam">
      <button onclick="document.querySelector('output').textContent = 'Saved for ' + document.querySelector('input').value">Save profile</button>
      <output aria-label="Save result"></output>
    </main></body></html>
  `);
  const name = page.getByRole('textbox', { name: 'Name' });
  const save = page.getByRole('button', { name: 'Save profile' });
  const result = page.getByLabel('Save result');

  await test.step('Show the starting profile', async () => {
    await expect(name).toHaveValue('Sam');
    await checkpoint(page, 'Start: the current name is Sam', {
      criteria, target: name, holdMs: 2200,
    });
  });
  await test.step('Type a new name', async () => {
    await name.click();
    await name.selectText();
    await page.waitForTimeout(600); // Let the viewer see the selected text.
    await name.press('Backspace');
    await name.pressSequentially('Alex Morgan', { delay: 140 });
    await expect(name).toHaveValue('Alex Morgan');
    await checkpoint(page, '1. Name changed — ready to save', {
      criteria, active: 0, target: name, holdMs: 2200,
    });
  });
  await test.step('Save the new name', async () => {
    await save.hover();
    await save.click();
    await expect(result).toHaveText('Saved for Alex Morgan');
    await checkpoint(page, '2. First save confirmed', {
      criteria, active: 1, target: result, holdMs: 2200,
    });
  });
  await test.step('Edit the name again', async () => {
    await name.click();
    await name.selectText();
    await page.waitForTimeout(600); // Show the second edit before replacing it.
    await name.press('Backspace');
    await name.pressSequentially('Alex Taylor', { delay: 140 });
    await expect(name).toHaveValue('Alex Taylor');
    await checkpoint(page, 'Now change the name to Alex Taylor', {
      criteria, target: name, holdMs: 2200,
    });
  });
  await test.step('Save the second edit', async () => {
    await save.hover();
    await save.click();
    await expect(result).toHaveText('Saved for Alex Taylor');
    await checkpoint(page, '3. Second save confirmed', {
      criteria, active: 2, target: result, holdMs: 2800,
    });
  });
  // The helper must not leave its caption or highlight in the app.
  await expect(page.locator('[data-playwright-video-checkpoint]')).toHaveCount(0);
});
