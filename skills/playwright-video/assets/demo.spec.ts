import { expect, test } from '@playwright/test';
import { checkpoint } from './checkpoint';

const criteria = ['The name field shows Alex', 'The confirmation says Saved for Alex'];

test('Update a profile and check the confirmation', async ({ page }) => {
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
  await test.step('Enter the new name', async () => {
    const name = page.getByRole('textbox', { name: 'Name' });
    await name.fill('Alex');
    await expect(name).toHaveValue('Alex');
    await checkpoint(page, '1. Check the name', { criteria, active: 0, target: name });
  });
  // The helper must not leave its caption or highlight in the app.
  await expect(page.locator('[data-playwright-video-checkpoint]')).toHaveCount(0);
  await test.step('Save and check the result', async () => {
    await page.getByRole('button', { name: 'Save profile' }).click();
    const result = page.getByLabel('Save result');
    await expect(result).toHaveText('Saved for Alex');
    await checkpoint(page, '2. Check the confirmation', { criteria, active: 1, target: result });
  });
  await expect(page.locator('[data-playwright-video-checkpoint]')).toHaveCount(0);
});
